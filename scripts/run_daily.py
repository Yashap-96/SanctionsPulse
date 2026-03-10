"""Orchestrator: run the full daily SanctionsPulse data pipeline."""

import json
import pathlib
import shutil
from datetime import date

PROJECT_ROOT = pathlib.Path(__file__).resolve().parent.parent
SNAPSHOT_DIR = PROJECT_ROOT / "data" / "snapshots"
META_PATH = PROJECT_ROOT / "data" / "meta.json"


def _rotate_snapshots():
    """Copy current *_latest.json to *_previous.json before new parse."""
    for name in ("sdn_latest.json", "consolidated_latest.json"):
        src = SNAPSHOT_DIR / name
        dst = SNAPSHOT_DIR / name.replace("_latest", "_previous")
        if src.exists():
            shutil.copy2(src, dst)
            print(f"  Rotated {src.name} -> {dst.name}")


def run():
    """Execute the full pipeline with error handling for each step."""
    today = date.today().isoformat()
    print(f"=== SanctionsPulse Daily Pipeline ({today}) ===\n")

    sdn_entries = []
    cons_entries = []
    diff = None
    summary = None

    # Step 1: Download
    print("[1/8] Downloading OFAC lists ...")
    try:
        from fetch_lists import download_all
        download_all()
        print()
    except Exception as e:
        print(f"  ERROR in fetch_lists: {e}\n")

    # Step 2: Rotate previous snapshots
    print("[2/8] Rotating snapshots ...")
    try:
        _rotate_snapshots()
        print()
    except Exception as e:
        print(f"  ERROR rotating snapshots: {e}\n")

    # Step 3: Parse XML
    print("[3/8] Parsing XML files ...")
    try:
        from parse_xml import parse_and_save
        sdn_entries, cons_entries = parse_and_save()
        print()
    except Exception as e:
        print(f"  ERROR in parse_xml: {e}\n")

    # Step 4: Compute diff
    print("[4/8] Computing diff ...")
    try:
        from diff_snapshots import diff_and_save
        diff = diff_and_save(diff_date=today)
        print()
    except Exception as e:
        print(f"  ERROR in diff_snapshots: {e}\n")

    # Step 5: Generate AI summary
    print("[5/8] Generating AI summary ...")
    try:
        from generate_summary import generate_and_save
        summary = generate_and_save(diff=diff, summary_date=today)
        print()
    except Exception as e:
        print(f"  ERROR in generate_summary: {e}\n")

    # Step 6: Build map data
    print("[6/8] Building map data ...")
    try:
        from build_map_data import aggregate_and_save
        aggregate_and_save(sdn_entries=sdn_entries, cons_entries=cons_entries, diff=diff)
        print()
    except Exception as e:
        print(f"  ERROR in build_map_data: {e}\n")

    # Step 7: Build program data
    print("[7/8] Building program data ...")
    try:
        from build_program_data import extract_and_save
        extract_and_save(sdn_entries=sdn_entries, cons_entries=cons_entries, diff=diff)
        print()
    except Exception as e:
        print(f"  ERROR in build_program_data: {e}\n")

    # Step 8: Build overview stats
    print("[8/8] Building overview stats ...")
    try:
        from build_overview_stats import build_and_save
        build_and_save(sdn_entries=sdn_entries, cons_entries=cons_entries)
        print()
    except Exception as e:
        print(f"  ERROR in build_overview_stats: {e}\n")

    # Update meta.json
    print("Updating meta.json ...")
    meta = {
        "sdn_total": len(sdn_entries),
        "consolidated_total": len(cons_entries),
        "last_updated": f"{today}T09:00:00Z",
        "last_diff_date": today if diff else None,
        "last_diff_summary": diff.get("summary") if diff else None,
    }
    META_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(META_PATH, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"  Saved {META_PATH}")

    print(f"\n=== Pipeline complete ===")
    print(f"  SDN entries:          {len(sdn_entries)}")
    print(f"  Consolidated entries: {len(cons_entries)}")
    if diff:
        s = diff["summary"]
        print(f"  Diff: +{s['added']} / -{s['removed']} / ~{s['updated']}")
    if summary:
        print(f"  AI summary: generated")
    else:
        print(f"  AI summary: skipped")


if __name__ == "__main__":
    run()
