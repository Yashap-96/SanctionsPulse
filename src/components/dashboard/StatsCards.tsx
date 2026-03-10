import { Info, Database, Layers, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { MetaData } from "../../lib/types";
import { formatNumber } from "../../lib/utils";

interface StatsCardsProps {
  meta: MetaData | null;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accentColor: string;
  tooltip?: string;
}

function StatCard({ label, value, icon, accentColor, tooltip }: StatCardProps) {
  return (
    <div className="glass-card glass-card-hover p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-white/50">{label}</span>
          {tooltip && (
            <div className="relative group">
              <Info className="h-3.5 w-3.5 text-white/25 cursor-default hover:text-white/50 transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2.5 rounded-lg bg-[#1a1a1a] border border-white/10 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                <p className="text-xs text-white/60 leading-relaxed">{tooltip}</p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[#1a1a1a]" />
              </div>
            </div>
          )}
        </div>
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          {icon}
        </div>
      </div>
      <p
        className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-mono)] tracking-tight"
        style={{ color: accentColor }}
      >
        {formatNumber(value)}
      </p>
    </div>
  );
}

export function StatsCards({ meta }: StatsCardsProps) {
  if (!meta) return null;

  const cards = [
    {
      label: "Total SDN Entries",
      value: meta.sdn_total,
      icon: <Database className="h-5 w-5 text-[#3b82f6]" />,
      accentColor: "#3b82f6",
      tooltip:
        "The Specially Designated Nationals and Blocked Persons (SDN) List. Individuals and entities on this list have their assets blocked and U.S. persons are generally prohibited from dealing with them. It is the primary sanctions list maintained by OFAC.",
    },
    {
      label: "Total Consolidated",
      value: meta.consolidated_total,
      icon: <Layers className="h-5 w-5 text-[#a855f7]" />,
      accentColor: "#a855f7",
      tooltip:
        "A combined list of non-SDN sanctions programs including the Sectoral Sanctions, Foreign Sanctions Evaders, Palestinian Legislative Council, and other specialized lists. Entries carry restrictions that vary by program but are generally less severe than the SDN list.",
    },
    {
      label: "Daily Additions",
      value: meta.last_diff_summary.added,
      icon: <ArrowUpRight className="h-5 w-5 text-[#22c55e]" />,
      accentColor: "#22c55e",
      tooltip:
        "New individuals, entities, vessels, or aircraft added to the OFAC sanctions lists during the most recent daily update. Data is refreshed automatically every day at 9:00 AM ET via the OFAC SLS API.",
    },
    {
      label: "Daily Removals",
      value: meta.last_diff_summary.removed,
      icon: <ArrowDownRight className="h-5 w-5 text-[#ef4444]" />,
      accentColor: "#ef4444",
      tooltip:
        "Individuals, entities, vessels, or aircraft removed from the OFAC sanctions lists during the most recent daily update. Removals may indicate lifted sanctions, delistings, or corrections. Updated every day at 9:00 AM ET.",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}
