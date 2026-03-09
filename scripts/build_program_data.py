"""Extract active sanctions programs and count entries per program."""

import json
import pathlib
from datetime import date

PROJECT_ROOT = pathlib.Path(__file__).resolve().parent.parent
SNAPSHOT_DIR = PROJECT_ROOT / "data" / "snapshots"
DIFF_DIR = PROJECT_ROOT / "data" / "diffs"
PROGRAM_DIR = PROJECT_ROOT / "data" / "programs"

# Known program descriptions (code → description)
PROGRAM_DESCRIPTIONS: dict[str, str] = {
    "SDGT": "Specially Designated Global Terrorist",
    "SDNT": "Specially Designated Narcotics Trafficker",
    "SDNTK": "Specially Designated Narcotics Trafficker Kingpin",
    "IRAN": "Iran-related sanctions",
    "IRAN-TRA": "Iran Transactions and Sanctions Regulations",
    "IRAN-HR": "Iran human rights abuses",
    "IRAN-EO13846": "Iran reimposition of certain sanctions",
    "IRAN-EO13871": "Iran metals, mining, textiles, and other sectors",
    "IRAN-EO13876": "Iran financial sector sanctions",
    "IRGC": "Islamic Revolutionary Guard Corps",
    "RUSSIA-EO14024": "Russia harmful foreign activities",
    "RUSSIA-EO14071": "Russia services and technology restrictions",
    "UKRAINE-EO13660": "Ukraine-related destabilizing activities",
    "UKRAINE-EO13661": "Ukraine-related military and defense",
    "UKRAINE-EO13662": "Ukraine-related financial and energy sectors",
    "UKRAINE-EO13685": "Crimea region of Ukraine",
    "DPRK": "North Korea weapons of mass destruction",
    "DPRK2": "North Korea WMD proliferation",
    "DPRK3": "North Korea additional sanctions",
    "DPRK4": "North Korea maximum pressure",
    "CUBA": "Cuba comprehensive sanctions",
    "SYRIA": "Syria regime sanctions",
    "VENEZUELA": "Venezuela / Maduro regime sanctions",
    "CYBER2": "Malicious cyber-enabled activities",
    "GLOMAG": "Global Magnitsky human rights accountability",
    "TCO": "Transnational criminal organizations",
    "CMIC": "Chinese military-industrial complex",
    "NS-CMIC": "Non-SDN Chinese military-industrial complex",
    "WMD": "Weapons of mass destruction proliferators",
    "NPWMD": "Non-proliferation of WMD",
    "FTO": "Foreign Terrorist Organization",
    "SDNTK": "Narcotics kingpin",
    "BALKANS": "Western Balkans stabilization",
    "BURUNDI": "Burundi-related sanctions",
    "CAATSA": "Countering America's Adversaries Through Sanctions",
    "CAR": "Central African Republic",
    "DARFUR": "Darfur region of Sudan",
    "DRCONGO": "Democratic Republic of the Congo",
    "ETHIOPIA": "Ethiopia-related sanctions",
    "FSE-IR": "Foreign sanctions evaders (Iran)",
    "FSE-SY": "Foreign sanctions evaders (Syria)",
    "HRIT-IR": "Human rights abuses (Iran)",
    "HRIT-SY": "Human rights abuses (Syria)",
    "IFSR": "Iranian financial sanctions regulations",
    "IRAQ2": "Iraq-related sanctions",
    "LEBANON": "Lebanon-related sanctions",
    "LIBYA2": "Libya-related sanctions",
    "MAGNIT": "Sergei Magnitsky rule of law accountability",
    "MALI": "Mali-related sanctions",
    "MYANMAR": "Myanmar/Burma-related sanctions",
    "NICARAGUA": "Nicaragua-related sanctions",
    "SOMALIA": "Somalia sanctions",
    "SOUTH-SUDAN": "South Sudan-related sanctions",
    "YEMEN": "Yemen-related sanctions",
    "ZIMBABWE": "Zimbabwe sanctions",
    "561LIST": "Iran-related non-SDN list",
    "SSI-EO13662": "Sectoral Sanctions Identifications",
    "MBS": "Maritime sanctions evasion",
    "ELECTION-EO13848": "Election interference sanctions",
    "ILLICIT-DRUGS-EO14059": "International illicit drug trade",
    "REPO-EO14068": "Russian government assets",
}


def _load_json(path: pathlib.Path) -> list[dict]:
    if path.exists():
        with open(path) as f:
            return json.load(f)
    return []


def extract(
    sdn_entries: list[dict] | None = None,
    cons_entries: list[dict] | None = None,
    diff: dict | None = None,
) -> list[dict]:
    """Count entries per sanctions program across SDN and Consolidated lists.

    Returns:
        Sorted list of dicts matching the SanctionsProgram frontend interface.
    """
    if sdn_entries is None:
        sdn_entries = _load_json(SNAPSHOT_DIR / "sdn_latest.json")
    if cons_entries is None:
        cons_entries = _load_json(SNAPSHOT_DIR / "consolidated_latest.json")

    today = date.today().isoformat()
    program_counts: dict[str, dict] = {}

    def _ensure(prog: str) -> dict:
        if prog not in program_counts:
            program_counts[prog] = {
                "code": prog,
                "name": PROGRAM_DESCRIPTIONS.get(prog, prog),
                "entry_count_sdn": 0,
                "entry_count_consolidated": 0,
                "last_updated": today,
                "weekly_added": 0,
                "weekly_removed": 0,
                "description": PROGRAM_DESCRIPTIONS.get(prog, f"{prog} sanctions program"),
            }
        return program_counts[prog]

    for entry in sdn_entries:
        for prog in entry.get("programs", []):
            _ensure(prog)["entry_count_sdn"] += 1

    for entry in cons_entries:
        for prog in entry.get("programs", []):
            _ensure(prog)["entry_count_consolidated"] += 1

    # Overlay weekly diff counts if available
    if diff is None:
        diff_path = DIFF_DIR / f"weekly_{today}.json"
        if diff_path.exists():
            with open(diff_path) as f:
                diff = json.load(f)

    if diff:
        for addition in diff.get("additions", []):
            for prog in addition.get("programs", []):
                _ensure(prog)["weekly_added"] += 1
        for removal in diff.get("removals", []):
            for prog in removal.get("programs", []):
                _ensure(prog)["weekly_removed"] += 1

    # Sort descending by total count
    result = sorted(
        program_counts.values(),
        key=lambda x: x["entry_count_sdn"] + x["entry_count_consolidated"],
        reverse=True,
    )
    return result


def extract_and_save(**kwargs) -> list[dict]:
    """Extract program data and persist to disk."""
    PROGRAM_DIR.mkdir(parents=True, exist_ok=True)
    data = extract(**kwargs)
    out_path = PROGRAM_DIR / "active_programs.json"
    with open(out_path, "w") as f:
        json.dump({"programs": data}, f, indent=2)
    print(f"Program data saved to {out_path} ({len(data)} programs)")
    return data


if __name__ == "__main__":
    extract_and_save()
