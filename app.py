from flask import Flask, render_template, jsonify
import requests
import json
from collections import defaultdict
from dune_client.client import DuneClient

app = Flask(__name__)

DUNE_API_KEY = 'nWErzCBnlM0uuaIT8xnJa7XJUUl8uT0C'
HIP3_DEXES = ['xyz', 'flx', 'vntl', 'hyna', 'km', 'abcd', 'cash']
DEX_NAMES = {'xyz':'XYZ','flx':'Felix','vntl':'Ventuals','hyna':'HyENA','km':'Kinetiq','abcd':'ABCDEx','cash':'dreamcash'}

RWA_TYPES = {
    'SILVER':'commodity','GOLD':'commodity','PLATINUM':'commodity',
    'CL':'commodity','BRENTOIL':'commodity','OIL':'commodity','WTI':'commodity',
    'NATGAS':'commodity','COPPER':'commodity','USOIL':'commodity',
    'XYZ100':'index','USA500':'index','US500':'index','USTECH':'index',
    'SMALL2000':'index','EWY':'index','MAG7':'index',
    'NVDA':'stock','TSLA':'stock','CRCL':'stock','COIN':'stock',
    'BABA':'stock','HOOD':'stock','INTC':'stock','META':'stock',
    'AMZN':'stock','MU':'stock','MSFT':'stock','PLTR':'stock',
    'NFLX':'stock','AMD':'stock','GOOGL':'stock','AAPL':'stock',
    'MSTR':'stock','AVGO':'stock',
    'NUCLEAR':'sector','ENERGY':'sector','ANTHROPIC':'sector',
    'ROBOT':'sector','SEMIS':'sector','BIOTECH':'sector',
    'DEFENSE':'sector','INFOTECH':'sector','SPACEX':'sector',
    'USBOND':'bond',
}

# Ondo symbol families → cumulated into one line per HIP-3 equivalent
# Key = display name, value = dict with hip3 ticker + list of ondo symbols to sum
ONDO_FAMILIES = {
    # Stocks (1:1 mapping)
    "NVDAon":  {"hip3":"NVDA",   "ondo":["NVDAon"],  "cat":"stock",   "label":"NVIDIA"},
    "TSLAon":  {"hip3":"TSLA",   "ondo":["TSLAon"],  "cat":"stock",   "label":"TESLA"},
    "CRCLon":  {"hip3":"CRCL",   "ondo":["CRCLon"],  "cat":"stock",   "label":"CIRCLE"},
    "GOOGLon": {"hip3":"GOOGL",  "ondo":["GOOGLon"], "cat":"stock",   "label":"GOOGLE"},
    "MSTRon":  {"hip3":"MSTR",   "ondo":["MSTRon"],  "cat":"stock",   "label":"MICROSTRATEGY"},
    "MUon":    {"hip3":"MU",     "ondo":["MUon"],    "cat":"stock",   "label":"MICRON"},
    "AAPLon":  {"hip3":"AAPL",   "ondo":["AAPLon"],  "cat":"stock",   "label":"APPLE"},
    "COINon":  {"hip3":"COIN",   "ondo":["COINon"],  "cat":"stock",   "label":"COINBASE"},
    "BABAon":  {"hip3":"BABA",   "ondo":["BABAon"],  "cat":"stock",   "label":"ALIBABA"},
    "AMZNon":  {"hip3":"AMZN",   "ondo":["AMZNon"],  "cat":"stock",   "label":"AMAZON"},
    "NFLXon":  {"hip3":"NFLX",   "ondo":["NFLXon"],  "cat":"stock",   "label":"NETFLIX"},
    "AVGOon":  {"hip3":"AVGO",   "ondo":["AVGOon"],  "cat":"stock",   "label":"BROADCOM"},
    "AMDon":   {"hip3":"AMD",    "ondo":["AMDon"],   "cat":"stock",   "label":"AMD"},
    "HOODon":  {"hip3":"HOOD",   "ondo":["HOODon"],  "cat":"stock",   "label":"ROBINHOOD"},
    "PLTRon":  {"hip3":"PLTR",   "ondo":["PLTRon"],  "cat":"stock",   "label":"PALANTIR"},
    "METAon":  {"hip3":"META",   "ondo":["METAon"],  "cat":"stock",   "label":"META"},
    "INTCon":  {"hip3":"INTC",   "ondo":["INTCon"],  "cat":"stock",   "label":"INTEL"},
    "MSFTon":  {"hip3":"MSFT",   "ondo":["MSFTon"],  "cat":"stock",   "label":"MICROSOFT"},
    # Indices — CUMULATED families
    "QQQ":     {"hip3":"XYZ100", "ondo":["QQQon","TQQQon","SQQQon"], "cat":"index", "label":"QQQ FAMILY (QQQ+TQQQ+SQQQ)"},
    "SPY":     {"hip3":"USA500", "ondo":["SPYon","IVVon"],           "cat":"index", "label":"S&P500 FAMILY (SPY+IVV)"},
    # Commodities — CUMULATED families
    "SILVER":  {"hip3":"SILVER", "ondo":["SLVon"],                   "cat":"commodity", "label":"SILVER (SLV)"},
    "GOLD":    {"hip3":"GOLD",   "ondo":["GLDon","IAUon"],           "cat":"commodity", "label":"GOLD (GLD+IAU)"},
    "OIL":     {"hip3":"CL",     "ondo":["USOon"],                   "cat":"commodity", "label":"OIL (USO → CL)"},
}

