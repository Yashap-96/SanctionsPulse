export interface Address {
  city: string | null;
  state: string | null;
  country: string;
  postal_code: string | null;
}

export interface IdentificationDoc {
  type: string;
  number: string;
  country: string | null;
}

export interface CryptoWallet {
  currency: string;
  address: string;
}

export interface SanctionEntry {
  uid: string;
  name: string;
  entry_type: "Entity" | "Individual" | "Vessel" | "Aircraft" | "Unknown";
  programs: string[];
  countries: string[];
  list_type: "SDN" | "CONSOLIDATED";
  addresses: Address[];
  ids: IdentificationDoc[];
  dob: string | null;
  nationalities: string[];
  aliases: string[];
  crypto_wallets: CryptoWallet[];
}

export interface WeeklyDiffSummary {
  added: number;
  removed: number;
  updated: number;
}

export interface DiffEntry {
  uid: string;
  name: string;
  entry_type?: "Entity" | "Individual" | "Vessel" | "Aircraft" | "Unknown";
  programs?: string[];
  countries?: string[];
  list_type?: "SDN" | "CONSOLIDATED";
  changes?: Record<string, { old: string; new: string }>;
  dob?: string | null;
  nationalities?: string[];
  aliases?: string[];
  ids?: IdentificationDoc[];
  crypto_wallets?: CryptoWallet[];
}

export interface WeeklyDiff {
  date: string;
  period: string;
  summary: WeeklyDiffSummary;
  additions: DiffEntry[];
  removals: DiffEntry[];
  updates: DiffEntry[];
}

export interface SanctionsProgram {
  code: string;
  name: string;
  entry_count_sdn: number;
  entry_count_consolidated: number;
  last_updated: string;
  weekly_added: number;
  weekly_removed: number;
  description: string;
}

export interface CountrySanctionData {
  iso2: string;
  name: string;
  total: number;
  sdn: number;
  consolidated: number;
  programs: string[];
  weekly_added: number;
  weekly_removed: number;
}

export interface NotableEntity {
  uid: string;
  name: string;
  programs: string[];
  significance: string;
}

export interface RiskImplication {
  level: "HIGH" | "MEDIUM" | "LOW";
  area: string;
  description: string;
}

export interface ProgramHighlight {
  program: string;
  weekly_added: number;
  note: string;
}

export interface GeographicHotspot {
  region: string;
  countries: string[];
  activity: string;
  trend: string;
}

export interface AISummary {
  date: string;
  period: string;
  executive_summary: string;
  notable_entities: NotableEntity[];
  risk_implications: RiskImplication[];
  program_highlights: ProgramHighlight[];
  geographic_hotspots: GeographicHotspot[];
  compliance_recommendations: string[];
}

export interface MetaData {
  sdn_total: number;
  consolidated_total: number;
  last_updated: string;
  last_diff_date: string;
  last_diff_summary: WeeklyDiffSummary;
}
