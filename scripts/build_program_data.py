"""Extract active sanctions programs and count entries per program."""

import json
import pathlib

PROJECT_ROOT = pathlib.Path(__file__).resolve().parent.parent
SNAPSHOT_DIR = PROJECT_ROOT / "data" / "snapshots"
PROGRAM_DIR = PROJECT_ROOT / "data" / "programs"


def _load_json(path: pathlib.Path) -> list[dict]:
    if path.exists():
        with open(path) as f:
            return json.load(f)
    return []


def extract(
    sdn_entries: list[dict] | None = None,
    cons_entries: list[dict] | None = None,
) -> list[dict]:
    """Count entries per sanctions program across SDN and Consolidated lists.

    Returns:
        Sorted list of dicts with program name and counts.
    """
    if sdn_entries is None:
        sdn_entries = _load_json(SNAPSHOT_DIR / "sdn_latest.json")
    if cons_entries is None:
        cons_entries = _load_json(SNAPSHOT_DIR / "consolidated_latest.json")

    program_counts: dict[str, dict] = {}

    for entry in sdn_entries:
        for prog in entry.get("programs", []):
            if prog not in program_counts:
                program_counts[prog] = {"program": prog, "total": 0, "sdn": 0, "consolidated": 0}
            program_counts[prog]["total"] += 1
            program_counts[prog]["sdn"] += 1

    for entry in cons_entries:
        for prog in entry.get("programs", []):
            if prog not in program_counts:
                program_counts[prog] = {"program": prog, "total": 0, "sdn": 0, "consolidated": 0}
            program_counts[prog]["total"] += 1
            program_counts[prog]["consolidated"] += 1

    # Sort descending by total count
    result = sorted(program_counts.values(), key=lambda x: x["total"], reverse=True)
    return result


def extract_and_save(**kwargs) -> list[dict]:
    """Extract program data and persist to disk."""
    PROGRAM_DIR.mkdir(parents=True, exist_ok=True)
    data = extract(**kwargs)
    out_path = PROGRAM_DIR / "active_programs.json"
    with open(out_path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Program data saved to {out_path} ({len(data)} programs)")
    return data


if __name__ == "__main__":
    extract_and_save()
