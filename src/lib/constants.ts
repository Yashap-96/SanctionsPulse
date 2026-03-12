export const PROGRAM_COLORS: Record<string, string> = {
  IRAN: "#ef4444",
  RUSSIA: "#f59e0b",
  CUBA: "#3b82f6",
  DPRK: "#a855f7",
  SDGT: "#ec4899",
  VENEZUELA: "#14b8a6",
  SYRIA: "#f97316",
  CYBER2: "#06b6d4",
  GLOMAG: "#84cc16",
  default: "#6b7280",
};

export const MAP_CONFIG = {
  basemapUrl:
    "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  initialCenter: [0, 20] as [number, number],
  initialZoom: 1.8,
};

export const ISO2_TO_COUNTRY: Record<string, string> = {
  AE: "United Arab Emirates", AF: "Afghanistan", AG: "Antigua & Barbuda", AL: "Albania",
  AM: "Armenia", AN: "Netherlands Antilles", AO: "Angola", AR: "Argentina", AT: "Austria",
  AU: "Australia", AW: "Aruba", AZ: "Azerbaijan", BA: "Bosnia & Herzegovina", BB: "Barbados",
  BD: "Bangladesh", BE: "Belgium", BF: "Burkina Faso", BG: "Bulgaria", BH: "Bahrain",
  BJ: "Benin", BM: "Bermuda", BO: "Bolivia", BR: "Brazil", BS: "Bahamas", BY: "Belarus",
  BZ: "Belize", CA: "Canada", CD: "Congo (DRC)", CF: "Central African Republic",
  CG: "Congo (Republic)", CH: "Switzerland", CI: "Cote d'Ivoire", CL: "Chile", CN: "China",
  CO: "Colombia", CR: "Costa Rica", CU: "Cuba", CY: "Cyprus", CZ: "Czech Republic",
  DE: "Germany", DJ: "Djibouti", DK: "Denmark", DM: "Dominica", DO: "Dominican Republic",
  DZ: "Algeria", EC: "Ecuador", EE: "Estonia", EG: "Egypt", ER: "Eritrea", ES: "Spain",
  ET: "Ethiopia", FI: "Finland", FR: "France", GB: "United Kingdom", GE: "Georgia",
  GH: "Ghana", GI: "Gibraltar", GM: "Gambia", GN: "Guinea", GQ: "Equatorial Guinea",
  GR: "Greece", GT: "Guatemala", GY: "Guyana", HK: "Hong Kong", HN: "Honduras",
  HR: "Croatia", HT: "Haiti", HU: "Hungary", ID: "Indonesia", IE: "Ireland", IL: "Israel",
  IM: "Isle of Man", IN: "India", IQ: "Iraq", IR: "Iran", IS: "Iceland", IT: "Italy",
  JE: "Jersey", JM: "Jamaica", JO: "Jordan", JP: "Japan", KE: "Kenya", KG: "Kyrgyzstan",
  KH: "Cambodia", KM: "Comoros", KN: "St. Kitts & Nevis", KP: "North Korea", KR: "South Korea",
  KW: "Kuwait", KY: "Cayman Islands", KZ: "Kazakhstan", LA: "Laos", LB: "Lebanon",
  LI: "Liechtenstein", LK: "Sri Lanka", LR: "Liberia", LT: "Lithuania", LU: "Luxembourg",
  LV: "Latvia", LY: "Libya", MA: "Morocco", MC: "Monaco", MD: "Moldova", ME: "Montenegro",
  MH: "Marshall Islands", MK: "North Macedonia", ML: "Mali", MM: "Myanmar", MN: "Mongolia",
  MO: "Macau", MR: "Mauritania", MT: "Malta", MU: "Mauritius", MV: "Maldives", MX: "Mexico",
  MY: "Malaysia", MZ: "Mozambique", NA: "Namibia", NE: "Niger", NG: "Nigeria", NI: "Nicaragua",
  NL: "Netherlands", NO: "Norway", NZ: "New Zealand", OM: "Oman", PA: "Panama", PE: "Peru",
  PH: "Philippines", PK: "Pakistan", PL: "Poland", PS: "Palestine", PT: "Portugal",
  PW: "Palau", PY: "Paraguay", QA: "Qatar", RO: "Romania", RS: "Serbia", RU: "Russia",
  RW: "Rwanda", SA: "Saudi Arabia", SC: "Seychelles", SD: "Sudan", SE: "Sweden",
  SG: "Singapore", SI: "Slovenia", SK: "Slovakia", SL: "Sierra Leone", SM: "San Marino",
  SN: "Senegal", SO: "Somalia", SR: "Suriname", SS: "South Sudan", SV: "El Salvador",
  SY: "Syria", TH: "Thailand", TJ: "Tajikistan", TM: "Turkmenistan", TN: "Tunisia",
  TR: "Turkey", TT: "Trinidad & Tobago", TW: "Taiwan", TZ: "Tanzania", UA: "Ukraine",
  UG: "Uganda", US: "United States", UY: "Uruguay", UZ: "Uzbekistan",
  VC: "St. Vincent & Grenadines", VE: "Venezuela", VG: "British Virgin Islands",
  VN: "Vietnam", VU: "Vanuatu", WS: "Samoa", XK: "Kosovo", YE: "Yemen",
  ZA: "South Africa", ZM: "Zambia", ZW: "Zimbabwe",
};

export function countryName(iso2: string): string {
  return ISO2_TO_COUNTRY[iso2] ?? iso2;
}

export const API_URLS = {
  data: "/data/",
  meta: "/data/meta.json",
  diffs: "/data/diffs/",
  programs: "/data/programs/active_programs.json",
  countrySanctions: "/data/map/country_sanctions.json",
  summaries: "/data/summaries/",
};
