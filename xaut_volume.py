"""
Script to fetch XAUT/USDC average daily spot volume on Hyperliquid
over the last 2 months using the Hyperliquid API.
"""

import requests
import json
from datetime import datetime, timedelta

API_URL = "https://api.hyperliquid.xyz/info"


def get_xaut_spot_coin():
    """Find the XAUT spot coin identifier from spotMeta."""
    resp = requests.post(API_URL, json={"type": "spotMeta"})
    resp.raise_for_status()
    data = resp.json()

    tokens = data.get("tokens", [])
    universe = data.get("universe", [])

    # Find XAUT token index
    xaut_token_index = None
    for token in tokens:
        if token.get("name", "").upper() in ("XAUT", "XAUT0"):
            xaut_token_index = token.get("index")
            print(f"Found token: {token['name']}, index={xaut_token_index}")
            break

    if xaut_token_index is None:
        # Try alternative names (remapping)
        for token in tokens:
            name = token.get("name", "").upper()
            if "XAUT" in name or "XAU" in name:
                xaut_token_index = token.get("index")
                print(f"Found token (alt): {token['name']}, index={xaut_token_index}")
                break

    if xaut_token_index is None:
        print("XAUT token not found. Available tokens:")
        for t in tokens:
            print(f"  {t.get('name')} (index={t.get('index')})")
        return None

    # Find the spot pair index for XAUT/USDC (token 0 = USDC)
    for i, pair in enumerate(universe):
        pair_tokens = pair.get("tokens", [])
        if xaut_token_index in pair_tokens and 0 in pair_tokens:
            coin = f"@{i}"
            print(f"XAUT/USDC spot pair found: coin={coin}, pair_tokens={pair_tokens}")
            return coin

    # Also try XAUT/USDC as name directly
    print("Spot pair not found by index, trying 'XAUT/USDC' directly...")
    return "XAUT/USDC"


def get_daily_candles(coin, days=60):
    """Fetch daily candles for the last N days."""
    end_time = int(datetime.now().timestamp() * 1000)
    start_time = int((datetime.now() - timedelta(days=days)).timestamp() * 1000)

    payload = {
        "type": "candleSnapshot",
        "req": {
            "coin": coin,
            "interval": "1d",
            "startTime": start_time,
            "endTime": end_time,
        },
    }

    print(f"\nFetching candles: coin={coin}, interval=1d")
    print(f"  From: {datetime.fromtimestamp(start_time / 1000)}")
    print(f"  To:   {datetime.fromtimestamp(end_time / 1000)}")

    resp = requests.post(API_URL, json=payload)
    resp.raise_for_status()
    return resp.json()


def main():
    print("=" * 60)
    print("XAUT/USDC Spot Volume on Hyperliquid - Last 2 Months")
    print("=" * 60)

    # Step 1: Find XAUT spot coin identifier
    coin = get_xaut_spot_coin()
    if coin is None:
        print("\nCould not find XAUT. Exiting.")
        return

    # Step 2: Fetch daily candles
    candles = get_daily_candles(coin)

    if not candles:
        print("\nNo candle data returned. The pair may have very low activity.")
        return

    # Step 3: Analyze volume
    print(f"\n{'Date':<12} {'Volume (USD)':>15} {'Trades':>8} {'Close':>10}")
    print("-" * 50)

    total_volume = 0
    volumes = []

    for candle in candles:
        ts = candle.get("t", 0) / 1000
        date_str = datetime.fromtimestamp(ts).strftime("%Y-%m-%d")
        volume = float(candle.get("v", 0))
        close = float(candle.get("c", 0))
        trades = candle.get("n", 0)

        total_volume += volume
        volumes.append(volume)

        print(f"{date_str:<12} {volume:>15,.2f} {trades:>8} {close:>10,.2f}")

    num_days = len(volumes)
    avg_volume = total_volume / num_days if num_days > 0 else 0

    print("-" * 50)
    print(f"\nPeriod: {num_days} days")
    print(f"Total volume:   ${total_volume:,.2f}")
    print(f"Average daily:  ${avg_volume:,.2f}")
    print(f"Min daily:      ${min(volumes):,.2f}" if volumes else "")
    print(f"Max daily:      ${max(volumes):,.2f}" if volumes else "")
    print(f"Median daily:   ${sorted(volumes)[len(volumes)//2]:,.2f}" if volumes else "")


if __name__ == "__main__":
    main()
