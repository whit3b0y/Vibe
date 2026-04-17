"""
Funding farming profitability: long QQQM spot / short XYZ100 perp on Hyperliquid.

Strategy
--------
- Leg A: long QQQM (Invesco Nasdaq-100 ETF), paid cash, TER 0.15%/yr.
- Leg B: short XYZ100 perp on Hyperliquid, USDC margin.
- Net: delta-neutral on Nasdaq-100. PnL = funding received on the short
  leg minus carrying costs.

Hyperliquid funding mechanics
-----------------------------
- Funding is posted every hour; the "fundingRate" field is the hourly rate.
- Longs pay shorts when fundingRate > 0 (we receive on the short leg).
- Rate is capped at 4%/hour.

Costs considered
----------------
- QQQM expense ratio: 0.15% / year.
- Entry + exit trading costs (amortized): configurable, default 20 bps round-trip
  combining ETF spread + Hyperliquid taker fee.
- Opportunity cost on USDC margin: configurable (default 0 = treat USDC at par).

Caveats
-------
- QQQM only trades during US RTH (9:30-16:00 ET, weekdays). Perp trades 24/7.
  You can't rebalance the spot leg overnight / weekends -> basis risk, not
  modelled here. Over multi-week holds this usually averages out.
- XYZ100 is a Nasdaq-100 proxy; tracking vs QQQM is not perfect.

Usage
-----
    pip install requests
    python funding_farming_xyz100.py            # full history since launch
    python funding_farming_xyz100.py --days 30  # last 30 days
"""

from __future__ import annotations

import argparse
import json
import statistics
import sys
import time
from datetime import datetime, timezone
from typing import Any
from urllib import request as urlrequest

API = "https://api.hyperliquid.xyz/info"
COIN = "XYZ100"
HOURS_PER_YEAR = 24 * 365

# Default cost assumptions
QQQM_TER_ANNUAL = 0.0015           # 0.15% / yr
ROUND_TRIP_FEES_BPS = 20.0         # 0.20% one-time
USDC_OPP_COST_ANNUAL = 0.0         # set to e.g. 0.04 to charge 4%/yr on margin


