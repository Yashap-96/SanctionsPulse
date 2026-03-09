"""Parse OFAC Advanced XML files into normalized JSON using lxml.

The OFAC Advanced XML uses a cross-reference structure:
  - ReferenceValueSets → CountryValues (ID → country name)
  - ReferenceValueSets → SanctionsProgramValues (ID → program code)
  - Locations (ID → CountryID)
  - DistinctParties → Profile → Feature → VersionLocation → LocationID
  - SanctionsEntries → ProfileID + SanctionsMeasure (programs)
"""

import json
import pathlib
from lxml import etree

NS = "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/ADVANCED_XML"

PROJECT_ROOT = pathlib.Path(__file__).resolve().parent.parent
DOWNLOAD_DIR = pathlib.Path(__file__).resolve().parent / "downloads"
SNAPSHOT_DIR = PROJECT_ROOT / "data" / "snapshots"

# Country name → ISO 3166-1 Alpha-2 mapping
COUNTRY_TO_ISO2: dict[str, str] = {
    "Afghanistan": "AF", "Albania": "AL", "Algeria": "DZ", "Angola": "AO",
    "Antigua and Barbuda": "AG", "Argentina": "AR", "Armenia": "AM",
    "Australia": "AU", "Austria": "AT", "Azerbaijan": "AZ",
    "Bahamas, The": "BS", "Bahrain": "BH", "Bangladesh": "BD",
    "Barbados": "BB", "Belarus": "BY", "Belgium": "BE", "Belize": "BZ",
    "Benin": "BJ", "Bolivia": "BO", "Bosnia and Herzegovina": "BA",
    "Brazil": "BR", "Bulgaria": "BG", "Burkina Faso": "BF", "Burma": "MM",
    "Cambodia": "KH", "Canada": "CA", "Cabo Verde": "CV",
    "Central African Republic": "CF", "Chile": "CL", "China": "CN",
    "Colombia": "CO", "Comoros": "KM", "Congo, Republic of the": "CG",
    "Congo, Democratic Republic of the": "CD", "Costa Rica": "CR",
    "Cote d Ivoire": "CI", "Croatia": "HR", "Cuba": "CU", "Cyprus": "CY",
    "Czech Republic": "CZ", "Denmark": "DK", "Djibouti": "DJ",
    "Dominica": "DM", "Dominican Republic": "DO", "Ecuador": "EC",
    "Egypt": "EG", "El Salvador": "SV", "Equatorial Guinea": "GQ",
    "Eritrea": "ER", "Estonia": "EE", "Ethiopia": "ET", "Fiji": "FJ",
    "Finland": "FI", "France": "FR", "The Gambia": "GM", "Georgia": "GE",
    "Germany": "DE", "Ghana": "GH", "Greece": "GR", "Guatemala": "GT",
    "Guinea": "GN", "Guinea-Bissau": "GW", "Guyana": "GY", "Haiti": "HT",
    "Honduras": "HN", "Hungary": "HU", "Iceland": "IS", "India": "IN",
    "Indonesia": "ID", "Iran": "IR", "Iraq": "IQ", "Ireland": "IE",
    "Israel": "IL", "Italy": "IT", "Jamaica": "JM", "Japan": "JP",
    "Jordan": "JO", "Kazakhstan": "KZ", "Kenya": "KE",
    "Korea, North": "KP", "Korea, South": "KR", "Kuwait": "KW",
    "Kyrgyzstan": "KG", "Laos": "LA", "Latvia": "LV", "Lebanon": "LB",
    "Liberia": "LR", "Libya": "LY", "Liechtenstein": "LI",
    "Lithuania": "LT", "Luxembourg": "LU",
    "North Macedonia, The Republic of": "MK", "Malaysia": "MY",
    "Maldives": "MV", "Mali": "ML", "Malta": "MT",
    "Marshall Islands": "MH", "Mauritania": "MR", "Mauritius": "MU",
    "Mexico": "MX", "Moldova": "MD", "Monaco": "MC", "Mongolia": "MN",
    "Morocco": "MA", "Mozambique": "MZ", "Namibia": "NA",
    "Netherlands": "NL", "New Zealand": "NZ", "Nicaragua": "NI",
    "Niger": "NE", "Nigeria": "NG", "Norway": "NO", "Oman": "OM",
    "Pakistan": "PK", "Palau": "PW", "Panama": "PA", "Paraguay": "PY",
    "Peru": "PE", "Philippines": "PH", "Poland": "PL", "Portugal": "PT",
    "Qatar": "QA", "Romania": "RO", "Russia": "RU", "Rwanda": "RW",
    "Saint Kitts and Nevis": "KN",
    "Saint Vincent and the Grenadines": "VC", "Samoa": "WS",
    "San Marino": "SM", "Saudi Arabia": "SA", "Senegal": "SN",
    "Serbia": "RS", "Seychelles": "SC", "Sierra Leone": "SL",
    "Singapore": "SG", "Slovakia": "SK", "Slovenia": "SI", "Somalia": "SO",
    "South Africa": "ZA", "Spain": "ES", "Sri Lanka": "LK", "Sudan": "SD",
    "Suriname": "SR", "Sweden": "SE", "Switzerland": "CH", "Syria": "SY",
    "Tajikistan": "TJ", "Tanzania": "TZ", "Thailand": "TH",
    "Trinidad and Tobago": "TT", "Tunisia": "TN", "Turkey": "TR",
    "Turkmenistan": "TM", "Uganda": "UG", "Ukraine": "UA",
    "United Arab Emirates": "AE", "United Kingdom": "GB",
    "United States": "US", "Uruguay": "UY", "Uzbekistan": "UZ",
    "Vanuatu": "VU", "Venezuela": "VE", "Vietnam": "VN", "Yemen": "YE",
    "Zambia": "ZM", "Zimbabwe": "ZW",
    # Territories / special regions
    "Aruba": "AW", "Bermuda": "BM", "Cayman Islands": "KY",
    "Gibraltar": "GI", "Hong Kong": "HK", "Jersey": "JE", "Macau": "MO",
    "Man, Isle of": "IM", "Netherlands Antilles": "AN",
    "Virgin Islands, British": "VG", "Taiwan": "TW", "Kosovo": "XK",
    "Montenegro": "ME", "South Sudan": "SS",
    "West Bank": "PS", "Palestinian": "PS", "Region: Gaza": "PS",
    "Region: Northern Mali": "ML",
}


