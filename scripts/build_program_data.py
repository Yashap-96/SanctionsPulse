"""Extract active sanctions programs and count entries per program."""

import json
import pathlib
from datetime import date

PROJECT_ROOT = pathlib.Path(__file__).resolve().parent.parent
SNAPSHOT_DIR = PROJECT_ROOT / "data" / "snapshots"
DIFF_DIR = PROJECT_ROOT / "data" / "diffs"
PROGRAM_DIR = PROJECT_ROOT / "data" / "programs"

# Short display names (code → short name)
PROGRAM_NAMES: dict[str, str] = {
    "SDGT": "Global Terrorism",
    "SDNT": "Narcotics Trafficking",
    "SDNTK": "Narcotics Kingpin",
    "IRAN": "Iran Sanctions",
    "IRAN-TRA": "Iran Transactions",
    "IRAN-HR": "Iran Human Rights",
    "IRAN-EO13846": "Iran Reimposition",
    "IRAN-EO13871": "Iran Metals & Mining",
    "IRAN-EO13876": "Iran Financial Sector",
    "IRAN-EO13902": "Iran Industrial Sectors",
    "IRAN-CON-ARMS-EO": "Iran Conventional Arms",
    "IRGC": "Revolutionary Guard Corps",
    "IFSR": "Iran Financial Regulations",
    "IFCA": "Iran Counter-Proliferation",
    "RUSSIA-EO14024": "Russia Harmful Activities",
    "RUSSIA-EO14071": "Russia Tech Restrictions",
    "RUSSIA-EO14065": "Russia Energy Investment",
    "UKRAINE-EO13660": "Ukraine Destabilization",
    "UKRAINE-EO13661": "Ukraine Military & Defense",
    "UKRAINE-EO13662": "Ukraine Financial & Energy",
    "UKRAINE-EO13685": "Crimea Region",
    "DPRK": "North Korea WMD",
    "DPRK2": "North Korea Proliferation",
    "DPRK3": "North Korea Additional",
    "DPRK4": "North Korea Max Pressure",
    "DPRK-NKSPEA": "North Korea NKSPEA",
    "CUBA": "Cuba Sanctions",
    "SYRIA": "Syria Regime",
    "VENEZUELA": "Venezuela Sanctions",
    "VENEZUELA-EO13850": "Venezuela Economy",
    "VENEZUELA-EO13884": "Venezuela Gold Sector",
    "CYBER2": "Cyber Activities",
    "CYBER3": "Cyber Elections",
    "CYBER4": "Cyber Infrastructure",
    "GLOMAG": "Global Magnitsky",
    "TCO": "Transnational Crime",
    "CMIC": "Chinese Military-Industrial",
    "CMIC-EO13959": "Chinese Military Companies",
    "NS-CMIC": "Non-SDN Chinese Military",
    "WMD": "WMD Proliferators",
    "NPWMD": "Non-Proliferation WMD",
    "FTO": "Foreign Terrorist Org",
    "BALKANS": "Western Balkans",
    "BALKANS-EO14033": "Balkans Corruption",
    "BURUNDI": "Burundi Sanctions",
    "CAATSA": "CAATSA",
    "CAATSA - RUSSIA": "CAATSA Russia",
    "CAATSA - IRAN": "CAATSA Iran",
    "CAR": "Central African Republic",
    "DARFUR": "Darfur Sanctions",
    "DRCONGO": "DR Congo Sanctions",
    "ETHIOPIA": "Ethiopia Sanctions",
    "ETHIOPIA-EO14046": "Ethiopia Crisis",
    "FSE-IR": "Sanctions Evaders (Iran)",
    "FSE-SY": "Sanctions Evaders (Syria)",
    "HRIT-IR": "Human Rights (Iran)",
    "HRIT-SY": "Human Rights (Syria)",
    "IRAQ2": "Iraq Sanctions",
    "IRAQ3": "Iraq Destabilization",
    "LEBANON": "Lebanon Sanctions",
    "LIBYA2": "Libya Sanctions",
    "LIBYA3": "Libya Stability",
    "MAGNIT": "Magnitsky Act",
    "MALI": "Mali Sanctions",
    "MALI-EO13882": "Mali Peace Process",
    "MYANMAR": "Myanmar Sanctions",
    "BURMA-EO14014": "Myanmar Military Junta",
    "NICARAGUA": "Nicaragua Sanctions",
    "NICARAGUA-NHRAA": "Nicaragua Human Rights",
    "SOMALIA": "Somalia Sanctions",
    "SOUTH-SUDAN": "South Sudan Sanctions",
    "SOUTH SUDAN": "South Sudan Conflict",
    "SUDAN-EO14098": "Sudan Stability",
    "YEMEN": "Yemen Sanctions",
    "ZIMBABWE": "Zimbabwe Sanctions",
    "BELARUS": "Belarus Sanctions",
    "BELARUS-EO14038": "Belarus Democracy",
    "561LIST": "Iran 561 List",
    "561-Related": "Iran 561-Related",
    "SSI-EO13662": "Sectoral Sanctions",
    "MBS": "Maritime Evasion",
    "NS-PLC": "Palestinian Legis. Council",
    "HK-EO13936": "Hong Kong Autonomy",
    "ELECTION-EO13848": "Election Interference",
    "PEESA-EO14039": "Election Protection",
    "ILLICIT-DRUGS-EO14059": "Illicit Drug Trade",
    "REPO-EO14068": "Russian Gov Assets",
    "PAARSSR-EO13894": "Space Resources",
    "HOSTAGES-EO14078": "Hostage-Taking",
    "ICC-EO14203": "ICC Sanctions",
    "PAIPA": "Pariah States",
    "SSIDES": "Syria Drug Trade",
    "UHRPA": "Uyghur Human Rights",
}

