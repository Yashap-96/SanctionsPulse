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
| **Frontend** | React 19 + TypeScript | Component-based, strong typing, large ecosystem |
| **Build** | Vite 7 | Fast HMR, tree-shaking, native TS support |
| **Styling** | Tailwind CSS 4 | Utility-first, CSS-based config (no tailwind.config.ts), `@import "tailwindcss"` in index.css |
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

### XML Data Model (Advanced Format — Cross-Reference Structure)

The Advanced XML uses a **cross-reference architecture** where data is split across top-level sections linked by IDs. This is NOT a simple nested structure.

```xml
<Sanctions xmlns="...ADVANCED_XML">
  <ReferenceValueSets>
    <CountryValues>
      <Country ID="11073">Cuba</Country>        <!-- No ISO2 — name only -->
    </CountryValues>
    <SanctionsProgramValues>
      <SanctionsProgram ID="202">CUBA</SanctionsProgram>
    </SanctionsProgramValues>
  </ReferenceValueSets>

  <Locations>                                     <!-- Separate top-level section -->
    <Location ID="25">
      <LocationCountry CountryID="11073"/>        <!-- Links to CountryValues -->
    </Location>
  </Locations>

  <DistinctParties>                               <!-- Entries live here -->
    <DistinctParty FixedRef="36">                 <!-- FixedRef = UID -->
      <Profile ID="36" PartySubTypeID="3">        <!-- 3=Entity, 4=Individual -->
        <Identity>
          <Alias Primary="true">
            <DocumentedName>
              <DocumentedNamePart>
                <NamePartValue>AEROCARIBBEAN AIRLINES</NamePartValue>
              </DocumentedNamePart>
            </DocumentedName>
          </Alias>
        </Identity>
        <Feature>
          <FeatureVersion>
            <VersionLocation LocationID="25"/>    <!-- Links to Locations -->
          </FeatureVersion>
        </Feature>
      </Profile>
    </DistinctParty>
  </DistinctParties>

  <SanctionsEntries>                              <!-- Programs linked here, NOT in DistinctParty -->
    <SanctionsEntry ProfileID="36">               <!-- Links to Profile ID -->
      <SanctionsMeasure SanctionsTypeID="1">      <!-- TypeID=1 means Program -->
        <Comment>CUBA</Comment>                   <!-- Program name in Comment tag -->
      </SanctionsMeasure>
    </SanctionsEntry>
  </SanctionsEntries>
</Sanctions>
```

### Cross-Reference Resolution (parse_xml.py)
The parser must build 4 lookup tables before parsing entries:
1. **CountryValues** → ID to country name (then map to ISO2 via `COUNTRY_TO_ISO2` dict)
2. **Locations** → LocationID to ISO2 (via CountryID → CountryValues)
3. **SanctionsEntries** → ProfileID to list of program names (via SanctionsMeasure Comments)
4. **DistinctParties** → VersionLocation/@LocationID to resolve countries

**Important**: Country names have NO ISO2 codes in the XML. `parse_xml.py` contains a hardcoded `COUNTRY_TO_ISO2` mapping for all 185 OFAC country names including special entries like "Region: Gaza" → "PS".

### Key Fields for Our Dashboard
- **UID** (`DistinctParty/@FixedRef`): Unique identifier — used for diffing
- **EntryType**: Derived from `Profile/@PartySubTypeID` (3=Entity, 4=Individual, 2=Vessel, 5=Aircraft)
- **Programs**: Resolved from `SanctionsEntries` via ProfileID cross-reference
- **Countries**: Resolved from `Locations` via VersionLocation cross-reference
- **Name**: Primary alias (`Alias[@Primary="true"]`) DocumentedNamePart values
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
The XML provides country **names** only (no ISO2 codes). The mapping is hardcoded in `scripts/parse_xml.py` as `COUNTRY_TO_ISO2` dict covering all 185 OFAC country names → ISO 3166-1 Alpha-2 codes. Special mappings include: "Burma" → "MM", "Korea, North" → "KP", "Bahamas, The" → "BS", "Region: Gaza" → "PS", "Kosovo" → "XK".
MapLibre matches countries via the `ISO3166-1-Alpha-2` property in `public/countries.geojson`.

---

## Project Structure

