# SanctionsPulse

**Real-time OFAC sanctions monitoring dashboard** — weekly diff tracking, interactive world map, and AI-powered intelligence summaries.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646cff.svg)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8.svg)](https://tailwindcss.com)
[![MapLibre](https://img.shields.io/badge/MapLibre_GL-5-396CB2.svg)](https://maplibre.org)

---

## What is SanctionsPulse?

SanctionsPulse is an open-source, interactive dashboard that tracks weekly changes to the U.S. Treasury OFAC (Office of Foreign Assets Control) sanctions lists. It monitors both the **SDN (Specially Designated Nationals)** and **Consolidated** sanctions lists, providing:

- A real-time overview of sanctions activity
- Visual geospatial analysis via an interactive world map
- AI-generated intelligence briefings for each week's changes
- Detailed program-level breakdowns across all 45+ active OFAC sanctions programs

> **Disclaimer:** SanctionsPulse is an independent open-source project for **educational and research purposes only**. It is not affiliated with, endorsed by, or a substitute for the U.S. Department of the Treasury's Office of Foreign Assets Control (OFAC). For official sanctions data and compliance, visit [ofac.treasury.gov](https://ofac.treasury.gov).

---

## Features

### Dashboard
- **Stats Overview** — Total SDN entries, Consolidated entries, weekly additions, and weekly removals at a glance
- **Weekly Changes Table** — Tabbed view of additions, removals, and updates with color-coded rows, program badges, and entity details
- **Programs Panel** — Top active sanctions programs sorted by entry count with weekly change indicators

### Interactive World Map
- **Choropleth Layer** — Countries colored by sanctions density (purple-to-red gradient scale)
- **Bubble Overlay** — Pulsing markers for countries with weekly changes (green = additions, red = removals)
- **Hover Tooltips** — Quick country stats on hover
- **Click Popups** — Detailed breakdown: total entries, SDN/Consolidated split, active programs, weekly changes
- **Filter Controls** — Toggle between All, SDN Only, and Consolidated Only views
- **Color Scale Legend** — Reference guide for choropleth intensity

### Programs Explorer
- **45 Active OFAC Programs** — Complete catalog of all active sanctions programs
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
- **Automated Weekly Updates** — GitHub Actions cron job fetches OFAC data every Monday at 09:00 UTC
- **XML Parsing** — Memory-efficient streaming parser for 50MB+ OFAC Advanced XML files
- **Snapshot Diffing** — UID-based comparison detecting additions, removals, and field-level updates
- **AI Summary Generation** — Groq-powered analysis of weekly changes (optional)

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
- Node.js 18+ and npm
- Python 3.11+ (for data pipeline only)

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

The app ships with sample data so it works immediately — no API keys or data pipeline setup required.

### Enable AI Chat (Optional)

The interactive intelligence analyst chat requires a Groq API key:

1. Get a free API key at [console.groq.com/keys](https://console.groq.com/keys)
2. Create a `.env` file in the project root:
   ```bash
   GROQ_API_KEY=gsk_your_key_here
   ```
3. Restart the dev server

---

## Project Structure

```
SanctionsPulse/
├── src/
│   ├── components/
│   │   ├── layout/          # Header, Sidebar, Footer
│   │   ├── dashboard/       # StatsCards, WeeklyDiffTable, ProgramsPanel, TimelineChart
│   │   ├── map/             # SanctionsMap, MapLegend, MapControls
│   │   ├── intelligence/    # AISummaryPanel, IntelChat
│   │   └── common/          # Badge, LoadingSpinner, ErrorBoundary
│   ├── pages/               # DashboardPage, MapPage, ProgramsPage, IntelligencePage
│   ├── hooks/               # useSanctionsData, useMapData, useAISummary
│   └── lib/                 # types, constants, utils, mapStyles
│
├── scripts/                 # Python data pipeline
│   ├── fetch_lists.py       # Download OFAC XML files
│   ├── parse_xml.py         # Parse XML → JSON (lxml iterparse)
│   ├── diff_snapshots.py    # Compare snapshots → weekly diff
│   ├── generate_summary.py  # AI summary via Groq API
│   ├── build_map_data.py    # Aggregate by country for map
│   ├── build_program_data.py# Extract program metadata
│   └── run_weekly.py        # Orchestrator (runs all steps)
│
├── api/                     # Vercel Edge Functions
│   ├── proxy-ofac.ts        # OFAC API proxy (adds User-Agent)
│   ├── ai-summary.ts        # Groq API proxy (hides API key)
│   └── sanctions-data.ts    # Data file server with caching
│
├── data/                    # Git-tracked JSON data
│   ├── meta.json            # Dashboard metadata
│   ├── diffs/               # Weekly diff files
│   ├── summaries/           # AI-generated intelligence summaries
│   ├── map/                 # Country-level aggregations
│   ├── programs/            # Sanctions program metadata
│   └── snapshots/           # Full list snapshots (after pipeline run)
│
├── public/
│   ├── countries.geojson    # 258-country Natural Earth boundaries
│   └── favicon.svg          # Lightning bolt icon
│
└── .github/workflows/
    └── weekly-update.yml    # Automated Monday 09:00 UTC pipeline
```

---

## Data Pipeline

The Python data pipeline runs weekly via GitHub Actions (or manually) to fetch and process OFAC sanctions data.

### How It Works

```
OFAC SLS API ──► fetch_lists.py ──► SDN_ADVANCED.XML + CONS_ADVANCED.XML
                                           │
                                    parse_xml.py ──► data/snapshots/*_latest.json
                                           │
                                    diff_snapshots.py ──► data/diffs/weekly_*.json
                                           │
                              ┌─────── generate_summary.py ──► data/summaries/ai_*.json
                              │            │
                              │     build_map_data.py ──► data/map/country_sanctions.json
                              │            │
                              │     build_program_data.py ──► data/programs/active_programs.json
                              │            │
                              └──── git commit + push (automated)
```

### Running Manually

```bash
cd scripts
pip install -r requirements.txt

# Run the full pipeline
python run_weekly.py

# Or run individual steps
python fetch_lists.py          # Download OFAC XML files
python parse_xml.py            # Parse XML → JSON
python diff_snapshots.py       # Compute weekly diff
python generate_summary.py     # Generate AI summary (requires GROQ_API_KEY)
python build_map_data.py       # Build map aggregations
python build_program_data.py   # Build program metadata
```

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

The weekly update workflow (`.github/workflows/weekly-update.yml`) runs automatically every Monday at 09:00 UTC. To enable it:

1. Add `GROQ_API_KEY` as a repository secret (Settings → Secrets → Actions)
2. The workflow will fetch OFAC data, compute diffs, generate AI summaries, and commit results back to the repo

You can also trigger it manually via the **Actions** tab → **Weekly OFAC Sanctions Update** → **Run workflow**.

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
npm run dev              # Start dev server (http://localhost:5173)
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # ESLint

# Data Pipeline
python scripts/run_weekly.py    # Full weekly update
```

---

## OFAC Sanctions Programs Tracked

SanctionsPulse monitors **45 active OFAC sanctions programs** including:

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