# Detailed descriptions (code → one-line explanation)
PROGRAM_DESCRIPTIONS: dict[str, str] = {
    "SDGT": "Targets individuals and entities that commit, threaten, or support terrorism designated under Executive Order 13224.",
    "SDNT": "Targets significant foreign narcotics traffickers and their organizations under the Foreign Narcotics Kingpin Designation Act.",
    "SDNTK": "Targets the most significant foreign narcotics kingpins and their networks under the Kingpin Act.",
    "IRAN": "Comprehensive sanctions targeting Iran's nuclear program, support for terrorism, and human rights violations.",
    "IRAN-TRA": "Regulates transactions with Iran under the Iranian Transactions and Sanctions Regulations (31 CFR Part 560).",
    "IRAN-HR": "Targets persons responsible for serious human rights abuses against the people of Iran.",
    "IRAN-EO13846": "Reimposed sanctions on Iran following U.S. withdrawal from the JCPOA nuclear deal.",
    "IRAN-EO13871": "Targets Iran's metals, mining, textiles, construction, and manufacturing sectors.",
    "IRAN-EO13876": "Targets Iran's financial sector including the Central Bank of Iran and sovereign wealth fund.",
    "IRAN-EO13902": "Targets additional sectors of Iran's economy including construction and manufacturing.",
    "IRAN-CON-ARMS-EO": "Targets the transfer of conventional arms to or from Iran and related proliferation activities.",
    "IRGC": "Targets Iran's Islamic Revolutionary Guard Corps and its affiliates designated as a foreign terrorist organization.",
    "IFSR": "Targets foreign financial institutions that facilitate transactions for sanctioned Iranian entities.",
    "IFCA": "Sanctions on Iran's energy, shipping, shipbuilding, and port sectors under the Iran Freedom and Counter-Proliferation Act.",
    "RUSSIA-EO14024": "Targets Russia for malicious cyber activities, election interference, transnational corruption, and undermining international institutions.",
    "RUSSIA-EO14071": "Prohibits export of accounting, consulting, and other services to Russia following the Ukraine invasion.",
    "RUSSIA-EO14065": "Prohibits new investment in the Russian Federation's energy sector by U.S. persons.",
    "UKRAINE-EO13660": "Targets persons responsible for or complicit in actions undermining democratic processes in Ukraine.",
    "UKRAINE-EO13661": "Targets Russian defense and intelligence officials involved in the destabilization of Ukraine.",
    "UKRAINE-EO13662": "Targets entities operating in Russia's financial services, energy, metals, mining, and defense sectors.",
    "UKRAINE-EO13685": "Prohibits trade, investment, and transactions related to the Crimea region of Ukraine.",
    "DPRK": "Targets North Korea's weapons of mass destruction and ballistic missile programs.",
    "DPRK2": "Targets proliferation networks supporting North Korea's nuclear and missile development.",
    "DPRK3": "Additional sanctions on North Korea addressing continued provocative actions and WMD proliferation.",
    "DPRK4": "Maximum pressure campaign targeting North Korea's revenue sources and sanctions evasion networks.",
    "DPRK-NKSPEA": "Sanctions under the North Korea Sanctions and Policy Enhancement Act targeting WMD and human rights abuses.",
    "CUBA": "Comprehensive U.S. embargo on Cuba restricting trade, financial transactions, and travel.",
    "SYRIA": "Targets the Assad regime, its officials, and entities supporting repression of the Syrian people.",
    "VENEZUELA": "Targets the Maduro regime and its supporters undermining democratic governance in Venezuela.",
    "VENEZUELA-EO13850": "Targets sectors of the Venezuelan economy including gold exploited by the Maduro regime.",
    "VENEZUELA-EO13884": "Targets Venezuela's gold sector and corrupt actors enriching themselves at the expense of the Venezuelan people.",
    "CYBER2": "Targets persons engaged in significant malicious cyber-enabled activities threatening U.S. national security.",
    "CYBER3": "Targets foreign persons interfering in U.S. elections through malicious cyber operations.",
    "CYBER4": "Targets malicious cyber activities against U.S. critical infrastructure and government networks.",
    "GLOMAG": "Targets perpetrators of serious human rights abuse and corruption worldwide under the Global Magnitsky Act.",
    "TCO": "Targets significant transnational criminal organizations and their leaders, facilitators, and financial networks.",
    "CMIC": "Targets Chinese companies operating in the defense and surveillance technology sectors of the military-industrial complex.",
    "CMIC-EO13959": "Prohibits U.S. persons from investing in Chinese military-industrial complex companies.",
    "NS-CMIC": "Non-SDN list of Chinese military companies subject to investment restrictions but not full asset blocking.",
    "WMD": "Targets proliferators of weapons of mass destruction and their delivery systems worldwide.",
    "NPWMD": "Targets entities contributing to the proliferation of weapons of mass destruction and their means of delivery.",
    "FTO": "Designates foreign organizations that engage in terrorist activity threatening U.S. nationals or national security.",
    "BALKANS": "Targets persons undermining peace, security, and stability in the Western Balkans region.",
    "BALKANS-EO14033": "Targets corruption and organized crime destabilizing the Western Balkans.",
    "BURUNDI": "Targets persons responsible for actions threatening the peace, security, or stability of Burundi.",
    "CAATSA": "Broad sanctions legislation targeting Russia, Iran, and North Korea across multiple sectors.",
    "CAATSA - RUSSIA": "CAATSA provisions targeting Russia's defense, intelligence, mining, and energy pipeline sectors.",
    "CAATSA - IRAN": "CAATSA provisions targeting Iran's ballistic missile program and support for terrorism.",
    "CAR": "Targets persons contributing to the conflict and instability in the Central African Republic.",
    "DARFUR": "Targets persons responsible for genocide, war crimes, and human rights abuses in the Darfur region of Sudan.",
    "DRCONGO": "Targets armed groups and individuals contributing to the conflict in the Democratic Republic of the Congo.",
    "ETHIOPIA": "Targets persons contributing to the crisis and human rights abuses in Ethiopia.",
    "ETHIOPIA-EO14046": "Addresses the crisis in northern Ethiopia and the humanitarian emergency in the Tigray region.",
    "FSE-IR": "Targets foreign entities helping sanctioned Iranian persons evade U.S. sanctions.",
    "FSE-SY": "Targets foreign entities helping sanctioned Syrian persons evade U.S. sanctions.",
    "HRIT-IR": "Targets persons responsible for serious human rights abuses in Iran including censorship and political repression.",
    "HRIT-SY": "Targets persons responsible for serious human rights abuses in Syria under the Assad regime.",
    "IRAQ2": "Targets persons threatening the peace and stability of Iraq and undermining democratic governance.",
    "IRAQ3": "Targets destabilizing activities and corruption threatening Iraq's sovereignty.",
    "LEBANON": "Targets persons undermining Lebanon's sovereignty and contributing to political and economic instability.",
    "LIBYA2": "Targets persons threatening the peace, security, and stability of Libya.",
    "LIBYA3": "Targets threats to Libya's stability and actors obstructing the peace process.",
    "MAGNIT": "Targets persons responsible for the death of Sergei Magnitsky and other gross human rights violations in Russia.",
    "MALI": "Targets persons threatening the peace, security, and stability of Mali.",
    "MALI-EO13882": "Targets those obstructing the peace process and implementation of the Algiers Accord in Mali.",
    "MYANMAR": "Targets the Myanmar military and entities responsible for the repression of ethnic minorities.",
    "BURMA-EO14014": "Targets the Myanmar military junta and its leaders following the February 2021 coup.",
    "NICARAGUA": "Targets persons responsible for undermining democratic institutions and human rights in Nicaragua.",
    "NICARAGUA-NHRAA": "Sanctions under the Nicaragua Human Rights and Anticorruption Act targeting regime officials.",
    "SOMALIA": "Targets persons threatening the peace, security, and stability of Somalia including Al-Shabaab militants.",
    "SOUTH-SUDAN": "Targets persons responsible for actions threatening the peace, security, and stability of South Sudan.",
    "SOUTH SUDAN": "Targets actors fueling the civil conflict and humanitarian crisis in South Sudan.",
    "SUDAN-EO14098": "Targets actors threatening the peace, stability, and democratic transition in Sudan.",
    "YEMEN": "Targets persons threatening the peace, security, and stability of Yemen including Houthi militants.",
    "ZIMBABWE": "Targets persons undermining democratic processes and institutions in Zimbabwe.",
    "BELARUS": "Targets the Lukashenko regime for undermining democracy and human rights in Belarus.",
    "BELARUS-EO14038": "Targets the Lukashenko regime's crackdown on democratic opposition and civil society.",
    "561LIST": "Lists foreign financial institutions subject to restrictions for facilitating Iranian transactions.",
    "561-Related": "Sanctions under Section 561 of the Iran Threat Reduction Act targeting financial facilitators.",
    "SSI-EO13662": "Identifies persons operating in key sectors of the Russian economy subject to sectoral restrictions.",
    "MBS": "Targets maritime sanctions evasion including deceptive shipping practices and flag-hopping.",
    "NS-PLC": "Lists members of the Palestinian Legislative Council affiliated with Hamas subject to restrictions.",
    "HK-EO13936": "Targets officials undermining Hong Kong's autonomy and restricting freedoms guaranteed under the Basic Law.",
    "ELECTION-EO13848": "Targets foreign persons interfering in U.S. elections through cyber, propaganda, or financial means.",
    "PEESA-EO14039": "Protects against foreign efforts to influence or undermine U.S. elections and democratic processes.",
    "ILLICIT-DRUGS-EO14059": "Targets international traffickers of illicit drugs including fentanyl and synthetic opioids.",
    "REPO-EO14068": "Authorizes blocking of Russian government assets in response to the invasion of Ukraine.",
    "PAARSSR-EO13894": "Protects American access to strategically significant resources and activities in outer space.",
    "HOSTAGES-EO14078": "Targets persons involved in hostage-taking and the wrongful detention of U.S. nationals abroad.",
    "ICC-EO14203": "Targets International Criminal Court officials involved in investigations against U.S. personnel and allies.",
    "PAIPA": "Sanctions provisions protecting against international pariah and aggressor states.",
    "SSIDES": "Targets Syria's illicit drug trade networks including Captagon production and trafficking.",
    "UHRPA": "Targets persons responsible for human rights abuses against Uyghurs and other minorities in Xinjiang.",
}