def _tag(local: str) -> str:
    return f"{{{NS}}}{local}"


def _build_lookups(tree: etree._ElementTree) -> tuple[dict, dict, dict, dict]:
    """Build all lookup tables from the XML tree.

    Returns:
        (country_id_to_iso2, location_id_to_iso2, profile_programs, program_id_to_name)
    """
    root = tree.getroot()

    # 1. CountryValues: ID → country name → ISO2
    country_id_to_iso2: dict[str, str] = {}
    rvs = root.find(_tag("ReferenceValueSets"))
    for child in rvs:
        if etree.QName(child.tag).localname == "CountryValues":
            for item in child:
                cid = item.get("ID")
                cname = item.text
                if cid and cname:
                    iso2 = COUNTRY_TO_ISO2.get(cname, "")
                    if iso2:
                        country_id_to_iso2[cid] = iso2

    # 2. SanctionsProgramValues: ID → program code
    program_id_to_name: dict[str, str] = {}
    for child in rvs:
        if etree.QName(child.tag).localname == "SanctionsProgramValues":
            for item in child:
                pid = item.get("ID")
                pname = item.text
                if pid and pname:
                    program_id_to_name[pid] = pname

    # 3. Locations: LocationID → ISO2 (via CountryID)
    location_id_to_iso2: dict[str, str] = {}
    locations_el = root.find(_tag("Locations"))
    if locations_el is not None:
        for loc in locations_el:
            loc_id = loc.get("ID")
            country_el = loc.find(_tag("LocationCountry"))
            if loc_id and country_el is not None:
                cid = country_el.get("CountryID")
                if cid and cid in country_id_to_iso2:
                    location_id_to_iso2[loc_id] = country_id_to_iso2[cid]

    # 4. SanctionsEntries: ProfileID → list of program names
    profile_programs: dict[str, list[str]] = {}
    sanctions_el = root.find(_tag("SanctionsEntries"))
    if sanctions_el is not None:
        for entry in sanctions_el:
            profile_id = entry.get("ProfileID")
            if not profile_id:
                continue
            programs = []
            for measure in entry.iter(_tag("SanctionsMeasure")):
                sanctions_type_id = measure.get("SanctionsTypeID")
                # SanctionsTypeID="1" means "Program" — program name is in Comment
                if sanctions_type_id == "1":
                    comment = measure.find(_tag("Comment"))
                    if comment is not None and comment.text:
                        prog = comment.text.strip()
                        if prog and prog not in programs:
                            programs.append(prog)
            if programs:
                profile_programs[profile_id] = programs

    print(f"  Lookups: {len(country_id_to_iso2)} countries, {len(location_id_to_iso2)} locations, "
          f"{len(profile_programs)} profile→programs, {len(program_id_to_name)} program codes")

    return country_id_to_iso2, location_id_to_iso2, profile_programs, program_id_to_name


