"""Parse OFAC Advanced XML files into normalized JSON using lxml iterparse."""

import json
import pathlib
from lxml import etree

NS = "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/ADVANCED_XML"
NS_MAP = {"ns": NS}

PROJECT_ROOT = pathlib.Path(__file__).resolve().parent.parent
DOWNLOAD_DIR = pathlib.Path(__file__).resolve().parent / "downloads"
SNAPSHOT_DIR = PROJECT_ROOT / "data" / "snapshots"


def _tag(local: str) -> str:
    """Return a fully-qualified element tag."""
    return f"{{{NS}}}{local}"


def _extract_reference_data(filepath: pathlib.Path) -> dict:
    """First pass: build lookup tables from ReferenceData section."""
    countries = {}
    programs = {}

    context = etree.iterparse(filepath, events=("end",), tag=[
        _tag("Country"),
        _tag("SanctionsProgram"),
    ])

    for event, elem in context:
        local = etree.QName(elem.tag).localname

        if local == "Country":
            cid = elem.get("ID")
            code_el = elem.find(f"{{{NS}}}ISO2", namespaces=None)
            name_el = elem.find(f"{{{NS}}}Value", namespaces=None)
            if cid:
                countries[cid] = {
                    "code": code_el.text if code_el is not None and code_el.text else "",
                    "name": name_el.text if name_el is not None and name_el.text else "",
                }

        elif local == "SanctionsProgram":
            pid = elem.get("ID")
            name_el = elem.find(f"{{{NS}}}Value", namespaces=None)
            if pid:
                programs[pid] = name_el.text if name_el is not None and name_el.text else ""

        elem.clear()
        while elem.getprevious() is not None:
            del elem.getparent()[0]

    return {"countries": countries, "programs": programs}


def _text(element, xpath: str) -> str | None:
    """Get text from a sub-element or return None."""
    el = element.find(xpath)
    return el.text.strip() if el is not None and el.text else None