def _load_json(path: pathlib.Path) -> list[dict]:
    if path.exists():
        with open(path) as f:
            return json.load(f)
    return []


def extract(
    sdn_entries: list[dict] | None = None,
    cons_entries: list[dict] | None = None,
    diff: dict | None = None,
) -> list[dict]:
    """Count entries per sanctions program across SDN and Consolidated lists.

    Returns:
        Sorted list of dicts matching the SanctionsProgram frontend interface.
    """
    if sdn_entries is None:
        sdn_entries = _load_json(SNAPSHOT_DIR / "sdn_latest.json")
    if cons_entries is None:
        cons_entries = _load_json(SNAPSHOT_DIR / "consolidated_latest.json")

    today = date.today().isoformat()
    program_counts: dict[str, dict] = {}

    def _ensure(prog: str) -> dict:
        if prog not in program_counts:
            program_counts[prog] = {
                "code": prog,
                "name": PROGRAM_NAMES.get(prog, prog),
                "entry_count_sdn": 0,
                "entry_count_consolidated": 0,
                "last_updated": today,
                "daily_added": 0,
                "daily_removed": 0,
                "description": PROGRAM_DESCRIPTIONS.get(prog, f"{prog} sanctions program"),
            }
        return program_counts[prog]

    for entry in sdn_entries:
        for prog in entry.get("programs", []):
            _ensure(prog)["entry_count_sdn"] += 1

    for entry in cons_entries:
        for prog in entry.get("programs", []):
            _ensure(prog)["entry_count_consolidated"] += 1

    # Overlay daily diff counts if available
    if diff is None:
        diff_path = DIFF_DIR / f"daily_{today}.json"
        if diff_path.exists():
            with open(diff_path) as f:
                diff = json.load(f)

    if diff:
        for addition in diff.get("additions", []):
            for prog in addition.get("programs", []):
                _ensure(prog)["daily_added"] += 1
        for removal in diff.get("removals", []):
            for prog in removal.get("programs", []):
                _ensure(prog)["daily_removed"] += 1

    # Sort descending by total count
    result = sorted(
        program_counts.values(),
        key=lambda x: x["entry_count_sdn"] + x["entry_count_consolidated"],
        reverse=True,
    )
    return result


def extract_and_save(**kwargs) -> list[dict]:
    """Extract program data and persist to disk."""
    PROGRAM_DIR.mkdir(parents=True, exist_ok=True)
    data = extract(**kwargs)
    out_path = PROGRAM_DIR / "active_programs.json"
    with open(out_path, "w") as f:
        json.dump({"programs": data}, f, indent=2)
    print(f"Program data saved to {out_path} ({len(data)} programs)")
    return data


if __name__ == "__main__":
    extract_and_save()