```
SanctionsPulse/
├── CLAUDE.md                    # This file
├── README.md                    # Project readme with screenshots
├── LICENSE                      # MIT License
├── package.json                 # React 19 + Vite 7 + dependencies
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts               # Vite config + custom plugin to serve /data in dev
├── vercel.json                  # Vercel deployment config + SPA rewrites
├── eslint.config.js
├── .env.example                 # GROQ_API_KEY=your_key_here
├── .github/
│   └── workflows/
│       └── weekly-update.yml    # GitHub Actions cron (every Monday 09:00 UTC)
│
├── scripts/                     # Python data pipeline (runs in GitHub Actions)
│   ├── requirements.txt         # lxml, requests, groq
│   ├── fetch_lists.py           # Download SDN + Consolidated XML from OFAC SLS
│   ├── parse_xml.py             # Parse Advanced XML → normalized JSON (lxml iterparse)
│   ├── diff_snapshots.py        # Compare current vs previous snapshot → delta
│   ├── generate_summary.py      # Call Groq API to summarize weekly changes
│   ├── build_map_data.py        # Aggregate sanctions by country for map layer
│   ├── build_program_data.py    # Extract active programs + last updated dates
│   └── run_weekly.py            # Orchestrator: runs all above in sequence
│
├── data/                        # Git-tracked JSON data (output of scripts/)
│   ├── snapshots/               # (populated by pipeline — empty until first run)
│   ├── diffs/
│   │   └── weekly_2026-03-03.json       # Weekly diff: {added: [], removed: [], updated: []}
│   ├── summaries/
│   │   └── ai_summary_2026-03-03.json   # Groq-generated intelligence summary
│   ├── map/
│   │   └── country_sanctions.json       # {iso2: {country, total, sdn, consolidated, programs, weekly_*}}
│   ├── programs/
│   │   └── active_programs.json         # {programs: [{code, name, description, entry_counts, ...}]}
│   └── meta.json                        # {last_updated, sdn_total, consolidated_total, last_diff_date}
│
├── public/
│   ├── favicon.svg              # Lightning bolt icon (green #22c55e)
│   └── countries.geojson        # Natural Earth 258 countries (ISO3166-1-Alpha-2 property)
│
├── src/
│   ├── main.tsx                 # React 19 entry point (createRoot + StrictMode)
│   ├── App.tsx                  # BrowserRouter + layout (Header/Sidebar/Footer) + Routes
│   ├── index.css                # Tailwind v4 (@import "tailwindcss") + CSS vars + dark theme
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx           # "SANCTIONSPULSE" monospace + Zap icon + pulsing LIVE dot + meta stats
│   │   │   ├── Sidebar.tsx          # Vertical nav with NavLink active states, mobile-collapsible
│   │   │   └── Footer.tsx           # OFAC disclaimer, GitHub link
│   │   │
│   │   ├── dashboard/
│   │   │   ├── StatsCards.tsx        # 4 glassmorphism cards (SDN/Consolidated/Adds/Removes)
│   │   │   ├── WeeklyDiffTable.tsx   # Tabbed table (Additions/Removals/Updates) with color-coded rows
│   │   │   ├── ProgramsPanel.tsx     # Top 12 programs grid sorted by entry count
│   │   │   └── TimelineChart.tsx     # Recharts area chart (placeholder — needs historical data)
│   │   │
│   │   ├── map/
│   │   │   ├── SanctionsMap.tsx      # MapLibre GL: choropleth + borders + bubbles + hover/click popups
│   │   │   ├── MapLegend.tsx         # Floating legend: color scale + weekly change indicators
│   │   │   └── MapControls.tsx       # Floating toggles: All / SDN Only / Consolidated Only
│   │   │
│   │   ├── intelligence/
│   │   │   ├── AISummaryPanel.tsx    # Full structured summary: exec brief, entities, risks, hotspots, recs
│   │   │   └── IntelChat.tsx         # Interactive AI chat with rate limit display + conversation limits
│   │   │
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx     # React error boundary with fallback UI
│   │       └── Badge.tsx             # Program badge with auto-coloring from PROGRAM_COLORS
│   │
│   ├── hooks/
│   │   ├── useSanctionsData.ts      # Fetches meta + programs + latest weekly diff
│   │   ├── useMapData.ts            # Fetches country_sanctions.json → Record<iso2, CountrySanctionData>
│   │   └── useAISummary.ts          # Fetches AI summary by date (auto-resolves from meta if no date)
│   │
│   ├── lib/
│   │   ├── types.ts                 # All TypeScript interfaces (see Types section below)
│   │   ├── constants.ts             # PROGRAM_COLORS, MAP_CONFIG, API_URLS
│   │   ├── utils.ts                 # formatNumber, formatDate, getProgramColor, classNames
│   │   └── mapStyles.ts             # DARK_BASEMAP, choroplethPaint, bubblePaint expressions
│   │
│   └── pages/
│       ├── DashboardPage.tsx        # Main dashboard: StatsCards + WeeklyDiffTable + Timeline + Programs
│       ├── MapPage.tsx              # Full-bleed MapLibre map with legend + controls overlay
│       ├── ProgramsPage.tsx         # Searchable/sortable grid of all 75 live OFAC sanctions programs
│       ├── IntelligencePage.tsx     # AI intelligence center: summary panel + chat (always shows chat)
│       └── NotFoundPage.tsx         # 404 page with navigation back to dashboard
│
└── tests/                           # (placeholder — not yet implemented)
    ├── scripts/
    └── components/
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
     contents: write

   jobs:
     update:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-python@v5
           with:
             python-version: '3.11'
         - run: pip install -r scripts/requirements.txt
         - name: Run weekly pipeline
           env:
             GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
           working-directory: scripts      # Important: scripts use relative imports
           run: python run_weekly.py
         - name: Commit and push
           run: |
             git config user.name "github-actions[bot]"
             git config user.email "github-actions[bot]@users.noreply.github.com"
             git add data/meta.json data/diffs/ data/map/ data/programs/ data/summaries/
             git diff --cached --quiet || git commit -m "chore: weekly sanctions data update $(date -u +%Y-%m-%d)"
             git push
   ```