SPOT_TIERS = [
    {"label":"Tier 0 — base","taker":0.070,"maker":0.040},
    {"label":"Tier 1 — >$5M","taker":0.060,"maker":0.030},
    {"label":"Tier 2 — >$25M","taker":0.050,"maker":0.020},
    {"label":"Tier 3 — >$100M","taker":0.040,"maker":0.010},
    {"label":"Tier 4 — >$500M","taker":0.035,"maker":0.000},
]

SCENARIOS = {
    "bear": {
        "label": "Bear",
        "ratios": {"commodity": 1, "index": 2, "stock": 3},
        "arguments": [
            "Le ratio Ondo contraint est déjà à 2.3% — même en levant les contraintes, le marché RWA spot reste niche",
            "Le ratio HL crypto natif est à 3.4% pour BTC/ETH/SOL qui sont les assets les plus tradés au monde",
            "Risque d'exécution: un seul MM (Flowdesk), pas de track record spot RWA sur HL, régulation incertaine",
            "Les volumes HIP-3 perp sont concentrés sur les commodities (70%) — le spot commodity sans levier a moins d'attrait",
        ],
    },
    "base": {
        "label": "Base",
        "ratios": {"commodity": 3, "index": 5, "stock": 8},
        "arguments": [
            "Les stocks ont un ratio Ondo spot/HIP-3 perp DÉJÀ à 14.6% malgré les contraintes → 8% est conservateur",
            "Melt résout les contraintes: No KYC (×2-3x TAM), limit orders + Flowdesk MM, interface HL, 24/7, composabilité DeFi",
            "Les indices (QQQ $6M/jour sur Ondo) prouvent une demande organique à 5% du perp",
            "Les commodities restent à 3% car dominées par la spéculation levier — le spot sans levier attire moins",
        ],
    },
    "bull": {
        "label": "Bull",
        "ratios": {"commodity": 8, "index": 15, "stock": 20},
        "arguments": [
            "Le ratio crypto global spot/perp est à 25% — 20% stocks est encore en dessous sur un marché mature",
            "Melt = MONOPOLE spot RWA sur HL — pas de concurrence contrairement au BTC spot (100+ exchanges)",
            "Le ratio Ondo stocks est DÉJÀ à 14.6% AVEC KYC → 20% sans contraintes est justifié",
            "Effets réseau DeFi: delta-neutral, spot comme collateral perp, lending, yield → volume additionnel",
            "Le marché tokenized stocks a fait ×30 en 2025 — les perp HIP-3 vont aussi croître → le base absolu augmente",
        ],
    },
}

