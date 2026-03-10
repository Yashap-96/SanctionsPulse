import { useState, useEffect } from "react";
import {
  Building2,
  User,
  Ship,
  Plane,
  Fingerprint,
  Bitcoin,
  Users,
} from "lucide-react";
import { formatNumber } from "../../lib/utils";
import { API_URLS } from "../../lib/constants";

interface OverviewStats {
  entry_types: Record<string, number>;
  id_documents: { entries: number; total: number };
  crypto_wallets: { entries: number; total: number };
  aliases: { entries: number; total: number };
}

const TYPE_CONFIG = [
  { key: "Entity", label: "Entities", icon: Building2, color: "#3b82f6" },
  { key: "Individual", label: "Individuals", icon: User, color: "#a855f7" },
  { key: "Vessel", label: "Vessels", icon: Ship, color: "#06b6d4" },
  { key: "Aircraft", label: "Aircraft", icon: Plane, color: "#f59e0b" },
];

const DATA_CONFIG = [
  {
    key: "id_documents" as const,
    label: "ID Documents",
    sublabel: "Passports, cedulas, registrations",
    icon: Fingerprint,
    color: "#22c55e",
  },
  {
    key: "crypto_wallets" as const,
    label: "Crypto Wallets",
    sublabel: "XBT, ETH, USDT, SOL & more",
    icon: Bitcoin,
    color: "#f97316",
  },
  {
    key: "aliases" as const,
    label: "Known Aliases",
    sublabel: "Alternative names & transliterations",
    icon: Users,
    color: "#ec4899",
  },
];

export function DataOverview() {
  const [stats, setStats] = useState<OverviewStats | null>(null);

  useEffect(() => {
    fetch(`${API_URLS.data}overview_stats.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats) return null;

  return (
    <div className="glass-card p-5 animate-fade-in">
      <h2 className="text-lg font-semibold font-[family-name:var(--font-mono)] mb-4">
        Data Coverage
      </h2>

      {/* Entry type breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {TYPE_CONFIG.map(({ key, label, icon: Icon, color }) => (
          <div
            key={key}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5"
          >
            <Icon className="h-4 w-4 shrink-0" style={{ color }} />
            <div className="min-w-0">
              <div
                className="text-sm font-bold font-[family-name:var(--font-mono)]"
                style={{ color }}
              >
                {formatNumber(stats.entry_types[key] ?? 0)}
              </div>
              <div className="text-[10px] text-white/40 truncate">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Data categories */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {DATA_CONFIG.map(({ key, label, sublabel, icon: Icon, color }) => {
          const data = stats[key];
          return (
            <div
              key={key}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5"
            >
              <div
                className="p-2 rounded-lg shrink-0"
                style={{ backgroundColor: `${color}15` }}
              >
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="text-sm font-bold font-[family-name:var(--font-mono)]"
                    style={{ color }}
                  >
                    {formatNumber(data.total)}
                  </span>
                  <span className="text-[10px] text-white/30">
                    across {formatNumber(data.entries)} entries
                  </span>
                </div>
                <div className="text-xs text-white/50">{label}</div>
                <div className="text-[10px] text-white/25 truncate">
                  {sublabel}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