2. **Important**: `run_weekly.py` must run from the `scripts/` directory because it uses relative imports (`from fetch_lists import ...`, not `from scripts.fetch_lists import ...`).

3. **Pipeline steps** (7 total):
   1. Download OFAC XML files (~117MB SDN + ~4MB Consolidated)
   2. Rotate previous snapshots (`*_latest.json` → `*_previous.json`)
   3. Parse XML → JSON (builds cross-reference lookups, extracts entries)
   4. Compute diff (UID-based comparison)
   5. Generate AI summary (Groq API, skipped if no `GROQ_API_KEY`)
   6. Build map data (country aggregation with weekly diff overlay)
   7. Build program data (entry counts per program with weekly diff overlay)

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

## Implementation Status

### Completed
- **Phase 1** ✅ — Project scaffold (React 19 + Vite 7 + Tailwind v4), Python data pipeline (7 scripts), dashboard layout with StatsCards, WeeklyDiffTable, ProgramsPanel, TimelineChart placeholder
- **Phase 2** ✅ — Weekly diff engine: tabbed diff table with Additions/Removals/Updates, color-coded rows, program badges
- **Phase 3** ✅ — Programs page: full searchable/sortable explorer with 75 live OFAC sanctions programs, program cards with SDN/Consolidated proportion bars
- **Phase 4** ✅ — Interactive map: MapLibre GL choropleth + bubble overlay, hover tooltips, click popups, filter controls (All/SDN/Consolidated), floating legend
- **Phase 5** ✅ — AI Intelligence Center: AISummaryPanel (structured weekly briefing) + IntelChat (interactive Groq-powered chatbot with rate limiting)
- **Phase 6** ✅ — Python pipeline tested against live OFAC data (18,707 SDN entries, 442 Consolidated, 75 programs, 178 countries). GitHub Actions workflow corrected and ready.
- **Phase 7** ✅ — Vercel Edge Functions (api/proxy-ofac.ts, api/ai-summary.ts with rate limiting, api/sanctions-data.ts)
- **Phase 8** ✅ — Responsive polish, error handling, ErrorBoundary, 404 page, comprehensive README
- **Deployment** ✅ — Live at https://sanctionspulse.vercel.app, GitHub repo at https://github.com/Yashap-96/SanctionsPulse

### Implementation Deviations from Original Plan
- **Tailwind v4** (not v3): Uses CSS-based config (`@import "tailwindcss"` in index.css, `@theme` block for custom properties). No `tailwind.config.ts` file.
- **React 19 + Vite 7** (not React 18 + Vite 5): Latest versions used.
- **Map components consolidated**: Choropleth, bubble, and popup logic are all inside `SanctionsMap.tsx` (no separate ChoroplethLayer.tsx, BubbleLayer.tsx, CountryPopup.tsx). This is simpler since MapLibre is imperative.
- **GeoJSON property**: Country ISO2 code is in `ISO3166-1-Alpha-2` property (not `ISO_A2`).
- **Programs data format**: `{ programs: [...] }` array format, not `Record<code, program>`. The `useSanctionsData` hook transforms it to a Record.
- **AISummary types**: Uses structured objects (NotableEntity, RiskImplication, ProgramHighlight, GeographicHotspot), not simple strings.
- **useAISummary hook**: Accepts optional `diffDate` param; auto-fetches meta.json to resolve the date if not provided.
- **Vite dev server**: Custom plugin in `vite.config.ts` serves the `/data` directory as static JSON during development (Vite only serves `public/` by default). Also proxies `/api/ai-summary` to Groq API in dev mode.
- **Data served from /data**: In dev mode, a Vite middleware plugin serves files from the project-root `data/` directory. In production, the `closeBundle` hook copies `data/` to `dist/data/`. Vercel rewrites `/data/*` to the `api/sanctions-data` function.
- **XML parsing uses cross-references**: The original plan assumed nested XML structure. Real OFAC XML uses cross-references between `ReferenceValueSets`, `Locations`, `DistinctParties`, and `SanctionsEntries`. Parser builds 4 lookup tables before entry extraction.
- **Country names, not ISO2 codes**: OFAC XML contains country names only. A hardcoded `COUNTRY_TO_ISO2` dict in `parse_xml.py` maps all 185 names to ISO2.
- **SDN file is ~117MB** (not 50MB as originally estimated). Consolidated is ~4MB.
- **RecentActions removed**: Was redundant with WeeklyDiffTable. Removed from DashboardPage.
- **IntelligencePage always shows chat**: Even when AI summary JSON is unavailable, the chat interface is rendered so users can still interact.