def post(body: dict[str, Any]) -> Any:
    req = urlrequest.Request(
        API,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urlrequest.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def fetch_funding(coin: str, start_ms: int, end_ms: int) -> list[dict]:
    """Walk fundingHistory in 500-record chunks forward from start_ms."""
    out: list[dict] = []
    cursor = start_ms
    while cursor < end_ms:
        batch = post({
            "type": "fundingHistory",
            "coin": coin,
            "startTime": cursor,
            "endTime": end_ms,
        })
        if not batch:
            break
        out.extend(batch)
        last = batch[-1]["time"]
        if last <= cursor or len(batch) < 2:
            break
        cursor = last + 1
        time.sleep(0.15)
    # dedupe on time
    seen = set()
    uniq = []
    for r in out:
        if r["time"] in seen:
            continue
        seen.add(r["time"])
        uniq.append(r)
    uniq.sort(key=lambda r: r["time"])
    return uniq


def analyse(records: list[dict], ter: float, round_trip_bps: float,
            opp: float) -> dict:
    if not records:
        raise SystemExit("No funding records returned.")

    rates = [float(r["fundingRate"]) for r in records]  # hourly
    n = len(rates)

    hourly_ter = ter / HOURS_PER_YEAR
    hourly_opp = opp / HOURS_PER_YEAR
    # Amortize round-trip fees across the observation window so the % metric
    # accounts for entry/exit drag.
    hourly_fee_amort = (round_trip_bps / 10000.0) / n
    threshold = hourly_ter + hourly_opp + hourly_fee_amort

    pos = sum(1 for x in rates if x > 0)
    pay_cost = sum(1 for x in rates if x > threshold)

    cumulative = sum(rates)                    # received (sign = funding sign)
    net = cumulative - threshold * n           # net of all costs
    avg_hourly = cumulative / n
    annualized_gross = avg_hourly * HOURS_PER_YEAR
    annualized_net = annualized_gross - (ter + opp + round_trip_bps / 10000.0 *
                                         HOURS_PER_YEAR / n)

    return {
        "n_hours": n,
        "first": datetime.fromtimestamp(records[0]["time"] / 1000, timezone.utc)
                         .isoformat(),
        "last":  datetime.fromtimestamp(records[-1]["time"] / 1000, timezone.utc)
                         .isoformat(),
        "pct_time_funding_positive": 100 * pos / n,
        "pct_time_profitable_after_costs": 100 * pay_cost / n,
        "threshold_hourly": threshold,
        "mean_hourly_bps": 1e4 * avg_hourly,
        "median_hourly_bps": 1e4 * statistics.median(rates),
        "stdev_hourly_bps": 1e4 * statistics.pstdev(rates),
        "max_hourly_bps": 1e4 * max(rates),
        "min_hourly_bps": 1e4 * min(rates),
        "gross_cum_pct": 100 * cumulative,
        "net_cum_pct": 100 * net,
        "annualized_gross_pct": 100 * annualized_gross,
        "annualized_net_pct": 100 * annualized_net,
    }


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--days", type=int, default=0,
                   help="Lookback window; 0 = since listing.")
    p.add_argument("--coin", default=COIN)
    p.add_argument("--ter", type=float, default=QQQM_TER_ANNUAL)
    p.add_argument("--fees-bps", type=float, default=ROUND_TRIP_FEES_BPS)
    p.add_argument("--opp", type=float, default=USDC_OPP_COST_ANNUAL)
    p.add_argument("--dump", help="Write raw records to this JSON file.")
    args = p.parse_args()

    end_ms = int(time.time() * 1000)
    if args.days > 0:
        start_ms = end_ms - args.days * 86400 * 1000
    else:
        # XYZ100 listed 2025-10-13. Pull a bit earlier to be safe.
        start_ms = int(datetime(2025, 10, 1, tzinfo=timezone.utc).timestamp() * 1000)

    print(f"Fetching fundingHistory for {args.coin}...", file=sys.stderr)
    recs = fetch_funding(args.coin, start_ms, end_ms)
    print(f"  {len(recs)} hourly records", file=sys.stderr)

    if args.dump:
        with open(args.dump, "w") as f:
            json.dump(recs, f)

    stats = analyse(recs, args.ter, args.fees_bps, args.opp)

    print("\n=== XYZ100 funding farming (long QQQM / short perp) ===")
    print(f"Window: {stats['first']} -> {stats['last']} "
          f"({stats['n_hours']} hours)")
    print(f"Cost threshold used: {stats['threshold_hourly']*1e4:.4f} bps/hour "
          f"(TER {args.ter*100:.2f}%/yr, fees {args.fees_bps:.0f}bps round-trip"
          f", opp {args.opp*100:.2f}%/yr)\n")

    print("Funding rate (short-leg, what we receive):")
    print(f"  mean   : {stats['mean_hourly_bps']:+.4f} bps/hour")
    print(f"  median : {stats['median_hourly_bps']:+.4f} bps/hour")
    print(f"  stdev  : {stats['stdev_hourly_bps']:.4f} bps/hour")
    print(f"  min/max: {stats['min_hourly_bps']:+.2f} / "
          f"{stats['max_hourly_bps']:+.2f} bps/hour\n")

    print("Profitability:")
    print(f"  % hours with positive funding        : "
          f"{stats['pct_time_funding_positive']:.2f}%")
    print(f"  % hours profitable AFTER all costs   : "
          f"{stats['pct_time_profitable_after_costs']:.2f}%\n")

    print("Cumulative / annualized carry:")
    print(f"  gross cumulative : {stats['gross_cum_pct']:+.3f}%")
    print(f"  net   cumulative : {stats['net_cum_pct']:+.3f}%")
    print(f"  gross annualized : {stats['annualized_gross_pct']:+.2f}%")
    print(f"  net   annualized : {stats['annualized_net_pct']:+.2f}%")
    return 0


if __name__ == "__main__":
    sys.exit(main())