def fetch_hl_crypto_ratios():
    try:
        r = requests.post('https://api.hyperliquid.xyz/info',
            json={"type":"metaAndAssetCtxs"}, timeout=10)
        data = r.json()
        coins = data[0].get('universe', [])
        ctxs = data[1]
        targets = ['BTC','ETH','SOL','HYPE','XRP']
        perp_vols = {}
        total_perp = 0
        for i, c in enumerate(coins):
            name = c.get('name','')
            vol = float(ctxs[i].get('dayNtlVlm', 0))
            total_perp += vol
            if name in targets:
                perp_vols[name] = round(vol)
            if name == 'PAXG':
                perp_vols['PAXG'] = round(vol)
        r2 = requests.post('https://api.hyperliquid.xyz/info',
            json={"type":"spotMetaAndAssetCtxs"}, timeout=10)
        sctxs = r2.json()[1]
        total_spot = sum(float(c.get('dayNtlVlm', 0)) for c in sctxs)
        return {
            "perp_vols": perp_vols,
            "total_perp": round(total_perp),
            "total_spot": round(total_spot),
            "ratio_hl": round(total_spot / total_perp * 100, 2) if total_perp > 0 else 0,
        }
    except Exception as e:
        return {"error": str(e), "perp_vols": {}, "total_perp": 0, "total_spot": 0, "ratio_hl": 3.4}

def fetch_hip3_rwa():
    all_tickers = defaultdict(lambda: {"total_vol": 0, "dexes": {}})
    for dex in HIP3_DEXES:
        try:
            r = requests.post('https://api.hyperliquid.xyz/info',
                json={"type":"metaAndAssetCtxs","dex":dex}, timeout=10)
            data = r.json()
            if not data or len(data) < 2: continue
            coins = data[0].get('universe', [])
            ctxs = data[1]
            for i, c in enumerate(coins):
                raw = c.get('name','')
                ticker = raw.split(':')[-1] if ':' in raw else raw
                vol = float(ctxs[i].get('dayNtlVlm', 0)) if i < len(ctxs) else 0
                if vol > 0:
                    all_tickers[ticker]["total_vol"] += vol
                    all_tickers[ticker]["dexes"][DEX_NAMES[dex]] = vol
        except: continue

    rwa = []
    for ticker, data in all_tickers.items():
        if ticker in RWA_TYPES:
            rwa.append({
                "ticker": ticker, "type": RWA_TYPES[ticker],
                "vol24h": round(data["total_vol"]),
                "dexes": {k: round(v) for k, v in data["dexes"].items()},
            })
    rwa.sort(key=lambda x: x['vol24h'], reverse=True)

    # Aggregate by category
    by_cat = defaultdict(int)
    for t in rwa:
        by_cat[t['type']] += t['vol24h']

    return {
        "rwa_perps": rwa,
        "total_rwa_vol": sum(t['vol24h'] for t in rwa),
        "total_hip3_vol": round(sum(d['total_vol'] for d in all_tickers.values())),
        "by_category": dict(by_cat),
    }

