"""Compare current vs previous sanctions snapshots and produce a weekly diff."""

import json
import pathlib
from datetime import date

PROJECT_ROOT = pathlib.Path(__file__).resolve().parent.parent
SNAPSHOT_DIR = PROJECT_ROOT / "data" / "snapshots"
DIFF_DIR = PROJECT_ROOT / "data" / "diffs"


def _load_json(path: pathlib.Path) -> list[dict]:
    """Load a JSON snapshot file, returning an empty list if missing."""
    if path.exists():
        with open(path) as f:
            return json.load(f)
    return []


def compute_diff(
    current: list[dict],
    previous: list[dict],
    diff_date: str | None = None,
) -> dict:
    """Compare two lists of entry dicts by UID and return a structured diff.

    Args:
        current: Current snapshot entries.
        previous: Previous snapshot entries.
        diff_date: ISO date string; defaults to today.

    Returns:
        Diff dict with summary, additions, removals, and updates.
    """
    diff_date = diff_date or date.today().isoformat()

    prev_by_uid = {e["uid"]: e for e in previous}
    curr_by_uid = {e["uid"]: e for e in current}

    prev_uids = set(prev_by_uid.keys())
    curr_uids = set(curr_by_uid.keys())

    added_uids = curr_uids - prev_uids
    removed_uids = prev_uids - curr_uids
    common_uids = curr_uids & prev_uids

    additions = [curr_by_uid[uid] for uid in sorted(added_uids)]
    removals = [prev_by_uid[uid] for uid in sorted(removed_uids)]

    updates = []
    compare_fields = ("name", "programs", "countries")
    for uid in sorted(common_uids):
        old = prev_by_uid[uid]
        new = curr_by_uid[uid]
        changes = {}
        for field in compare_fields:
            old_val = old.get(field)
            new_val = new.get(field)
            if old_val != new_val:
                changes[field] = {"old": old_val, "new": new_val}
        if changes:
            updates.append({
                "uid": uid,
                "name": new.get("name", ""),
                "changes": changes,
            })

    return {
        "date": diff_date,
        "period": "weekly",
        "summary": {
            "added": len(additions),
            "removed": len(removals),
            "updated": len(updates),
        },
        "additions": additions,
        "removals": removals,
        "updates": updates,
    }


def diff_and_save(diff_date: str | None = None) -> dict:
    """Load snapshots, compute diff, and save the result."""
    diff_date = diff_date or date.today().isoformat()
    DIFF_DIR.mkdir(parents=True, exist_ok=True)

    # Load current snapshots
    sdn_current = _load_json(SNAPSHOT_DIR / "sdn_latest.json")
    cons_current = _load_json(SNAPSHOT_DIR / "consolidated_latest.json")
    current = sdn_current + cons_current

    # Load previous snapshots (saved as *_previous.json by the orchestrator)
    sdn_previous = _load_json(SNAPSHOT_DIR / "sdn_previous.json")
    cons_previous = _load_json(SNAPSHOT_DIR / "consolidated_previous.json")
    previous = sdn_previous + cons_previous

    diff = compute_diff(current, previous, diff_date)

    out_path = DIFF_DIR / f"weekly_{diff_date}.json"
    with open(out_path, "w") as f:
        json.dump(diff, f, indent=2)
    print(f"Diff saved to {out_path}")
    print(f"  Added: {diff['summary']['added']}, Removed: {diff['summary']['removed']}, Updated: {diff['summary']['updated']}")

    return diff


if __name__ == "__main__":
    diff_and_save()
