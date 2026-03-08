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

export interface SanctionEntry {
  uid: string;
  name: string;
  entry_type: "Entity" | "Individual" | "Vessel" | "Aircraft";
  programs: string[];
  countries: string[];
  list_type: "SDN" | "CONSOLIDATED";
  addresses: Address[];
  ids: IdentificationDoc[];
  dob: string | null;
  nationalities: string[];
}

export interface WeeklyDiffSummary {
  added: number;
  removed: number;
  updated: number;
}

export interface DiffEntry {
  uid: string;
  name: string;
  entry_type: "Entity" | "Individual" | "Vessel" | "Aircraft";
  programs: string[];
  countries: string[];
  list_type: "SDN" | "CONSOLIDATED";
  changes?: Record<string, { old: string; new: string }>;
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

export interface AISummary {
  date: string;
  executive_summary: string;
  notable_entities: string[];
  risk_implications: string[];
  program_highlights: string[];
  geographic_hotspots: string[];
  compliance_recommendations: string[];
}

export interface MetaData {
  sdn_total: number;
  consolidated_total: number;
  last_updated: string;
  last_diff_date: string;
  last_diff_summary: WeeklyDiffSummary;
}
