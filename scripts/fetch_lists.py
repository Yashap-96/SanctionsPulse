"""Download SDN_ADVANCED.XML and CONS_ADVANCED.XML from the OFAC Sanctions List Service."""

import pathlib
import requests

BASE_URL = "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/"
HEADERS = {
    "User-Agent": "SanctionsPulse/1.0 (https://github.com/sanctionspulse/SanctionsPulse)"
}

PROJECT_ROOT = pathlib.Path(__file__).resolve().parent.parent
DOWNLOAD_DIR = pathlib.Path(__file__).resolve().parent / "downloads"

FILES = [
    "SDN_ADVANCED.XML",
    "CONS_ADVANCED.XML",
]


def download_file(filename: str) -> pathlib.Path:
    """Download a single file from the OFAC SLS API."""
    url = BASE_URL + filename
    dest = DOWNLOAD_DIR / filename
    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Downloading {url} ...")
    resp = requests.get(url, headers=HEADERS, stream=True, timeout=120)
    resp.raise_for_status()

    with open(dest, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)

    size_mb = dest.stat().st_size / (1024 * 1024)
    print(f"  Saved {dest.name} ({size_mb:.1f} MB)")
    return dest


def download_all() -> list[pathlib.Path]:
    """Download all OFAC Advanced XML files."""
    paths = []
    for filename in FILES:
        path = download_file(filename)
        paths.append(path)
    return paths


if __name__ == "__main__":
    download_all()