### API Security (Production)
- **Rate limiting**: 10 requests per IP per hour on `/api/ai-summary`
- **Message cap**: 500 chars max per user message
- **Conversation cap**: 10 messages max per session
- **Context truncation**: Context fields capped at 1000 chars
- **Response tokens**: Capped at 1024 per response
- **Topic restriction**: System prompt rejects off-topic questions
- **GROQ_API_KEY**: Server-side only (Vercel env var), never exposed to browser

### Not Yet Implemented
- **Tests**: Python unit tests for parsing/diffing, React component tests (test directories exist but are empty)
- **TimelineChart**: Placeholder — needs historical snapshot data to show real trends (will auto-populate as weekly pipeline runs)
- **OG Image**: Social sharing preview image for SEO
- **Code splitting**: Vite warns about 1.6MB JS bundle — could add dynamic imports for map/intelligence pages

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
The OFAC Advanced XML files are large (SDN: ~117MB, Consolidated: ~4MB). The parser loads the full tree (needed for cross-reference resolution) and builds 4 lookup tables:

```python
# scripts/parse_xml.py — actual implementation approach
from lxml import etree

def parse(filepath, list_type):
    tree = etree.parse(filepath)
    # Build lookups from cross-referenced sections
    country_id_to_iso2, location_id_to_iso2, profile_programs, _ = _build_lookups(tree)
    # Parse DistinctParties using lookups
    for dp in tree.getroot().find(_tag("DistinctParties")):
        entry = _parse_distinct_party(dp, location_id_to_iso2, profile_programs, list_type)
        # entry has: uid, name, entry_type, programs, countries, list_type, dob

# Lookup chain:
# CountryValues (ID→name) → COUNTRY_TO_ISO2 (name→ISO2) → country_id_to_iso2
# Locations (ID→CountryID) + country_id_to_iso2 → location_id_to_iso2
# SanctionsEntries (ProfileID→SanctionsMeasure[TypeID=1]/Comment) → profile_programs
# DistinctParty → VersionLocation/@LocationID → location_id_to_iso2 → countries
# DistinctParty → Profile/@ID → profile_programs → programs
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
- SDN list has ~18,700+ entries — WeeklyDiffTable only shows the weekly diff (not the full list)
- Country GeoJSON is ~14MB (258 countries) — loaded at map page mount
- JS bundle is ~1.6MB (could benefit from code splitting via dynamic imports for map/intelligence pages)
- JSON data files: split by concern (meta, map, programs, diffs) to enable parallel fetching
- XML parsing loads full tree into memory (~117MB SDN file) — requires adequate RAM in CI

### Security
- **GROQ_API_KEY**: Server-side only — stored as Vercel env var, proxied via Edge Function, never in frontend code
- **AI Chat rate limiting** (`api/ai-summary.ts`): 10 requests per IP per hour, 500 char message cap, 10 message conversation cap, 1024 max response tokens, off-topic rejection in system prompt
- **OFAC API**: Public but rate-limit respectfully (max 1 request per file per day for automation)
- **Path traversal protection**: `api/sanctions-data.ts` validates file paths, only allows `.json` files within `data/` directory
- **`.vercelignore`**: Excludes `data/snapshots/` and `scripts/downloads/` from deployment (large files)
- **`.gitignore`**: Excludes `.env`, `data/snapshots/`, `scripts/downloads/`, `.vercel/`
- All data is public government data — no PII concerns with the sanctions list itself

### Git Hygiene for /data
- The `/data` directory will grow over time with historical snapshots
- Consider `.gitattributes` to mark JSON files as binary for better diff performance
- Historical snapshots older than 6 months can be archived/compressed

---

## Quick Reference: Key URLs

| Resource | URL |
|----------|-----|
| **Live App** | https://sanctionspulse.vercel.app |
| **GitHub Repo** | https://github.com/Yashap-96/SanctionsPulse |
| **Vercel Dashboard** | https://vercel.com/yashap-96s-projects/sanctionspulse |
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
