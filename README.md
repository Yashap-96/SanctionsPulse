# SanctionsPulse

**Real-time OFAC sanctions monitoring dashboard** — daily diff tracking, interactive world map, AI-powered intelligence summaries, and a unified sanctions screening engine.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646cff.svg)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8.svg)](https://tailwindcss.com)
[![MapLibre](https://img.shields.io/badge/MapLibre_GL-5-396CB2.svg)](https://maplibre.org)

---

## What is SanctionsPulse?

SanctionsPulse is an open-source, interactive dashboard that tracks daily changes to the U.S. Treasury OFAC (Office of Foreign Assets Control) sanctions lists. It monitors both the **SDN (Specially Designated Nationals)** and **Consolidated** sanctions lists, providing:

- A real-time overview of **19,000+ sanctioned entities** across **178 countries** and **75 active programs**
- Visual geospatial analysis via an interactive world map
- AI-generated intelligence briefings for daily changes
- A **unified screening engine** for name, address, ID, crypto wallet, and vessel screening
- Detailed program-level breakdowns across all active OFAC sanctions programs

> **Disclaimer:** SanctionsPulse is an independent open-source project for **educational and research purposes only**. It is not affiliated with, endorsed by, or a substitute for the U.S. Department of the Treasury's Office of Foreign Assets Control (OFAC). For official sanctions data and compliance, visit [ofac.treasury.gov](https://ofac.treasury.gov).

---

## Features

### Dashboard
- **Stats Overview** — Total SDN entries, Consolidated entries, daily additions, and daily removals with info tooltips
- **List Composition** — Collapsible breakdown of entry types (Entity, Individual, Vessel, Aircraft) and data categories (IDs, crypto wallets, aliases)
- **Full Sanctions Registry** — Searchable, filterable registry of all 19,000+ entries with pagination (50/page), filters by entry type, list type, program, and country
- **Daily Changes Table** — Tabbed view of additions, removals, and updates with color-coded rows, expandable detail rows (aliases, IDs, crypto wallets, DOB, nationalities)
- **Activity Timeline** — 15-day rolling area chart showing daily additions, removals, and updates
- **Programs Panel** — Top active sanctions programs sorted by entry count with daily change indicators

### Sanctions Screening Engine
- **Name Screening** — Fuzzy matching with Levenshtein distance, Soundex (phonetic), token-based (handles word reordering), and substring matching
- **Alias Matching** — Screens against all known aliases for each entity
- **Address & Country Screening** — Match against physical addresses and ISO2 country codes
- **ID Document Screening** — Exact/partial match on passport numbers, tax IDs, registration numbers
- **Crypto Wallet Screening** — Match against OFAC-listed BTC, ETH, USDT, and other wallet addresses
- **Vessel/Aircraft Screening** — Fuzzy name match filtered to vessel and aircraft entry types
- **Composite Scoring** — 0–100% match scores with risk levels (CRITICAL / HIGH / MEDIUM / LOW)
- **Adjustable Threshold** — Slider to tune sensitivity from broad (30%) to strict (100%)
- **Performance** — Screens 19,000+ entries in under 100ms client-side

### Interactive World Map
- **Choropleth Layer** — Countries colored by sanctions density (purple-to-red gradient scale)
- **Bubble Overlay** — Pulsing markers for countries with weekly changes (green = additions, red = removals)
- **Hover Tooltips** — Quick country stats on hover
- **Click Popups** — Detailed breakdown: total entries, SDN/Consolidated split, active programs, weekly changes
- **Filter Controls** — Toggle between All, SDN Only, and Consolidated Only views
- **Color Scale Legend** — Reference guide for choropleth intensity

### Programs Explorer
- **75 Active OFAC Programs** — Complete catalog of all active sanctions programs
- **Search & Filter** — Find programs by name or code
- **Sort Options** — By most entries, most recent activity, or most active this week
- **Program Cards** — Code badge, description, SDN/Consolidated proportion bar, weekly activity, last updated date

### AI Intelligence Center
- **Executive Summary** — AI-generated weekly briefing analyzing the significance of sanctions changes
- **Notable Entities** — Highlighted new designations with program badges and significance analysis
- **Risk Implications** — Color-coded risk assessments (HIGH / MEDIUM / LOW) for different areas
- **Program Highlights** — Weekly activity breakdown by sanctions program
- **Geographic Hotspots** — Regional analysis with trend indicators (Escalating / Steady / Declining)
- **Compliance Recommendations** — Actionable items for compliance teams
- **Interactive Chat** — Ask questions about sanctions data, programs, and compliance implications (requires Groq API key)

### Data Pipeline
- **Automated Daily Updates** — GitHub Actions cron job fetches OFAC data every day at 13:00 UTC (9 AM ET)
- **XML Parsing** — Full-tree parser with cross-reference resolution for 117MB+ OFAC Advanced XML files
- **Snapshot Diffing** — UID-based comparison detecting additions, removals, and field-level updates
- **AI Summary Generation** — Groq-powered analysis of daily changes (optional)
- **10-Step Pipeline** — Fetch → Rotate → Parse → Diff → AI Summary → Map Data → Program Data → Overview Stats → Full Registry → Timeline

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + TypeScript | Component-based UI with strong typing |
| **Build** | Vite 7 | Fast HMR, tree-shaking, native TS support |
| **Styling** | Tailwind CSS 4 | Utility-first CSS with dark theme |
| **Map** | MapLibre GL JS 5 | Open-source vector map with WebGL rendering |
| **Charts** | Recharts | React-native composable charting |
| **AI** | Groq API (llama-3.3-70b) | Fast inference for intelligence summaries |
| **Data Pipeline** | Python 3.11+ (lxml) | Streaming XML parsing and diffing |
| **Automation** | GitHub Actions | Weekly cron, zero-cost CI/CD |
| **Deployment** | Vercel | Edge Functions, CDN, env var management |
| **Data Storage** | JSON files in `/data` | Git-trackable, zero external dependencies |

---

## Quick Start

### Prerequisites
- **Node.js 18+** and npm (for the frontend)
- **Python 3.11+** (only needed if you want to run the data pipeline to fetch fresh OFAC data)

### Installation

```bash
# Clone the repository
git clone https://github.com/Yashap-96/SanctionsPulse.git
cd SanctionsPulse

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the dashboard.

The app ships with pre-fetched sanctions data so it works immediately — no API keys, no Python, and no data pipeline setup required for the dashboard, map, programs, and screening features.

### Refresh OFAC Data (Optional)

To fetch the latest sanctions data from OFAC yourself:

```bash
cd scripts
pip install -r requirements.txt
python run_daily.py
```

This downloads ~121MB of XML from OFAC, parses it, computes diffs, and builds all JSON data files. Requires ~1GB RAM for XML parsing.

### Enable AI Features (Optional)

The AI intelligence summaries and interactive chat require a free Groq API key:

1. Get a key at [console.groq.com/keys](https://console.groq.com/keys)
2. Create a `.env` file in the project root:
   ```bash
   GROQ_API_KEY=gsk_your_key_here
   ```
3. Restart the dev server — the Intelligence page will now show AI-generated summaries and the chat will be functional

---

## Project Structure

```
SanctionsPulse/
├── src/
│   ├── components/
│   │   ├── layout/          # Header, Sidebar, Footer
│   │   ├── dashboard/       # StatsCards, WeeklyDiffTable, ProgramsPanel, TimelineChart, FullRegistry, DataOverview
│   │   ├── map/             # SanctionsMap, MapLegend, MapControls
│   │   ├── intelligence/    # AISummaryPanel, IntelChat
│   │   ├── screening/       # ScreeningForm, ScreeningResults
│   │   └── common/          # Badge, LoadingSpinner, ErrorBoundary
│   ├── pages/               # DashboardPage, MapPage, ProgramsPage, IntelligencePage, ScreeningPage
│   ├── hooks/               # useSanctionsData, useMapData, useAISummary, useRegistryData, useTimelineData
│   └── lib/                 # types, constants, utils, mapStyles, screening
│
├── scripts/                 # Python data pipeline
│   ├── fetch_lists.py       # Download OFAC XML files
│   ├── parse_xml.py         # Parse XML → JSON (cross-reference resolution)
│   ├── diff_snapshots.py    # Compare snapshots → daily diff
│   ├── generate_summary.py  # AI summary via Groq API
│   ├── build_map_data.py    # Aggregate by country for map
│   ├── build_program_data.py# Extract program metadata
│   ├── build_overview_stats.py # Entry type + data category stats
│   ├── build_full_registry.py  # Combine SDN + Consolidated → full registry
│   ├── build_timeline.py    # 15-day rolling activity timeline
│   └── run_daily.py         # Orchestrator (runs all 10 steps)
│
├── api/                     # Vercel Edge Functions
│   ├── proxy-ofac.ts        # OFAC API proxy (adds User-Agent)
│   ├── ai-summary.ts        # Groq API proxy (hides API key)
│   └── sanctions-data.ts    # Data file server with caching
│
├── data/                    # Git-tracked JSON data
│   ├── meta.json            # Dashboard metadata
│   ├── overview_stats.json  # Entry type + data category aggregations
│   ├── diffs/               # Daily diff files
│   ├── summaries/           # AI-generated intelligence summaries
│   ├── map/                 # Country-level aggregations
│   ├── programs/            # Sanctions program metadata
│   ├── registry/            # Full combined registry (19,000+ entries)
│   ├── timeline/            # 15-day rolling activity data
│   └── snapshots/           # Full list snapshots (gitignored, large files)
│
├── public/
│   ├── countries.geojson    # 258-country Natural Earth boundaries
│   └── favicon.svg          # Lightning bolt icon
│
└── .github/workflows/
    └── daily-update.yml     # Automated daily 13:00 UTC pipeline + Vercel deploy
```

---

## Data Pipeline

The Python data pipeline runs daily via GitHub Actions (or manually) to fetch and process OFAC sanctions data.

### How It Works

```
OFAC SLS API ──► fetch_lists.py ──► SDN_ADVANCED.XML (~117MB) + CONS_ADVANCED.XML (~4MB)
                                           │
                                    parse_xml.py ──► data/snapshots/*_latest.json
                                           │
                                    diff_snapshots.py ──► data/diffs/daily_*.json
                                           │
                              generate_summary.py ──► data/summaries/ai_*.json (Groq AI)
                                           │
                              build_map_data.py ──► data/map/country_sanctions.json
                              build_program_data.py ──► data/programs/active_programs.json
                              build_overview_stats.py ──► data/overview_stats.json
                              build_full_registry.py ──► data/registry/full_registry.json
                              build_timeline.py ──► data/timeline/activity_timeline.json
                                           │
                              git commit + push + vercel deploy (automated)
```

### Running Manually

```bash
cd scripts
pip install -r requirements.txt

# Run the full pipeline (all 10 steps)
python run_daily.py

# Or run individual steps
python fetch_lists.py            # Download OFAC XML files (~121MB total)
python parse_xml.py              # Parse XML → JSON (cross-reference resolution)
python diff_snapshots.py         # Compute daily diff
python generate_summary.py       # Generate AI summary (requires GROQ_API_KEY env var)
python build_map_data.py         # Build country aggregations for map
python build_program_data.py     # Build program metadata
python build_overview_stats.py   # Build entry type + data category stats
python build_full_registry.py    # Combine SDN + Consolidated into full registry
python build_timeline.py         # Build 15-day rolling activity timeline
```

> **Note:** `fetch_lists.py` downloads ~121MB of XML files. The parse step loads the full XML tree into memory, so ensure you have at least 1GB of available RAM.

### OFAC Data Source

Data is sourced from the [OFAC Sanctions List Service (SLS)](https://sanctionslistservice.ofac.treas.gov/) using the Advanced XML format, which provides the full data model including:

- Unique entry IDs (UIDs) for diffing
- Entity classification (Entity, Individual, Vessel, Aircraft)
- Sanctions program associations
- Addresses with country codes for geospatial mapping
- Identification documents and date-of-birth data

---

## Deployment

### Vercel (Recommended)

1. Push the repository to GitHub
2. Connect the repo at [vercel.com/new](https://vercel.com/new)
3. Set environment variables in the Vercel dashboard:
   - `GROQ_API_KEY` — Required for AI chat features
4. Deploy — Vercel auto-detects the Vite framework

The `vercel.json` is pre-configured with:
- SPA routing (all paths → `index.html`)
- API route rewrites (`/api/*` → Edge Functions)
- Data file serving (`/data/*` → static JSON with caching)

### GitHub Actions

The daily update workflow (`.github/workflows/daily-update.yml`) runs automatically every day at 13:00 UTC (9 AM ET). To enable it:

1. Add these repository secrets (Settings → Secrets → Actions):
   - `GROQ_API_KEY` — For AI summary generation
   - `VERCEL_TOKEN` — For automatic Vercel deployment
   - `VERCEL_ORG_ID` — Your Vercel org ID
   - `VERCEL_PROJECT_ID` — Your Vercel project ID
2. The workflow will fetch OFAC data, compute diffs, generate AI summaries, build all data files, commit to repo, and deploy to Vercel

You can also trigger it manually via the **Actions** tab → **Run workflow**.

---

## Design System

SanctionsPulse uses a dark glassmorphism theme inspired by [World Monitor](https://github.com/koala73/worldmonitor):

| Element | Value |
|---------|-------|
| Background | `#0a0a0a` |
| Card Background | `rgba(255, 255, 255, 0.05)` with `backdrop-blur(12px)` |
| Card Border | `rgba(255, 255, 255, 0.1)` |
| Header Font | JetBrains Mono (monospace) |
| Body Font | Inter (sans-serif) |
| Green (additions) | `#22c55e` |
| Red (removals) | `#ef4444` |
| Amber (updates) | `#f59e0b` |
| Blue (SDN) | `#3b82f6` |
| Purple (Consolidated) | `#a855f7` |
| Cyan (AI/info) | `#06b6d4` |

### Program Color Coding

Major sanctions programs have distinct colors for quick visual identification:

| Program | Color |
|---------|-------|
| IRAN | Red `#ef4444` |
| RUSSIA | Amber `#f59e0b` |
| CUBA | Blue `#3b82f6` |
| DPRK | Purple `#a855f7` |
| SDGT | Pink `#ec4899` |
| VENEZUELA | Teal `#14b8a6` |
| SYRIA | Orange `#f97316` |
| CYBER2 | Cyan `#06b6d4` |
| GLOMAG | Lime `#84cc16` |

---

## Available Commands

```bash
# Development
npm run dev              # Start Vite dev server (http://localhost:5173)
npm run build            # Production build (TypeScript check + Vite build + copy data/)
npm run preview          # Preview production build locally
npm run lint             # ESLint

# Data Pipeline (run from scripts/ directory)
cd scripts && pip install -r requirements.txt
python run_daily.py              # Full daily pipeline (all 10 steps)
python fetch_lists.py            # Download OFAC XML only
python parse_xml.py              # Parse XML → JSON only

# Deployment
vercel --prod --yes              # Manual deploy to Vercel production
```

---

## OFAC Sanctions Programs Tracked

SanctionsPulse monitors **75 active OFAC sanctions programs** including:

- **IRAN** — Iran nuclear proliferation and terrorism support
- **RUSSIA-EO14024** — Russia harmful foreign activities
- **SDGT** — Specially Designated Global Terrorist
- **SDNT** — Specially Designated Narcotics Trafficker
- **DPRK / DPRK2 / DPRK3 / DPRK4** — North Korea WMD programs
- **UKRAINE-EO13660 / 13661 / 13662** — Ukraine-related sanctions
- **CUBA** — Cuba comprehensive sanctions
- **SYRIA** — Syria regime sanctions
- **VENEZUELA** — Venezuela / Maduro regime
- **CYBER2** — Malicious cyber-enabled activities
- **GLOMAG** — Global Magnitsky (human rights)
- **TCO** — Transnational criminal organizations
- **CMIC / NS-CMIC** — Chinese military-industrial complex
- **WMD / NPWMD** — Weapons of mass destruction
- **IRGC** — Islamic Revolutionary Guard Corps
- And 20+ more regional and thematic programs

---

## Contributing

Contributions are welcome! To get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and ensure the build passes: `npm run build`
4. Commit with a descriptive message
5. Push to your fork and open a Pull Request

Please follow the existing code style — TypeScript strict mode, Tailwind utility classes, component-per-file pattern.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **[OFAC](https://ofac.treasury.gov/)** — Sanctions data source
- **[World Monitor](https://github.com/koala73/worldmonitor)** — Design inspiration
- **[MapLibre GL JS](https://maplibre.org/)** — Open-source map rendering
- **[Groq](https://groq.com/)** — Fast AI inference
- **[CARTO](https://carto.com/)** — Dark Matter basemap tiles
- **[Natural Earth](https://www.naturalearthdata.com/)** — Country boundary data
