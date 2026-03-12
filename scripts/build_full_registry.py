"""Build full_registry.json by combining SDN + Consolidated snapshots."""

import json
import pathlib

PROJECT_ROOT = pathlib.Path(__file__).resolve().parent.parent
SNAPSHOT_DIR = PROJECT_ROOT / "data" / "snapshots"
REGISTRY_DIR = PROJECT_ROOT / "data" / "registry"

# Fields to include in the registry (keep it lean for the frontend)
REGISTRY_FIELDS = [
    "uid", "name", "entry_type", "programs", "countries", "list_type",
    "dob", "nationalities", "aliases", "ids", "crypto_wallets",
]


def build_and_save(sdn_entries=None, cons_entries=None):
    """Build full_registry.json from snapshot entries or files.

    Args:
        sdn_entries: List of SDN entry dicts (if already parsed in pipeline).
        cons_entries: List of Consolidated entry dicts (if already parsed).
    """
    # Load from files if not provided
    if sdn_entries is None:
        sdn_path = SNAPSHOT_DIR / "sdn_latest.json"
        if sdn_path.exists():
            with open(sdn_path) as f:
                sdn_entries = json.load(f)
        else:
            sdn_entries = []
            print("  WARNING: sdn_latest.json not found")

    if cons_entries is None:
        cons_path = SNAPSHOT_DIR / "consolidated_latest.json"
        if cons_path.exists():
            with open(cons_path) as f:
                cons_entries = json.load(f)
        else:
            cons_entries = []
            print("  WARNING: consolidated_latest.json not found")

    # Combine and keep only the fields the frontend needs
    registry = []
    for entry in sdn_entries + cons_entries:
        row = {k: entry.get(k) for k in REGISTRY_FIELDS}
        registry.append(row)

    # Sort by name for consistent ordering
    registry.sort(key=lambda e: (e.get("name") or "").upper())

    REGISTRY_DIR.mkdir(parents=True, exist_ok=True)
    out_path = REGISTRY_DIR / "full_registry.json"
    with open(out_path, "w") as f:
        json.dump(registry, f, separators=(",", ":"))

    print(f"  Saved {out_path} ({len(registry)} entries, {out_path.stat().st_size / 1024:.0f} KB)")
    return registry


if __name__ == "__main__":
    build_and_save()
