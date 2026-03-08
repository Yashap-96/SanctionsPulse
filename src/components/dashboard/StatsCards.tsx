import { Database, Layers, ArrowUpRight, ArrowDownRight } from "lucide-react";
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
}

function StatCard({ label, value, icon, accentColor }: StatCardProps) {
  return (
    <div className="glass-card glass-card-hover p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-white/50">{label}</span>
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          {icon}
        </div>
      </div>
      <p
        className="text-3xl font-bold font-[family-name:var(--font-mono)] tracking-tight"
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
    },
    {
      label: "Total Consolidated",
      value: meta.consolidated_total,
      icon: <Layers className="h-5 w-5 text-[#a855f7]" />,
      accentColor: "#a855f7",
    },
    {
      label: "Weekly Additions",
      value: meta.last_diff_summary.added,
      icon: <ArrowUpRight className="h-5 w-5 text-[#22c55e]" />,
      accentColor: "#22c55e",
    },
    {
      label: "Weekly Removals",
      value: meta.last_diff_summary.removed,
      icon: <ArrowDownRight className="h-5 w-5 text-[#ef4444]" />,
      accentColor: "#ef4444",
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
