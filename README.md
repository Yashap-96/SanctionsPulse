# SanctionsPulse

**Real-time OFAC sanctions monitoring dashboard** — daily diff tracking, interactive world map, AI-powered intelligence summaries, and a unified sanctions screening engine.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646cff.svg)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8.svg)](https://tailwindcss.com)
[![MapLibre](https://img.shields.io/badge/MapLibre_GL-5-396CB2.svg)](https://maplibre.org)

**Live Demo:** [sanctionspulse.vercel.app](https://sanctionspulse.vercel.app)

> **Disclaimer:** This is an independent open-source project for **educational and research purposes only**. It is not affiliated with, endorsed by, or a substitute for OFAC. For official sanctions data, visit [ofac.treasury.gov](https://ofac.treasury.gov).

---

## What It Does

SanctionsPulse tracks daily changes to the U.S. Treasury OFAC sanctions lists (SDN + Consolidated) — currently **19,000+ entities** across **178 countries** and **75 active programs**.

| Feature | Description |
|---------|-------------|
| **Dashboard** | Stats overview, full searchable registry (19K+ entries), daily changes table, activity timeline, programs panel |
| **Screening** | Screen names, addresses, IDs, crypto wallets, and vessels against the full OFAC list with fuzzy/phonetic matching — under 100ms |
| **Map** | Interactive choropleth + bubble overlay showing sanctions density by country with click/hover details |
| **Programs** | Searchable explorer for all 75 active OFAC sanctions programs with entry counts and daily activity |
| **Intelligence** | AI-generated daily briefings (executive summary, risk analysis, hotspots) + interactive chat (requires Groq API key) |

---

## Quick Start

### Prerequisites
- **Node.js 18+** and npm

### Run Locally

```bash
git clone https://github.com/Yashap-96/SanctionsPulse.git
cd SanctionsPulse
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The app ships with pre-fetched data — no API keys or Python setup required.

### Refresh OFAC Data (Optional)

Requires **Python 3.11+**:

```bash
cd scripts
pip install -r requirements.txt
python run_daily.py
```

Downloads ~121MB of XML from OFAC, parses, diffs, and rebuilds all data files. Needs ~1GB RAM.

### Enable AI Features (Optional)

1. Get a free key at [console.groq.com/keys](https://console.groq.com/keys)
2. Create `.env` in project root: `GROQ_API_KEY=gsk_your_key_here`
3. Restart the dev server

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite 7 |
| Styling | Tailwind CSS 4 |
| Map | MapLibre GL JS |
| Charts | Recharts |
| AI | Groq API (llama-3.3-70b) |
| Data Pipeline | Python 3.11+ (lxml) |
| Automation | GitHub Actions (daily cron) |
| Deployment | Vercel (Edge Functions) |
| Data | JSON files in `/data` (git-tracked) |

---

## Deployment

### Vercel

1. Fork this repo and connect it at [vercel.com/new](https://vercel.com/new)
2. Set `GROQ_API_KEY` in Vercel environment variables (for AI chat)
3. Deploy — Vercel auto-detects Vite

### Automated Daily Updates

The GitHub Actions workflow runs daily at 13:00 UTC. Add these repo secrets:

- `GROQ_API_KEY` — AI summary generation
- `VERCEL_TOKEN` — Auto-deploy to Vercel
- `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` — Vercel project identifiers

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Ensure the build passes: `npm run build`
4. Open a Pull Request

---

## License

MIT — see [LICENSE](LICENSE).

## Acknowledgments

- **[OFAC](https://ofac.treasury.gov/)** — Sanctions data source
- **[World Monitor](https://github.com/koala73/worldmonitor)** — Design inspiration
- **[MapLibre GL JS](https://maplibre.org/)** — Open-source map rendering
- **[Groq](https://groq.com/)** — Fast AI inference
- **[CARTO](https://carto.com/)** — Dark Matter basemap tiles
- **[Natural Earth](https://www.naturalearthdata.com/)** — Country boundary data
