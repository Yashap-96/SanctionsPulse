"""Build activity_timeline.json from all daily diff files (15-day rolling window)."""

import json
import pathlib
from datetime import date, timedelta

PROJECT_ROOT = pathlib.Path(__file__).resolve().parent.parent
DIFF_DIR = PROJECT_ROOT / "data" / "diffs"
TIMELINE_DIR = PROJECT_ROOT / "data" / "timeline"

WINDOW_DAYS = 15


def build_and_save():
    """Scan all daily diff files and build a 15-day activity timeline."""
    today = date.today()
    window_start = today - timedelta(days=WINDOW_DAYS - 1)

    # Load all available diffs
    diff_by_date = {}
    for path in sorted(DIFF_DIR.glob("daily_*.json")):
        try:
            with open(path) as f:
                d = json.load(f)
            diff_by_date[d["date"]] = d["summary"]
        except (json.JSONDecodeError, KeyError):
            continue

    # Build timeline for each day in the window (fill gaps with zeros)
    days = []
    current = window_start
    while current <= today:
        iso = current.isoformat()
        summary = diff_by_date.get(iso, {"added": 0, "removed": 0, "updated": 0})
        days.append({
            "date": iso,
            "additions": summary["added"],
            "removals": summary["removed"],
            "updates": summary["updated"],
        })
        current += timedelta(days=1)

    timeline = {
        "period_start": window_start.isoformat(),
        "period_end": today.isoformat(),
        "window_days": WINDOW_DAYS,
        "total_additions": sum(d["additions"] for d in days),
        "total_removals": sum(d["removals"] for d in days),
        "total_updates": sum(d["updates"] for d in days),
        "days": days,
    }

    TIMELINE_DIR.mkdir(parents=True, exist_ok=True)
    out_path = TIMELINE_DIR / "activity_timeline.json"
    with open(out_path, "w") as f:
        json.dump(timeline, f, indent=2)

    print(f"  Saved {out_path} ({len(days)} days, {timeline['total_additions']} adds, {timeline['total_removals']} removals)")
    return timeline


if __name__ == "__main__":
    build_and_save()