def _parse_entry(entry_elem, ref_data: dict, list_type: str) -> dict:
    """Parse a single DistinctParty / Entry element into a normalized dict."""
    uid_raw = entry_elem.get("FixedRef") or entry_elem.get("ID") or ""
    try:
        uid = int(uid_raw)
    except (ValueError, TypeError):
        uid = uid_raw

    # --- Name ---
    name_parts = []
    for alias in entry_elem.iter(_tag("Alias")):
        if alias.get("AliasType", "") in ("Name", ""):
            for doc_name in alias.iter(_tag("DocumentedName")):
                parts = []
                for dnp in doc_name.iter(_tag("DocumentedNamePart")):
                    for nv in dnp.iter(_tag("NamePartValue")):
                        if nv.text:
                            parts.append(nv.text.strip())
                if parts:
                    name_parts.append(" ".join(parts))
    primary_name = name_parts[0] if name_parts else ""

    # --- Entry type ---
    entry_type = "Unknown"
    profile_el = entry_elem.find(f".//{_tag('Profile')}")
    if profile_el is not None:
        ptype = profile_el.get("PartySubTypeID", "")
        if ptype:
            entry_type = ptype
    # Fallback: look at Identity element
    identity_el = entry_elem.find(f".//{_tag('Identity')}")
    if identity_el is not None:
        id_type = identity_el.get("Type", "")
        if id_type:
            entry_type = id_type

    # Normalise common types
    type_lower = entry_type.lower()
    if "individual" in type_lower:
        entry_type = "Individual"
    elif "entity" in type_lower:
        entry_type = "Entity"
    elif "vessel" in type_lower:
        entry_type = "Vessel"
    elif "aircraft" in type_lower:
        entry_type = "Aircraft"

    # --- Programs ---
    entry_programs = []
    for sp in entry_elem.iter(_tag("SanctionsProgram")):
        pid = sp.get("ID") or (sp.text.strip() if sp.text else "")
        prog_name = ref_data["programs"].get(pid, pid)
        if prog_name and prog_name not in entry_programs:
            entry_programs.append(prog_name)
    # Also check ProfileNotes / SanctionsProgramID
    for sp_id in entry_elem.iter(_tag("SanctionsProgramID")):
        if sp_id.text:
            pid = sp_id.text.strip()
            prog_name = ref_data["programs"].get(pid, pid)
            if prog_name and prog_name not in entry_programs:
                entry_programs.append(prog_name)

    # --- Countries ---
    entry_countries = set()
    for loc in entry_elem.iter(_tag("Location")):
        for c_el in loc.iter(_tag("Country")):
            cid = c_el.get("ID") or (c_el.text.strip() if c_el.text else "")
            info = ref_data["countries"].get(cid)
            if info and info["code"]:
                entry_countries.add(info["code"])

    # --- Addresses ---
    addresses = []
    for loc in entry_elem.iter(_tag("Location")):
        parts = []
        for part_tag in ("Address1", "Address2", "Address3", "City", "StateProvince", "PostalCode"):
            val = _text(loc, f".//{_tag(part_tag)}")
            if val:
                parts.append(val)
        country_el = loc.find(f".//{_tag('Country')}")
        if country_el is not None:
            cid = country_el.get("ID") or (country_el.text.strip() if country_el.text else "")
            info = ref_data["countries"].get(cid)
            if info and info["name"]:
                parts.append(info["name"])
        if parts:
            addresses.append(", ".join(parts))

    # --- IDs ---
    ids = []
    for doc in entry_elem.iter(_tag("IDRegistrationDocument")):
        id_entry = {}
        for field in ("IDRegistrationNo", "IssuingAuthority", "IDRegistrationDocumentType"):
            val = _text(doc, f".//{_tag(field)}")
            if val:
                id_entry[field] = val
        if id_entry:
            ids.append(id_entry)

    # --- Date of birth ---
    dob = None
    for date_period in entry_elem.iter(_tag("DatePeriod")):
        # Look for birth date
        dp_type = date_period.get("Type", "")
        if "birth" in dp_type.lower() or True:
            start = date_period.find(f".//{_tag('Start')}")
            if start is not None:
                year_el = start.find(f".//{_tag('Year')}")
                month_el = start.find(f".//{_tag('Month')}")
                day_el = start.find(f".//{_tag('Day')}")
                parts = []
                if year_el is not None and year_el.text:
                    parts.append(year_el.text.strip())
                if month_el is not None and month_el.text:
                    parts.append(month_el.text.strip().zfill(2))
                if day_el is not None and day_el.text:
                    parts.append(day_el.text.strip().zfill(2))
                if parts:
                    dob = "-".join(parts)
                    break

    # --- Nationalities ---
    nationalities = list(entry_countries)
    for nat in entry_elem.iter(_tag("Nationality")):
        cid = nat.get("CountryID") or nat.get("ID") or (nat.text.strip() if nat.text else "")
        info = ref_data["countries"].get(cid)
        if info and info["code"] and info["code"] not in nationalities:
            nationalities.append(info["code"])

    return {
        "uid": uid,
        "name": primary_name,
        "entry_type": entry_type,
        "programs": entry_programs,
        "countries": sorted(entry_countries),
        "list_type": list_type,
        "addresses": addresses,
        "ids": ids,
        "dob": dob,
        "nationalities": nationalities,
    }


def parse(filepath: pathlib.Path, list_type: str) -> list[dict]:
    """Parse an Advanced XML file and return a list of normalized entry dicts."""
    filepath = pathlib.Path(filepath)
    print(f"Parsing {filepath.name} (list_type={list_type}) ...")

    # First pass: reference data
    ref_data = _extract_reference_data(filepath)
    print(f"  Reference data: {len(ref_data['countries'])} countries, {len(ref_data['programs'])} programs")

    # Second pass: entries
    entries = []
    context = etree.iterparse(filepath, events=("end",), tag=_tag("DistinctParty"))

    for event, elem in context:
        entry = _parse_entry(elem, ref_data, list_type)
        entries.append(entry)

        # Free memory
        elem.clear()
        while elem.getprevious() is not None:
            del elem.getparent()[0]

    print(f"  Parsed {len(entries)} entries from {filepath.name}")
    return entries


def parse_and_save() -> tuple[list[dict], list[dict]]:
    """Parse both SDN and Consolidated XML files and save snapshots."""
    SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)

    sdn_path = DOWNLOAD_DIR / "SDN_ADVANCED.XML"
    cons_path = DOWNLOAD_DIR / "CONS_ADVANCED.XML"

    sdn_entries = parse(sdn_path, "SDN") if sdn_path.exists() else []
    cons_entries = parse(cons_path, "Consolidated") if cons_path.exists() else []

    sdn_out = SNAPSHOT_DIR / "sdn_latest.json"
    cons_out = SNAPSHOT_DIR / "consolidated_latest.json"

    with open(sdn_out, "w") as f:
        json.dump(sdn_entries, f, indent=2)
    print(f"  Saved {sdn_out}")

    with open(cons_out, "w") as f:
        json.dump(cons_entries, f, indent=2)
    print(f"  Saved {cons_out}")

    return sdn_entries, cons_entries


if __name__ == "__main__":
    parse_and_save()
