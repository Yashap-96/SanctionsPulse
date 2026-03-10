"""Parse OFAC Advanced XML files into normalized JSON using lxml.

The OFAC Advanced XML uses a cross-reference structure:
  - ReferenceValueSets → CountryValues (ID → country name)
  - ReferenceValueSets → SanctionsProgramValues (ID → program code)
  - ReferenceValueSets → IDRegDocTypeValues (ID → document type name)
  - ReferenceValueSets → FeatureTypeValues (ID → feature type name)
  - Locations (ID → CountryID)
  - IDRegDocuments (IdentityID → passports, IDs, etc.)
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

# Digital currency Feature Type IDs
CRYPTO_FEATURE_IDS: dict[str, str] = {
    "344": "XBT", "345": "ETH", "444": "XMR", "566": "LTC",
    "686": "ZEC", "687": "DASH", "688": "BTG", "689": "ETC",
    "706": "BSV", "726": "BCH", "746": "XVG", "887": "USDT",
    "907": "XRP", "992": "TRX", "998": "USDC", "1007": "ARB",
    "1008": "BSC", "1167": "SOL",
}


def _tag(local: str) -> str:
    return f"{{{NS}}}{local}"


def _build_lookups(tree: etree._ElementTree) -> dict:
    """Build all lookup tables from the XML tree.

    Returns a dict with keys:
        country_id_to_iso2, location_id_to_iso2, profile_programs,
        program_id_to_name, doc_type_names, identity_docs, country_id_to_name
    """
    root = tree.getroot()
    rvs = root.find(_tag("ReferenceValueSets"))

    # 1. CountryValues: ID → country name → ISO2
    country_id_to_iso2: dict[str, str] = {}
    country_id_to_name: dict[str, str] = {}
    for child in rvs:
        if etree.QName(child.tag).localname == "CountryValues":
            for item in child:
                cid = item.get("ID")
                cname = item.text
                if cid and cname:
                    country_id_to_name[cid] = cname
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

    # 3. IDRegDocTypeValues: ID → doc type name
    doc_type_names: dict[str, str] = {}
    for child in rvs:
        if etree.QName(child.tag).localname == "IDRegDocTypeValues":
            for item in child:
                dtid = item.get("ID")
                dtname = item.text
                if dtid and dtname:
                    doc_type_names[dtid] = dtname

    # 4. Locations: LocationID → ISO2 (via CountryID)
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

    # 5. SanctionsEntries: ProfileID → list of program names
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
                if sanctions_type_id == "1":
                    comment = measure.find(_tag("Comment"))
                    if comment is not None and comment.text:
                        prog = comment.text.strip()
                        if prog and prog not in programs:
                            programs.append(prog)
            if programs:
                profile_programs[profile_id] = programs

    # 6. IDRegDocuments: IdentityID → list of {type, number, country}
    identity_docs: dict[str, list[dict]] = {}
    idr_el = root.find(_tag("IDRegDocuments"))
    if idr_el is not None:
        for doc in idr_el:
            identity_id = doc.get("IdentityID")
            if not identity_id:
                continue
            doc_type_id = doc.get("IDRegDocTypeID", "")
            issued_country_id = doc.get("IssuedBy-CountryID", "")
            reg_no_el = doc.find(_tag("IDRegistrationNo"))
            reg_no = reg_no_el.text.strip() if reg_no_el is not None and reg_no_el.text else ""
            if not reg_no:
                continue

            doc_entry = {
                "type": doc_type_names.get(doc_type_id, doc_type_id),
                "number": reg_no,
                "country": country_id_to_name.get(issued_country_id, ""),
            }
            identity_docs.setdefault(identity_id, []).append(doc_entry)

    print(f"  Lookups: {len(country_id_to_iso2)} countries, {len(location_id_to_iso2)} locations, "
          f"{len(profile_programs)} profile→programs, {len(doc_type_names)} doc types, "
          f"{len(identity_docs)} identities with docs")

    return {
        "country_id_to_iso2": country_id_to_iso2,
        "country_id_to_name": country_id_to_name,
        "location_id_to_iso2": location_id_to_iso2,
        "profile_programs": profile_programs,
        "program_id_to_name": program_id_to_name,
        "doc_type_names": doc_type_names,
        "identity_docs": identity_docs,
    }


def _parse_distinct_party(
    dp: etree._Element,
    lookups: dict,
    list_type: str,
) -> dict:
    """Parse a single DistinctParty element into a normalized dict."""
    location_id_to_iso2 = lookups["location_id_to_iso2"]
    profile_programs = lookups["profile_programs"]
    identity_docs = lookups["identity_docs"]

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

    # --- Aliases (all name variants) ---
    aliases: list[str] = []
    for alias in dp.iter(_tag("Alias")):
        for doc_name in alias.iter(_tag("DocumentedName")):
            parts = []
            for dnp in doc_name.iter(_tag("DocumentedNamePart")):
                for nv in dnp.iter(_tag("NamePartValue")):
                    if nv.text:
                        parts.append(nv.text.strip())
            if parts:
                full_name = " ".join(parts)
                if full_name != primary_name and full_name not in aliases:
                    aliases.append(full_name)

    # --- Entry type ---
    # OFAC PartySubTypeIDs: 1=Vessel, 2=Aircraft, 3=Entity, 4=Individual
    entry_type = "Unknown"
    if profile_el is not None:
        ptype = profile_el.get("PartySubTypeID", "")
        type_map = {"1": "Vessel", "2": "Aircraft", "3": "Entity", "4": "Individual"}
        entry_type = type_map.get(ptype, "Unknown")

    # --- Countries (via VersionLocation → Location → Country) ---
    countries: set[str] = set()
    for vl in dp.iter(_tag("VersionLocation")):
        loc_id = vl.get("LocationID")
        if loc_id and loc_id in location_id_to_iso2:
            countries.add(location_id_to_iso2[loc_id])

    # --- Nationalities (via Feature with FeatureTypeID=10 or 11) ---
    nationalities: list[str] = []
    for feat in dp.iter(_tag("Feature")):
        ftid = feat.get("FeatureTypeID", "")
        if ftid in ("10", "11"):  # Nationality Country, Citizenship Country
            for vl in feat.iter(_tag("VersionLocation")):
                loc_id = vl.get("LocationID")
                if loc_id and loc_id in location_id_to_iso2:
                    iso2 = location_id_to_iso2[loc_id]
                    if iso2 not in nationalities:
                        nationalities.append(iso2)

    # --- Programs (from SanctionsEntries lookup) ---
    programs = profile_programs.get(profile_id, [])

    # --- Date of birth ---
    dob = None
    for feat in dp.iter(_tag("Feature")):
        if feat.get("FeatureTypeID") == "8":  # Birthdate
            for date_period in feat.iter(_tag("DatePeriod")):
                start = date_period.find(_tag("Start"))
                if start is not None:
                    from_el = start.find(_tag("From"))
                    target = from_el if from_el is not None else start
                    year_el = target.find(_tag("Year"))
                    month_el = target.find(_tag("Month"))
                    day_el = target.find(_tag("Day"))
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
            if dob:
                break

    # --- ID Documents (from IDRegDocuments lookup via IdentityID) ---
    ids: list[dict] = []
    for identity_el in dp.iter(_tag("Identity")):
        identity_id = identity_el.get("ID")
        if identity_id and identity_id in identity_docs:
            ids.extend(identity_docs[identity_id])

    # --- Digital Currency Addresses (crypto wallets) ---
    crypto_wallets: list[dict] = []
    for feat in dp.iter(_tag("Feature")):
        ftid = feat.get("FeatureTypeID", "")
        if ftid in CRYPTO_FEATURE_IDS:
            currency = CRYPTO_FEATURE_IDS[ftid]
            for vd in feat.iter(_tag("VersionDetail")):
                if vd.text and vd.text.strip():
                    crypto_wallets.append({
                        "currency": currency,
                        "address": vd.text.strip(),
                    })

    entry = {
        "uid": uid,
        "name": primary_name,
        "entry_type": entry_type,
        "programs": programs,
        "countries": sorted(countries),
        "list_type": list_type,
        "dob": dob,
        "nationalities": nationalities,
        "aliases": aliases,
        "ids": ids,
        "crypto_wallets": crypto_wallets,
    }
    return entry


def parse(filepath: pathlib.Path, list_type: str) -> list[dict]:
    """Parse an Advanced XML file and return a list of normalized entry dicts."""
    filepath = pathlib.Path(filepath)
    print(f"Parsing {filepath.name} (list_type={list_type}) ...")

    # Load full tree (needed for cross-reference lookups)
    tree = etree.parse(filepath)
    lookups = _build_lookups(tree)

    # Parse DistinctParties
    root = tree.getroot()
    dp_container = root.find(_tag("DistinctParties"))
    entries = []

    if dp_container is not None:
        for dp in dp_container:
            entry = _parse_distinct_party(dp, lookups, list_type)
            entries.append(entry)

    print(f"  Parsed {len(entries)} entries from {filepath.name}")

    # Stats
    from collections import Counter
    type_counts = Counter(e["entry_type"] for e in entries)
    with_programs = sum(1 for e in entries if e["programs"])
    with_countries = sum(1 for e in entries if e["countries"])
    with_ids = sum(1 for e in entries if e["ids"])
    with_crypto = sum(1 for e in entries if e["crypto_wallets"])
    with_aliases = sum(1 for e in entries if e["aliases"])
    total_aliases = sum(len(e["aliases"]) for e in entries)

    print(f"  Types: {dict(type_counts.most_common())}")
    print(f"  With programs: {with_programs}, With countries: {with_countries}")
    print(f"  With IDs: {with_ids}, With crypto wallets: {with_crypto}")
    print(f"  With aliases: {with_aliases} ({total_aliases} total alias names)")

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