def fetch_ondo_volumes():
    try:
        dune = DuneClient(DUNE_API_KEY)
        result = dune.get_latest_result(6372839)
        rows = result.result.rows
    except:
        import csv
        rows = []
        with open('ondo_volumes.csv') as f:
            for r in csv.DictReader(f):
                rows.append({'day':r['day'],'symbol':r['symbol'],
                             'volume':float(r['volume']),'total_volume_daily':float(r['total_volume_daily'])})

    symbol_data = defaultdict(lambda: {"total":0,"last_7d":0,"last_30d":0})
    daily_totals = defaultdict(float)
    days_sorted = sorted(set(r['day'] for r in rows), reverse=True)
    last_7, last_30 = set(days_sorted[:7]), set(days_sorted[:30])

    for r in rows:
        s, v = r['symbol'], float(r['volume']) if isinstance(r['volume'],(int,float,str)) else 0
        symbol_data[s]['total'] += v
        if r['day'] in last_7: symbol_data[s]['last_7d'] += v
        if r['day'] in last_30: symbol_data[s]['last_30d'] += v
        daily_totals[r['day']] += v

    # Build cumulated families
    families = []
    last_day = days_sorted[0] if days_sorted else None
    # Build per-symbol last-day volume
    symbol_last1d = defaultdict(float)
    for r in rows:
        if r['day'] == last_day:
            symbol_last1d[r['symbol']] += float(r['volume']) if isinstance(r['volume'],(int,float,str)) else 0

    for fam_key, fam in ONDO_FAMILIES.items():
        total = sum(symbol_data[s]['total'] for s in fam['ondo'] if s in symbol_data)
        avg30 = sum(symbol_data[s]['last_30d'] for s in fam['ondo'] if s in symbol_data) / 30
        avg7 = sum(symbol_data[s]['last_7d'] for s in fam['ondo'] if s in symbol_data) / 7
        vol_24h = sum(symbol_last1d[s] for s in fam['ondo'])
        if total > 0:
            families.append({
                "family": fam_key,
                "label": fam['label'],
                "hip3_ticker": fam['hip3'],
                "cat": fam['cat'],
                "ondo_symbols": fam['ondo'],
                "total_volume": round(total),
                "avg_30d": round(avg30),
                "avg_7d": round(avg7),
                "vol_24h": round(vol_24h),
            })
    families.sort(key=lambda x: x['avg_30d'], reverse=True)

    # Aggregate by category
    by_cat = defaultdict(int)
    for f in families:
        by_cat[f['cat']] += f['avg_30d']

    daily = [{"day":d,"volume":round(daily_totals[d])} for d in sorted(daily_totals.keys(), reverse=True)[:60]]

    return {
        "families": families,
        "daily_totals": daily,
        "date_range": {"start": days_sorted[-1], "end": days_sorted[0]},
        "total_days": len(days_sorted),
        "by_category": dict(by_cat),
    }

@app.route('/')
def index():
    return render_template('dashboard.html')

@app.route('/api/data')
def api_data():
    hl = fetch_hl_crypto_ratios()
    hip3 = fetch_hip3_rwa()
    ondo = fetch_ondo_volumes()

    # Match families to HIP-3 perp volumes
    hip3_by_ticker = {t['ticker']: t for t in hip3['rwa_perps']}
    for fam in ondo['families']:
        match = hip3_by_ticker.get(fam['hip3_ticker'], {})
        fam['perp_vol_24h'] = match.get('vol24h', 0)
        fam['perp_dexes'] = match.get('dexes', {})

    # Compute current constrained ratios per category
    current_ratios = {}
    for cat in ['commodity','index','stock']:
        ondo_cat = ondo['by_category'].get(cat, 0)
        hip3_cat = hip3['by_category'].get(cat, 0)
        current_ratios[cat] = round(ondo_cat / hip3_cat * 100, 2) if hip3_cat > 0 else 0

    return jsonify({
        "hl_ratios": hl,
        "hip3": hip3,
        "ondo": ondo,
        "spot_tiers": SPOT_TIERS,
        "scenarios": SCENARIOS,
        "current_ratios": current_ratios,
        "rwa_league": [
            {"name":"Ondo","count":263,"value":656.5,"growth":18.82,"share":60.19},
            {"name":"xStocks (BackedFi)","count":75,"value":262.7,"growth":22.46,"share":24.08},
            {"name":"Securitize","count":1,"value":83.0,"growth":-18.01,"share":7.61},
            {"name":"Superstate","count":3,"value":30.8,"growth":28.25,"share":2.82},
            {"name":"WisdomTree","count":6,"value":22.8,"growth":0.06,"share":2.09},
            {"name":"Robinhood","count":1591,"value":15.5,"growth":5.48,"share":1.42},
            {"name":"STOKR","count":2,"value":8.6,"growth":17.52,"share":0.79},
            {"name":"Backed Finance","count":3,"value":5.3,"growth":7.87,"share":0.49},
            {"name":"Dinari","count":89,"value":3.0,"growth":6.20,"share":0.27},
            {"name":"Remora Markets","count":5,"value":1.8,"growth":-56.46,"share":0.16},
        ],
        "market_stats": {
            "stocks_mcap": 1.09e9, "stocks_monthly_vol": 2.48e9,
            "commodities_mcap": 7.57e9, "commodities_monthly_vol": 12.34e9,
        },
    })

if __name__ == '__main__':
    app.run(debug=True, port=8080)
