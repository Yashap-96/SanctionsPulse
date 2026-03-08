"""Aggregate sanctions entries by country for the interactive map."""

import json
import pathlib

PROJECT_ROOT = pathlib.Path(__file__).resolve().parent.parent
SNAPSHOT_DIR = PROJECT_ROOT / "data" / "snapshots"
DIFF_DIR = PROJECT_ROOT / "data" / "diffs"
MAP_DIR = PROJECT_ROOT / "data" / "map"


def _load_json(path: pathlib.Path) -> list[dict]:
    if path.exists():
        with open(path) as f:
            return json.load(f)
    return []


def aggregate(
    sdn_entries: list[dict] | None = None,
    cons_entries: list[dict] | None = None,
    diff: dict | None = None,
) -> dict:
    """Build a country-level aggregation of sanctions data.

    Returns:
        Dict keyed by ISO-2 country code with counts and program lists.
    """
    if sdn_entries is None:
        sdn_entries = _load_json(SNAPSHOT_DIR / "sdn_latest.json")
    if cons_entries is None:
        cons_entries = _load_json(SNAPSHOT_DIR / "consolidated_latest.json")

    country_data: dict[str, dict] = {}

    def _ensure(code: str) -> dict:
        if code not in country_data:
            country_data[code] = {
                "total": 0,
                "sdn": 0,
                "consolidated": 0,
                "programs": [],
                "weekly_added": 0,
                "weekly_removed": 0,
            }
        return country_data[code]

    for entry in sdn_entries:
        for code in entry.get("countries", []):
            if not code:
                continue
            rec = _ensure(code)
            rec["total"] += 1
            rec["sdn"] += 1
            for prog in entry.get("programs", []):
                if prog not in rec["programs"]:
                    rec["programs"].append(prog)

    for entry in cons_entries:
        for code in entry.get("countries", []):
            if not code:
                continue
            rec = _ensure(code)
            rec["total"] += 1
            rec["consolidated"] += 1
            for prog in entry.get("programs", []):
                if prog not in rec["programs"]:
                    rec["programs"].append(prog)

    # Overlay weekly diff counts if available
    if diff is None:
        # Try to load the latest diff
        from datetime import date
        diff_path = DIFF_DIR / f"weekly_{date.today().isoformat()}.json"
        if diff_path.exists():
            with open(diff_path) as f:
                diff = json.load(f)

    if diff:
        for addition in diff.get("additions", []):
            for code in addition.get("countries", []):
                if code:
                    _ensure(code)["weekly_added"] += 1
        for removal in diff.get("removals", []):
            for code in removal.get("countries", []):
                if code:
                    _ensure(code)["weekly_removed"] += 1

    return country_data


def aggregate_and_save(**kwargs) -> dict:
    """Aggregate and persist country sanctions data."""
    MAP_DIR.mkdir(parents=True, exist_ok=True)
    data = aggregate(**kwargs)
    out_path = MAP_DIR / "country_sanctions.json"
    with open(out_path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Map data saved to {out_path} ({len(data)} countries)")
    return data


if __name__ == "__main__":
    aggregate_and_save()
