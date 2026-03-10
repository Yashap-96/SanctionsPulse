"""Build aggregate overview statistics from sanctions snapshots."""

import json
import pathlib
from collections import Counter

PROJECT_ROOT = pathlib.Path(__file__).resolve().parent.parent
SNAPSHOT_DIR = PROJECT_ROOT / "data" / "snapshots"
DATA_DIR = PROJECT_ROOT / "data"


def _load_json(path: pathlib.Path) -> list[dict]:
    if path.exists():
        with open(path) as f:
            return json.load(f)
    return []


def build(
    sdn_entries: list[dict] | None = None,
    cons_entries: list[dict] | None = None,
) -> dict:
    if sdn_entries is None:
        sdn_entries = _load_json(SNAPSHOT_DIR / "sdn_latest.json")
    if cons_entries is None:
        cons_entries = _load_json(SNAPSHOT_DIR / "consolidated_latest.json")

    all_entries = sdn_entries + cons_entries

    types = Counter(e.get("entry_type", "Unknown") for e in all_entries)
    with_ids = sum(1 for e in all_entries if e.get("ids"))
    total_ids = sum(len(e.get("ids", [])) for e in all_entries)
    with_crypto = sum(1 for e in all_entries if e.get("crypto_wallets"))
    total_crypto = sum(len(e.get("crypto_wallets", [])) for e in all_entries)
    with_aliases = sum(1 for e in all_entries if e.get("aliases"))
    total_aliases = sum(len(e.get("aliases", [])) for e in all_entries)
    with_addresses = sum(1 for e in all_entries if e.get("addresses"))
    total_addresses = sum(len(e.get("addresses", [])) for e in all_entries)

    return {
        "entry_types": dict(types.most_common()),
        "id_documents": {"entries": with_ids, "total": total_ids},
        "crypto_wallets": {"entries": with_crypto, "total": total_crypto},
        "aliases": {"entries": with_aliases, "total": total_aliases},
        "addresses": {"entries": with_addresses, "total": total_addresses},
    }


def build_and_save(**kwargs) -> dict:
    data = build(**kwargs)
    out_path = DATA_DIR / "overview_stats.json"
    with open(out_path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Overview stats saved to {out_path}")
    return data


if __name__ == "__main__":
    build_and_save()
