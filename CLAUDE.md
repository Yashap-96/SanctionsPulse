# CLAUDE.md — SanctionsPulse

> This file provides guidance to Claude Code when working with code in this repository.
> **Read this file completely before writing any code.**

---

## Project Overview

**SanctionsPulse** is an open-source, interactive OFAC sanctions monitoring dashboard inspired by [World Monitor](https://github.com/koala73/worldmonitor). It tracks weekly changes to U.S. Treasury OFAC sanctions lists (SDN + Consolidated), visualizes sanctions data on an interactive world map, and provides AI-powered intelligence summaries.

### Core Value Proposition
- **Real-time sanctions dashboard** showing total active SDN and Consolidated list counts
- **Weekly diff engine** detecting additions, removals, and updates to sanctions entries
- **Interactive world map** with choropleth + bubble overlays showing sanctions by country
- **AI-powered intelligence analyst** generating executive summaries of weekly changes
- **Active Sanctions Programs tracker** with program-level update history
- **100% open-source**, no API keys required for core functionality (Groq key optional for AI features)

### Design Philosophy
- **World Monitor-inspired dark theme** — dark background (#0a0a0a), neon accent colors, monospace headers, glassmorphism panels
- **Progressive disclosure** — summary stats visible at glance, drill-down for details
- **Offline-first** — all sanctions data stored as JSON in repo, no external DB dependency
- **GitHub Actions for automation** — weekly cron fetches + diffs, commits results to repo

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React 18 + TypeScript | Component-based, strong typing, large ecosystem |
| **Build** | Vite 5 | Fast HMR, tree-shaking, native TS support |
| **Styling** | Tailwind CSS 3 | Utility-first, dark mode built-in, rapid prototyping |
| **Map** | MapLibre GL JS | Free, open-source Mapbox fork, vector tiles, WebGL |
| **Charts** | Recharts | React-native charting, composable, lightweight |
| **AI Summaries** | Groq API (llama-3.3-70b-versatile) | Fastest inference, best quality for structured analysis |
| **Data Pipeline** | Python 3.11+ scripts | XML parsing (lxml), diffing logic, Groq API calls |
| **Automation** | GitHub Actions | Weekly cron, zero-cost, commits diffs back to repo |
| **Deployment** | Vercel | Free tier, Edge Functions for API proxy, env var management |
| **Data Storage** | JSON files in `/data` directory | Git-trackable, zero dependencies, transparent for open-source |

### Why This Stack
- **React over vanilla TS**: Unlike World Monitor's 30k+ LOC vanilla TS codebase, React gives us component reuse and state management with less boilerplate. Better for a focused project.
- **Vercel over GitHub Pages**: We need server-side logic — OFAC SLS API requires `User-Agent` headers (403 without it), and Groq API keys must stay server-side. Vercel Edge Functions handle both.
- **JSON over SQLite/Redis**: For an open-source project, JSON files mean `git clone → npm install → npm run dev` with zero external dependencies. Git history doubles as the change audit trail.
- **Python scripts over Node for data pipeline**: OFAC XML files are large (50MB+). Python's `lxml` handles XML streaming far better than Node's XML parsers. Scripts run in GitHub Actions (Python pre-installed).

---

## OFAC SLS API Reference

### Base URL
```
https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/
```

### Critical: User-Agent Header Required
All requests MUST include a `User-Agent` header or the API returns `403 Forbidden`.
```python
headers = {
    "User-Agent": "SanctionsPulse/1.0 (https://github.com/<owner>/SanctionsPulse)"
}
```

### Key Endpoints (Bulk Download Only — No REST Query API)

#### SDN List (Specially Designated Nationals)
| Format | URL | Use Case |
|--------|-----|----------|
| XML (Standard) | `{BASE}/SDN.XML` | Lightweight, basic fields |
| XML (Advanced) | `{BASE}/SDN_ADVANCED.XML` | Full data model, all fields, UIDs |
| CSV | `{BASE}/SDN.CSV` | Spreadsheet-friendly |
| JSON | `{BASE}/SDN.JSON` | (if available, verify) |

#### Consolidated List (Non-SDN)
| Format | URL | Use Case |
|--------|-----|----------|
| XML (Standard) | `{BASE}/CONSOLIDATED.XML` | Lightweight, basic fields |
| XML (Advanced) | `{BASE}/CONS_ADVANCED.XML` | Full data model, all fields, UIDs |
| CSV | `{BASE}/CONSOLIDATED.CSV` | Spreadsheet-friendly |

#### Other Useful Files
| File | URL | Purpose |
|------|-----|---------|
| SDN Address List | `{BASE}/SDN_ADVANCED.XML` | Includes addresses with country data |
| Delta Files | Browse via SLS UI | Incremental changes (OFAC's own format) |
| XML Schema (XSD) | `{BASE}/ADVANCED_XML.xsd` | Validate XML structure |

### XML Data Model (Advanced Format — Use This)

The Advanced XML format (`SDN_ADVANCED.XML` and `CONS_ADVANCED.XML`) uses the OFAC Advanced Sanctions Data Model. Key structure:

```xml
<Sanctions xmlns="https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/ADVANCED_XML">
  <ReferenceData>
    <!-- Lookup tables for country codes, ID types, sanction programs, etc. -->
    <SanctionsProgram ID="1" Name="CUBA" />
    <Country ID="64" Name="Cuba" ISO2="CU" />
    ...
  </ReferenceData>
  <Entries>
    <Entry ID="12345">  <!-- This is the UID -->
      <GeneralInfo>
        <EntryType>Entity</EntryType>  <!-- Entity | Individual | Vessel | Aircraft -->
        <SanctionsProgramsList>
          <SanctionsProgram ID="1" />
        </SanctionsProgramsList>
      </GeneralInfo>
      <NamesList>
        <Name>
          <LastName>ACME CORP</LastName>
          <!-- Or FirstName/LastName for individuals -->
        </Name>
      </NamesList>
      <AddressList>
        <Address>
          <Country ID="64" />
          <City>Havana</City>
        </Address>
      </AddressList>
      <IDList>
        <ID>
          <IDType>Passport</IDType>
          <IDNumber>A12345678</IDNumber>
          <IDCountry ID="64" />
        </ID>
      </IDList>
      <DateOfBirthList>...</DateOfBirthList>
      <NationalityList>...</NationalityList>
    </Entry>
    ...
  </Entries>
</Sanctions>
```

### Key Fields for Our Dashboard
- **UID** (`Entry/@ID`): Unique identifier — used for diffing additions/removals
- **EntryType**: Entity, Individual, Vessel, Aircraft — for classification
- **SanctionsProgram**: Links to program code (CUBA, IRAN, SDGT, UKRAINE-EO13661, etc.)
- **Country** (from Address or Nationality): For geo-mapping
- **Name**: Primary display field
- **ListType**: SDN vs Consolidated (determined by which file the entry comes from)

### Active Sanctions Programs (as of 2026)
These are the major OFAC sanctions programs. The `SanctionsProgram` field in the XML uses these codes:
- **CUBA** — Cuba Sanctions
- **IRAN** — Iran Sanctions
- **DPRK** / **DPRK2** / **DPRK3** / **DPRK4** — North Korea
- **SDGT** — Global Terrorism (Specially Designated Global Terrorist)
- **SDNT** — Narcotics Trafficking
- **UKRAINE-EO13660** / **UKRAINE-EO13661** / **UKRAINE-EO13662** — Ukraine/Russia
- **RUSSIA-EO14024** — Russia Harmful Foreign Activities
- **SYRIA** — Syria Sanctions
- **VENEZUELA** — Venezuela Sanctions
- **CYBER2** — Malicious Cyber Activities
- **TCO** — Transnational Criminal Organizations
- **BALKANS** — Western Balkans
- **YEMEN** — Yemen / Houthis
- **MYANMAR** — Burma
- **ETHIOPIA** — Ethiopia
- **NICARAGUA** — Nicaragua
- **HONGKONG-EO13936** — Hong Kong
- **GLOMAG** — Global Magnitsky (Human Rights)
- **CMIC** / **NS-CMIC** — Chinese Military Companies
- **SSI** — Sectoral Sanctions Identifications (Russia)
- **CAPTA** — Correspondent Account / Payable-Through Account
- **FSE** — Foreign Sanctions Evaders
- **NS-MBS** — Non-SDN Menu-Based Sanctions
- **NS-PLC** — Palestinian Legislative Council
- **IFSR** — Iranian Financial Sanctions
- **IRGC** — Islamic Revolutionary Guard Corps
- **WMD** / **NPWMD** — Weapons of Mass Destruction / Non-Proliferation

### Country-to-ISO Mapping for Map
The XML provides country IDs that must be resolved against the `ReferenceData/Country` section. Extract a mapping like:
```json
{ "64": {"name": "Cuba", "iso2": "CU"}, "98": {"name": "Iran", "iso2": "IR"}, ... }
```
MapLibre needs ISO 3166-1 alpha-2 codes for choropleth layers matching GeoJSON country boundaries.

---

## Project Structure

```
SanctionsPulse/
├── CLAUDE.md                    # This file
├── README.md                    # Project readme with screenshots
├── LICENSE                      # MIT License
├── package.json                 # React + Vite + dependencies
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── vercel.json                  # Vercel deployment config + cron
├── .env.example                 # GROQ_API_KEY=your_key_here
├── .github/
│   └── workflows/
│       └── weekly-update.yml    # GitHub Actions cron (every Monday 09:00 UTC)
│
├── api/                         # Vercel Edge Functions (serverless)
│   ├── proxy-ofac.ts            # Proxies OFAC SLS API (adds User-Agent header)
│   ├── ai-summary.ts            # Calls Groq API for intelligence summaries
│   └── sanctions-data.ts        # Serves JSON data from /data directory
│
├── scripts/                     # Python data pipeline (runs in GitHub Actions)
│   ├── requirements.txt         # lxml, requests, groq
│   ├── fetch_lists.py           # Download SDN + Consolidated XML from OFAC SLS
│   ├── parse_xml.py             # Parse Advanced XML → normalized JSON
│   ├── diff_snapshots.py        # Compare current vs previous snapshot → delta
│   ├── generate_summary.py      # Call Groq API to summarize weekly changes
│   ├── build_map_data.py        # Aggregate sanctions by country for map layer
│   ├── build_program_data.py    # Extract active programs + last updated dates
│   └── run_weekly.py            # Orchestrator: runs all above in sequence
│
├── data/                        # Git-tracked JSON data (output of scripts/)
│   ├── snapshots/
│   │   ├── sdn_latest.json              # Current SDN snapshot (UID → entry summary)
│   │   ├── consolidated_latest.json     # Current Consolidated snapshot
│   │   ├── sdn_2026-03-03.json          # Historical snapshots (date-stamped)
│   │   └── consolidated_2026-03-03.json
│   ├── diffs/
│   │   ├── weekly_2026-03-10.json       # Weekly diff: {added: [], removed: [], updated: []}
│   │   └── weekly_2026-03-03.json
│   ├── summaries/
│   │   ├── ai_summary_2026-03-10.json   # Groq-generated intelligence summary
│   │   └── ai_summary_2026-03-03.json
│   ├── map/
│   │   ├── country_sanctions.json       # Aggregated: {country_iso: {sdn_count, cons_count, programs: []}}
│   │   └── weekly_changes_geo.json      # This week's adds/removes with lat/lng
│   ├── programs/
│   │   └── active_programs.json         # {program_code: {name, description, last_updated, entry_count}}
│   └── meta.json                        # {last_updated, sdn_total, consolidated_total, last_diff_date}
│
├── public/
│   ├── favicon.svg
│   ├── countries.geojson         # World country boundaries for choropleth
│   └── og-image.png             # Social sharing image
│
├── src/
│   ├── main.tsx                 # React entry point
│   ├── App.tsx                  # Root component with layout
│   ├── index.css                # Tailwind imports + global dark theme
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx           # "SANCTIONSPULSE" + version + last updated + live indicator
│   │   │   ├── Sidebar.tsx          # Navigation: Dashboard, Map, Programs, Intelligence
│   │   │   └── Footer.tsx           # Credits, OFAC disclaimer, GitHub link
│   │   │
│   │   ├── dashboard/
│   │   │   ├── StatsCards.tsx        # Total SDN / Total Consolidated / Weekly Adds / Weekly Removes
│   │   │   ├── WeeklyDiffTable.tsx   # Table of this week's additions/removals with entity details
│   │   │   ├── ProgramsPanel.tsx     # Active Sanctions Programs list with last-updated dates
│   │   │   ├── TimelineChart.tsx     # Recharts area chart: sanctions count over time
│   │   │   └── RecentActions.tsx     # Feed of latest OFAC actions (scraped or manual)
│   │   │
│   │   ├── map/
│   │   │   ├── SanctionsMap.tsx      # MapLibre GL container
│   │   │   ├── ChoroplethLayer.tsx   # Country fill colored by total sanction intensity
│   │   │   ├── BubbleLayer.tsx       # Bubble markers for weekly changes (sized by count)
│   │   │   ├── MapLegend.tsx         # Legend: color scale + bubble size key
│   │   │   ├── MapControls.tsx       # Layer toggles (SDN/Consolidated, by program)
│   │   │   └── CountryPopup.tsx      # Click popup: country name, sanction count, programs, entities
│   │   │
│   │   ├── intelligence/
│   │   │   ├── AISummaryPanel.tsx    # Weekly AI intelligence summary display
│   │   │   ├── IntelChat.tsx         # Interactive AI analyst chatbot (Groq-powered)
│   │   │   └── RiskMatrix.tsx        # Visual risk matrix by program/region
│   │   │
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       ├── Badge.tsx             # Program badge with color coding
│   │       ├── DataTable.tsx         # Reusable sortable/filterable table
│   │       └── Tooltip.tsx
│   │
│   ├── hooks/
│   │   ├── useSanctionsData.ts      # Fetch and cache /data/*.json
│   │   ├── useMapData.ts            # Process data for MapLibre layers
│   │   └── useAISummary.ts          # Fetch AI summary (from Vercel Edge or static JSON)
│   │
│   ├── lib/
│   │   ├── types.ts                 # TypeScript interfaces for all data models
│   │   ├── constants.ts             # Program colors, map config, API URLs
│   │   ├── utils.ts                 # Formatting, date helpers, country code lookups
│   │   └── mapStyles.ts             # MapLibre style spec (dark theme base map)
│   │
│   └── pages/
│       ├── DashboardPage.tsx        # Main dashboard view (default)
│       ├── MapPage.tsx              # Full-screen map view
│       ├── ProgramsPage.tsx         # Detailed programs view
│       └── IntelligencePage.tsx     # AI intelligence center
│
└── tests/
    ├── scripts/
    │   ├── test_parse_xml.py        # Unit tests for XML parsing
    │   └── test_diff_snapshots.py   # Unit tests for diffing logic
    └── components/
        └── StatsCards.test.tsx       # React component tests
```

---

## Build Phases

### Phase 1: Foundation (Week 1)
**Goal**: Scaffold project, fetch OFAC data, display basic stats.

1. **Project scaffold**
   - `npm create vite@latest SanctionsPulse -- --template react-ts`
   - Install: `tailwindcss`, `@tailwindcss/vite`, `react-router-dom`, `recharts`, `maplibre-gl`, `lucide-react`
   - Configure dark theme in `tailwind.config.ts` (extend colors with World Monitor palette)
   - Set up `index.css` with dark background: `bg-[#0a0a0a] text-gray-100`

2. **Python data pipeline — fetch + parse**
   - `scripts/fetch_lists.py`: Download `SDN_ADVANCED.XML` and `CONS_ADVANCED.XML`
   - `scripts/parse_xml.py`: Parse XML → `data/snapshots/sdn_latest.json` and `consolidated_latest.json`
   - Output format per entry:
     ```json
     {
       "uid": 12345,
       "name": "ACME CORP",
       "entry_type": "Entity",
       "programs": ["CUBA"],
       "countries": ["CU"],
       "list_type": "SDN",
       "addresses": [{"city": "Havana", "country": "CU"}],
       "ids": [{"type": "Passport", "number": "A123"}],
       "dob": null,
       "nationalities": ["CU"]
     }
     ```
   - `data/meta.json`: `{ "sdn_total": 12500, "consolidated_total": 3200, "last_updated": "2026-03-08T..." }`

3. **Dashboard layout**
   - `Header.tsx`: "SANCTIONSPULSE" in monospace, green dot "LIVE", timestamp
   - `StatsCards.tsx`: 4 cards — Total SDN, Total Consolidated, Weekly Additions, Weekly Removals
   - Load data from `/data/meta.json` via `useSanctionsData` hook
   - Dark glassmorphism cards: `bg-white/5 backdrop-blur border border-white/10 rounded-lg`

### Phase 2: Weekly Diff Engine (Week 2)
**Goal**: Compare snapshots, detect changes, display diff table.

1. **Diff logic**
   - `scripts/diff_snapshots.py`:
     - Load `sdn_latest.json` (previous) and freshly parsed current
     - Compare by UID: new UIDs = additions, missing UIDs = removals
     - For existing UIDs: compare name, programs, countries → flag updates
     - Output: `data/diffs/weekly_YYYY-MM-DD.json`
       ```json
       {
         "date": "2026-03-10",
         "period": "2026-03-03 to 2026-03-10",
         "summary": { "added": 45, "removed": 12, "updated": 8 },
         "additions": [
           { "uid": 99001, "name": "NEW ENTITY", "entry_type": "Entity", "programs": ["IRAN"], "countries": ["IR"], "list_type": "SDN" }
         ],
         "removals": [...],
         "updates": [
           { "uid": 12345, "name": "EXISTING ENTITY", "changes": {"programs": {"old": ["CUBA"], "new": ["CUBA", "SDGT"]}} }
         ]
       }
       ```
   - After diffing, rename current parse as new `*_latest.json` and archive previous as `*_YYYY-MM-DD.json`

2. **Dashboard diff display**
   - `WeeklyDiffTable.tsx`: Sortable table with columns — Name, Type, Programs, Countries, Action (Added/Removed/Updated)
   - Color-coded rows: green for additions, red for removals, amber for updates
   - Badge components for program codes (color-coded per program)

### Phase 3: Sanctions Programs Panel (Week 2-3)
**Goal**: Display all active OFAC sanctions programs with metadata.

1. **Program data extraction**
   - `scripts/build_program_data.py`:
     - Parse `ReferenceData/SanctionsProgram` from XML
     - Count entries per program from both SDN and Consolidated
     - Determine `last_updated` per program by checking diff history
     - Output: `data/programs/active_programs.json`
       ```json
       {
         "IRAN": {
           "name": "Iran Sanctions",
           "code": "IRAN",
           "entry_count_sdn": 1200,
           "entry_count_consolidated": 150,
           "last_updated": "2026-03-06",
           "weekly_added": 5,
           "weekly_removed": 0,
           "description": "Sanctions targeting Iran's nuclear program, terrorism support, and human rights violations"
         },
         ...
       }
       ```

2. **Programs panel UI**
   - `ProgramsPanel.tsx`: Card grid or table view
   - Each program shows: name, code badge, entry count, last updated, weekly change (+/-)
   - Sort by: most entries, most recent update, most weekly changes
   - Weekly change overlay on top (like World Monitor's event feed)

### Phase 4: Interactive World Map (Week 3-4)
**Goal**: Choropleth + bubble map showing sanctions by country.

1. **Map data preparation**
   - `scripts/build_map_data.py`:
     - Aggregate entries by country (from addresses + nationalities)
     - Output: `data/map/country_sanctions.json`
       ```json
       {
         "IR": { "total": 1350, "sdn": 1200, "consolidated": 150, "programs": ["IRAN", "IFSR", "IRGC"], "weekly_added": 5, "weekly_removed": 0 },
         "CU": { "total": 450, "sdn": 420, "consolidated": 30, "programs": ["CUBA"], "weekly_added": 0, "weekly_removed": 2 },
         ...
       }
       ```
     - Also output `data/map/weekly_changes_geo.json` with per-entity lat/lng for bubble placement (use country centroids if no city-level data)

2. **MapLibre implementation**
   - **Base map**: Use free dark vector tiles — `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json` or MapTiler dark style
   - **Choropleth layer** (`ChoroplethLayer.tsx`):
     - Load `public/countries.geojson` (Natural Earth Admin 0 boundaries)
     - Join with `country_sanctions.json` by ISO2 code
     - Color scale: `#1a1a2e` (0 sanctions) → `#e94560` (high sanctions)
     - Use `fill-color` with `interpolate` expression based on total count
     - Opacity: 0.6 for base, 0.8 on hover
   - **Bubble overlay** (`BubbleLayer.tsx`):
     - Show only for countries with weekly changes (additions/removals)
     - Bubble size: proportional to number of weekly changes
     - Color: green for net additions, red for net removals
     - Pulsing animation for new additions (CSS animation on marker)
   - **Interactions**:
     - Hover: highlight country, show tooltip with quick stats
     - Click: open `CountryPopup.tsx` with full breakdown — programs, entity types, weekly changes
     - Layer toggles in `MapControls.tsx`: filter by SDN/Consolidated, by program
   - **Legend** (`MapLegend.tsx`):
     - Choropleth color scale bar
     - Bubble size reference
     - Program color key (when program filter is active)

3. **GeoJSON source**
   - Download Natural Earth 110m admin boundaries: `https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson`
   - Ensure ISO_A2 property matches our country codes
   - Commit to `public/countries.geojson` (minified, ~2MB)

### Phase 5: AI Intelligence Analyst (Week 4-5)
**Goal**: Groq-powered weekly summaries and interactive analyst chat.

1. **Weekly summary generation**
   - `scripts/generate_summary.py`:
     - Input: `data/diffs/weekly_YYYY-MM-DD.json` + `data/programs/active_programs.json`
     - Call Groq API with structured prompt:
       ```python
       prompt = f"""You are a sanctions intelligence analyst at a major financial institution.
       Analyze the following OFAC sanctions list changes for the week of {date_range}.

       WEEKLY CHANGES:
       - Additions: {additions_count} new entries
       - Removals: {removals_count} entries removed
       - Updates: {updates_count} entries modified

       ADDITIONS BY PROGRAM:
       {additions_by_program}

       NOTABLE NEW ENTRIES:
       {top_additions}

       REMOVALS:
       {removals_summary}

       Provide your analysis in the following JSON structure:
       {{
         "executive_summary": "2-3 paragraph overview of key changes and their significance",
         "notable_entities": [
           {{"name": "...", "type": "...", "program": "...", "significance": "..."}}
         ],
         "risk_implications": [
           {{"area": "...", "level": "HIGH|MEDIUM|LOW", "detail": "..."}}
         ],
         "program_highlights": [
           {{"program": "...", "changes": "...", "trend": "..."}}
         ],
         "geographic_hotspots": [
           {{"country": "...", "iso2": "...", "activity": "..."}}
         ],
         "compliance_recommendations": ["...", "..."]
       }}
       """
       ```
     - Model: `llama-3.3-70b-versatile` via Groq
     - Output: `data/summaries/ai_summary_YYYY-MM-DD.json`

2. **Summary display panel**
   - `AISummaryPanel.tsx`: Renders the structured summary
   - Executive summary in a highlighted card
   - Notable entities in a table with program badges
   - Risk implications as colored cards (red/amber/green)
   - Geographic hotspots linked to map (click to fly to country)

3. **Interactive analyst chat** (stretch goal — Phase 5b)
   - `IntelChat.tsx`: Chat interface hitting `/api/ai-summary` Vercel Edge Function
   - Edge Function proxies to Groq API with system prompt + sanctions context
   - Context window: inject latest `meta.json` + `weekly_diff.json` + `active_programs.json`
   - Users can ask: "What changed in Iran sanctions this week?", "Which programs had the most activity?", "What are the risk implications of the latest Russia additions?"

### Phase 6: GitHub Actions Weekly Automation (Week 5)
**Goal**: Fully automated weekly pipeline.

1. **GitHub Actions workflow** (`.github/workflows/weekly-update.yml`):
   ```yaml
   name: Weekly OFAC Sanctions Update
   on:
     schedule:
       - cron: '0 9 * * 1'  # Every Monday at 09:00 UTC
     workflow_dispatch:        # Manual trigger for testing

   permissions:
     contents: write          # Needed to commit data back to repo

   jobs:
     update-sanctions:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4

         - name: Set up Python
           uses: actions/setup-python@v5
           with:
             python-version: '3.11'

         - name: Install dependencies
           run: pip install -r scripts/requirements.txt

         - name: Run weekly update pipeline
           env:
             GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
           run: python scripts/run_weekly.py

         - name: Commit and push data
           run: |
             git config user.name "SanctionsPulse Bot"
             git config user.email "bot@sanctionspulse.app"
             git add data/
             git diff --staged --quiet || git commit -m "chore: weekly sanctions update $(date +%Y-%m-%d)"
             git push
   ```

2. **Why GitHub Actions over Vercel Cron**:
   - GitHub Actions: 2000 free minutes/month, can run Python scripts, commits back to repo
   - Vercel Cron: Limited to Edge Functions (JS/TS only), can't commit to repo
   - **Use GitHub Actions for the data pipeline, Vercel for serving the dashboard**

3. **`scripts/run_weekly.py`** orchestrator:
   ```python
   def main():
       print("Step 1: Fetching OFAC lists...")
       fetch_lists.download_all()

       print("Step 2: Parsing XML to JSON...")
       current_sdn = parse_xml.parse("downloads/SDN_ADVANCED.XML", list_type="SDN")
       current_cons = parse_xml.parse("downloads/CONS_ADVANCED.XML", list_type="CONSOLIDATED")

       print("Step 3: Computing weekly diff...")
       diff = diff_snapshots.compute_diff(current_sdn, current_cons)

       print("Step 4: Generating AI summary...")
       if diff["summary"]["added"] > 0 or diff["summary"]["removed"] > 0:
           generate_summary.summarize(diff)
       else:
           print("No changes detected, skipping AI summary.")

       print("Step 5: Building map data...")
       build_map_data.aggregate(current_sdn, current_cons)

       print("Step 6: Building program data...")
       build_program_data.extract(current_sdn, current_cons, diff)

       print("Step 7: Updating metadata...")
       update_meta(current_sdn, current_cons, diff)

       print("Weekly update complete!")
   ```

### Phase 7: Vercel Deployment (Week 5-6)
**Goal**: Deploy to Vercel with Edge Functions.

1. **`vercel.json`**:
   ```json
   {
     "framework": "vite",
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "functions": {
       "api/*.ts": {
         "runtime": "@vercel/edge"
       }
     },
     "rewrites": [
       { "source": "/api/(.*)", "destination": "/api/$1" },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

2. **Edge Functions**:
   - `api/proxy-ofac.ts`: Proxy OFAC SLS requests (adds User-Agent, handles CORS)
   - `api/ai-summary.ts`: Proxy Groq API calls (keeps API key server-side)
   - `api/sanctions-data.ts`: Serve data files with proper cache headers

3. **Environment variables** (Vercel dashboard):
   - `GROQ_API_KEY`: For AI features
   - (No OFAC API key needed — it's public)

### Phase 8: Polish & Testing (Week 6)
**Goal**: Responsive design, error handling, testing, README.

1. **Responsive design**: Mobile-first layout, map full-width on mobile
2. **Error states**: Loading spinners, empty states, API failure fallbacks
3. **SEO / OG tags**: Meta tags, social sharing image
4. **README.md**: Screenshots, setup guide, architecture diagram, contribution guide
5. **Tests**: Python unit tests for parsing/diffing, React component tests

---

## Visual Design System

### Color Palette (World Monitor-Inspired Dark Theme)
```css
/* Base */
--bg-primary: #0a0a0a;         /* Main background */
--bg-secondary: #111111;        /* Card/panel backgrounds */
--bg-tertiary: #1a1a1a;         /* Elevated surfaces */
--border: rgba(255,255,255,0.1); /* Borders */

/* Text */
--text-primary: #e5e5e5;        /* Primary text */
--text-secondary: #a3a3a3;      /* Secondary text */
--text-muted: #737373;           /* Muted text */

/* Accents */
--accent-green: #22c55e;         /* Live indicator, additions, positive */
--accent-red: #ef4444;           /* Removals, high risk, alerts */
--accent-amber: #f59e0b;         /* Updates, medium risk, warnings */
--accent-blue: #3b82f6;          /* Links, info, SDN highlight */
--accent-purple: #a855f7;        /* Consolidated list highlight */
--accent-cyan: #06b6d4;          /* Map accents, secondary info */

/* Program Colors (assign distinct colors to major programs) */
--program-iran: #ef4444;         /* Red */
--program-russia: #f59e0b;       /* Amber */
--program-cuba: #3b82f6;         /* Blue */
--program-dprk: #a855f7;         /* Purple */
--program-sdgt: #ec4899;         /* Pink — terrorism */
--program-venezuela: #14b8a6;    /* Teal */
--program-syria: #f97316;        /* Orange */
--program-cyber: #06b6d4;        /* Cyan */
--program-glomag: #84cc16;       /* Lime — human rights */
--program-other: #6b7280;        /* Gray */

/* Map Choropleth Scale */
--map-0: #1a1a2e;               /* No sanctions */
--map-1: #16213e;               /* Low (1-10) */
--map-2: #1a1a40;               /* Medium-low (11-50) */
--map-3: #533483;               /* Medium (51-200) */
--map-4: #e94560;               /* High (201-500) */
--map-5: #ff0000;               /* Very high (500+) */
```

### Typography
```css
/* Headers / Logo */
font-family: 'JetBrains Mono', 'Fira Code', monospace;
/* Body text */
font-family: 'Inter', -apple-system, sans-serif;
```

### Component Patterns
```css
/* Glassmorphism card (World Monitor style) */
.card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

/* Stat card with glow */
.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.05); /* green glow for positive */
}

/* Pulsing live indicator */
.live-dot {
  width: 8px; height: 8px;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse 2s infinite;
}
```

### Header Design (World Monitor Reference)
```
┌─────────────────────────────────────────────────────────────────────┐
│ ⚡ SANCTIONSPULSE  v1.0.0    ● LIVE    Last Updated: Mon, 10 Mar 2026 │
│                                          SDN: 12,547  CONS: 3,218   │
└─────────────────────────────────────────────────────────────────────┘
```
- Logo: "SANCTIONSPULSE" in monospace, all caps, with ⚡ icon
- Green pulsing dot with "LIVE" label
- Timestamp + total counts in header bar
- Dark background matching the World Monitor aesthetic

---

## Data Flow

```
                    WEEKLY (GitHub Actions)
                    ┌──────────────────────────────────────────────────┐
                    │                                                  │
   OFAC SLS API ────┤  fetch_lists.py                                  │
   (XML download)   │       │                                          │
                    │       ▼                                          │
                    │  parse_xml.py ──► data/snapshots/*_latest.json   │
                    │       │                                          │
                    │       ▼                                          │
                    │  diff_snapshots.py ──► data/diffs/weekly_*.json  │
                    │       │                                          │
                    │       ▼                                          │
                    │  generate_summary.py ──► data/summaries/ai_*.json│
                    │  (Groq API)           │                          │
                    │       ▼               ▼                          │
                    │  build_map_data.py ──► data/map/*.json           │
                    │  build_program_data ──► data/programs/*.json     │
                    │       │                                          │
                    │       ▼                                          │
                    │  git commit + push (automated)                   │
                    └──────────────────────────────────────────────────┘

                    REAL-TIME (Vercel + Browser)
                    ┌──────────────────────────────────────────────────┐
                    │                                                  │
   Browser ────────►│  Vite React App                                  │
                    │       │                                          │
                    │       ├──► fetch /data/*.json (static from repo) │
                    │       │                                          │
                    │       ├──► /api/ai-summary (Vercel Edge → Groq)  │
                    │       │    (for interactive chat only)            │
                    │       │                                          │
                    │       └──► MapLibre GL renders map from JSON     │
                    └──────────────────────────────────────────────────┘
```

---

## Key Implementation Details

### XML Parsing Strategy
The OFAC Advanced XML files are large (SDN: ~50MB, Consolidated: ~15MB). Use streaming/iterative parsing:

```python
# scripts/parse_xml.py — use lxml iterparse for memory efficiency
from lxml import etree

def parse_advanced_xml(filepath: str, list_type: str) -> list[dict]:
    entries = []
    ns = "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/ADVANCED_XML"

    # First pass: build reference data lookup
    ref_data = extract_reference_data(filepath, ns)

    # Second pass: parse entries
    context = etree.iterparse(filepath, events=("end",), tag=f"{{{ns}}}Entry")
    for event, elem in context:
        entry = {
            "uid": int(elem.get("ID")),
            "name": extract_primary_name(elem, ns),
            "entry_type": get_text(elem, f".//{{{ns}}}EntryType"),
            "programs": extract_programs(elem, ns, ref_data),
            "countries": extract_countries(elem, ns, ref_data),
            "list_type": list_type,
            # ... additional fields
        }
        entries.append(entry)
        elem.clear()  # Free memory
        while elem.getprevious() is not None:
            del elem.getparent()[0]
    return entries
```

### Diffing Algorithm
```python
# scripts/diff_snapshots.py
def compute_diff(current: dict, previous: dict) -> dict:
    """
    current/previous: {uid: entry_dict} mappings

    Returns: {
        "added": [entries in current but not previous],
        "removed": [entries in previous but not current],
        "updated": [entries in both but with changes, including change details]
    }
    """
    current_uids = set(current.keys())
    previous_uids = set(previous.keys())

    added_uids = current_uids - previous_uids
    removed_uids = previous_uids - current_uids
    common_uids = current_uids & previous_uids

    added = [current[uid] for uid in added_uids]
    removed = [previous[uid] for uid in removed_uids]

    updated = []
    for uid in common_uids:
        changes = detect_changes(previous[uid], current[uid])
        if changes:
            updated.append({**current[uid], "changes": changes})

    return {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "summary": {"added": len(added), "removed": len(removed), "updated": len(updated)},
        "additions": sorted(added, key=lambda x: x["name"]),
        "removals": sorted(removed, key=lambda x: x["name"]),
        "updates": sorted(updated, key=lambda x: x["name"])
    }
```

### MapLibre Configuration
```typescript
// src/lib/mapStyles.ts
export const DARK_BASEMAP = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

// Choropleth paint expression
export const choroplethPaint = {
  "fill-color": [
    "interpolate", ["linear"], ["get", "sanction_count"],
    0, "#1a1a2e",
    10, "#16213e",
    50, "#1a1a40",
    200, "#533483",
    500, "#e94560",
    1000, "#ff0000"
  ],
  "fill-opacity": [
    "case",
    ["boolean", ["feature-state", "hover"], false], 0.85,
    0.6
  ]
};

// Bubble paint for weekly changes
export const bubblePaint = {
  "circle-radius": [
    "interpolate", ["linear"], ["get", "weekly_changes"],
    1, 6,
    10, 14,
    50, 24,
    100, 36
  ],
  "circle-color": [
    "case",
    [">=", ["get", "net_change"], 0], "#22c55e",  // Green: net additions
    "#ef4444"  // Red: net removals
  ],
  "circle-opacity": 0.7,
  "circle-stroke-width": 1.5,
  "circle-stroke-color": "rgba(255,255,255,0.3)"
};
```

---

## TypeScript Types

```typescript
// src/lib/types.ts

export interface SanctionEntry {
  uid: number;
  name: string;
  entry_type: "Entity" | "Individual" | "Vessel" | "Aircraft";
  programs: string[];
  countries: string[];  // ISO2 codes
  list_type: "SDN" | "CONSOLIDATED";
  addresses: Address[];
  ids: IdentificationDoc[];
  dob: string | null;
  nationalities: string[];
}

export interface Address {
  city: string | null;
  state: string | null;
  country: string;  // ISO2
  postal_code: string | null;
}

export interface IdentificationDoc {
  type: string;
  number: string;
  country: string | null;
}

export interface WeeklyDiff {
  date: string;
  period: string;
  summary: { added: number; removed: number; updated: number };
  additions: SanctionEntry[];
  removals: SanctionEntry[];
  updates: (SanctionEntry & { changes: Record<string, { old: any; new: any }> })[];
}

export interface SanctionsProgram {
  code: string;
  name: string;
  entry_count_sdn: number;
  entry_count_consolidated: number;
  last_updated: string;
  weekly_added: number;
  weekly_removed: number;
  description: string;
}

export interface CountrySanctionData {
  iso2: string;
  name: string;
  total: number;
  sdn: number;
  consolidated: number;
  programs: string[];
  weekly_added: number;
  weekly_removed: number;
}

export interface AISummary {
  date: string;
  executive_summary: string;
  notable_entities: {
    name: string;
    type: string;
    program: string;
    significance: string;
  }[];
  risk_implications: {
    area: string;
    level: "HIGH" | "MEDIUM" | "LOW";
    detail: string;
  }[];
  program_highlights: {
    program: string;
    changes: string;
    trend: string;
  }[];
  geographic_hotspots: {
    country: string;
    iso2: string;
    activity: string;
  }[];
  compliance_recommendations: string[];
}

export interface MetaData {
  sdn_total: number;
  consolidated_total: number;
  last_updated: string;
  last_diff_date: string;
  last_diff_summary: { added: number; removed: number; updated: number };
}
```

---

## Environment Variables

```bash
# .env.example

# === Required for AI features (optional for core dashboard) ===
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Get your key at: https://console.groq.com/keys

# === Optional: Override defaults ===
# VITE_APP_TITLE=SanctionsPulse
# VITE_OFAC_API_BASE=https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports
```

---

## Commands

```bash
# Development
npm run dev              # Start Vite dev server (http://localhost:5173)
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # ESLint
npm run type-check       # TypeScript type checking

# Data Pipeline (Python)
cd scripts
pip install -r requirements.txt
python run_weekly.py           # Full weekly update pipeline
python fetch_lists.py          # Download OFAC XML files only
python parse_xml.py            # Parse XML to JSON only
python diff_snapshots.py       # Compute diff only
python generate_summary.py     # Generate AI summary only

# Testing
npm run test             # Run React component tests
cd scripts && python -m pytest tests/  # Run Python tests
```

---

## Important Notes

### OFAC Data Disclaimers
- This is an **educational/informational tool**, NOT a compliance screening system
- Always refer to the official OFAC website (ofac.treasury.gov) for authoritative sanctions data
- The dashboard updates weekly — OFAC may update lists more frequently
- Include a visible disclaimer in the footer:
  > "SanctionsPulse is an independent open-source project for educational purposes. It is not affiliated with, endorsed by, or a substitute for the U.S. Department of the Treasury's Office of Foreign Assets Control (OFAC). For official sanctions data and compliance, visit ofac.treasury.gov."

### Performance Considerations
- SDN list has ~15,000+ entries — don't render all in a single table. Use virtualization (react-window) or pagination.
- Country GeoJSON is ~2MB — lazy load after initial render
- Map layers: start with choropleth only, load bubbles after initial paint
- JSON data files: split by concern (meta, map, programs, diffs) to enable parallel fetching

### Security
- Never expose `GROQ_API_KEY` in frontend code
- OFAC SLS API is public but rate-limit respectfully (max 1 request per file per day for automation)
- All data is public government data — no PII concerns with the sanctions list itself

### Git Hygiene for /data
- The `/data` directory will grow over time with historical snapshots
- Consider `.gitattributes` to mark JSON files as binary for better diff performance
- Historical snapshots older than 6 months can be archived/compressed

---

## Quick Reference: Key URLs

| Resource | URL |
|----------|-----|
| OFAC SLS Main | https://sanctionslist.ofac.treas.gov/ |
| OFAC SLS API Base | https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/ |
| OFAC Recent Actions | https://ofac.treasury.gov/recent-actions/sanctions-list-updates |
| OFAC Programs List | https://ofac.treasury.gov/sanctions-programs-and-country-information |
| Advanced XML Schema | https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/ADVANCED_XML.xsd |
| World Monitor (inspiration) | https://github.com/koala73/worldmonitor |
| Groq Console | https://console.groq.com/ |
| MapLibre GL JS | https://maplibre.org/maplibre-gl-js/docs/ |
| CARTO Dark Basemap | https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json |
| Natural Earth GeoJSON | https://github.com/datasets/geo-countries |
| Vercel Edge Functions | https://vercel.com/docs/functions/edge-functions |