def _parse_distinct_party(
    dp: etree._Element,
    location_id_to_iso2: dict[str, str],
    profile_programs: dict[str, list[str]],
    list_type: str,
) -> dict:
    """Parse a single DistinctParty element into a normalized dict."""
    fixed_ref = dp.get("FixedRef") or dp.get("ID") or ""

    # --- UID ---
    try:
        uid = int(fixed_ref)
    except (ValueError, TypeError):
        uid = fixed_ref

    # --- Profile ID (for program lookup) ---
    profile_el = dp.find(_tag("Profile"))
    profile_id = profile_el.get("ID") if profile_el is not None else fixed_ref

    # --- Name ---
    name_parts = []
    for alias in dp.iter(_tag("Alias")):
        if alias.get("Primary") == "true":
            for doc_name in alias.iter(_tag("DocumentedName")):
                parts = []
                for dnp in doc_name.iter(_tag("DocumentedNamePart")):
                    for nv in dnp.iter(_tag("NamePartValue")):
                        if nv.text:
                            parts.append(nv.text.strip())
                if parts:
                    name_parts.append(" ".join(parts))
    # Fallback: any alias
    if not name_parts:
        for alias in dp.iter(_tag("Alias")):
            for doc_name in alias.iter(_tag("DocumentedName")):
                parts = []
                for dnp in doc_name.iter(_tag("DocumentedNamePart")):
                    for nv in dnp.iter(_tag("NamePartValue")):
                        if nv.text:
                            parts.append(nv.text.strip())
                if parts:
                    name_parts.append(" ".join(parts))
                    break
            if name_parts:
                break
    primary_name = name_parts[0] if name_parts else ""

    # --- Entry type ---
    entry_type = "Unknown"
    if profile_el is not None:
        ptype = profile_el.get("PartySubTypeID", "")
        # Common OFAC PartySubTypeIDs: 1=Unknown, 2=Vessel, 3=Entity, 4=Individual, 5=Aircraft
        type_map = {"1": "Unknown", "2": "Vessel", "3": "Entity", "4": "Individual", "5": "Aircraft"}
        entry_type = type_map.get(ptype, ptype)

    # --- Countries (via VersionLocation → Location → Country) ---
    countries: set[str] = set()
    for vl in dp.iter(_tag("VersionLocation")):
        loc_id = vl.get("LocationID")
        if loc_id and loc_id in location_id_to_iso2:
            countries.add(location_id_to_iso2[loc_id])

    # --- Programs (from SanctionsEntries lookup) ---
    programs = profile_programs.get(profile_id, [])

    # --- Date of birth ---
    dob = None
    for date_period in dp.iter(_tag("DatePeriod")):
        start = date_period.find(_tag("Start"))
        if start is not None:
            year_el = start.find(_tag("Year"))
            month_el = start.find(_tag("Month"))
            day_el = start.find(_tag("Day"))
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

    return {
        "uid": uid,
        "name": primary_name,
        "entry_type": entry_type,
        "programs": programs,
        "countries": sorted(countries),
        "list_type": list_type,
        "dob": dob,
    }


def parse(filepath: pathlib.Path, list_type: str) -> list[dict]:
    """Parse an Advanced XML file and return a list of normalized entry dicts."""
    filepath = pathlib.Path(filepath)
    print(f"Parsing {filepath.name} (list_type={list_type}) ...")

    # Load full tree (needed for cross-reference lookups)
    tree = etree.parse(filepath)
    _, location_id_to_iso2, profile_programs, _ = _build_lookups(tree)

    # Parse DistinctParties
    root = tree.getroot()
    dp_container = root.find(_tag("DistinctParties"))
    entries = []

    if dp_container is not None:
        for dp in dp_container:
            entry = _parse_distinct_party(dp, location_id_to_iso2, profile_programs, list_type)
            entries.append(entry)

    print(f"  Parsed {len(entries)} entries from {filepath.name}")

    # Stats
    with_programs = sum(1 for e in entries if e["programs"])
    with_countries = sum(1 for e in entries if e["countries"])
    print(f"  With programs: {with_programs}, With countries: {with_countries}")

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
        json.dump(sdn_entries, f)
    print(f"  Saved {sdn_out} ({sdn_out.stat().st_size / 1024 / 1024:.1f} MB)")

    with open(cons_out, "w") as f:
        json.dump(cons_entries, f)
    print(f"  Saved {cons_out}")

    return sdn_entries, cons_entries


if __name__ == "__main__":
    parse_and_save()
