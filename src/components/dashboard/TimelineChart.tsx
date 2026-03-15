import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity } from "lucide-react";
import type { TimelineData } from "../../hooks/useTimelineData";
import { formatNumber } from "../../lib/utils";

interface TimelineChartProps {
  timeline: TimelineData | null;
  loading?: boolean;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TimelineChart({ timeline, loading }: TimelineChartProps) {
  if (loading) {
    return (
      <div className="glass-card p-5 animate-fade-in">
        <h2 className="text-lg font-semibold font-[family-name:var(--font-mono)] mb-4">
          Activity Timeline
        </h2>
        <div className="flex items-center justify-center h-48 text-white/30 text-sm">
          Loading timeline...
        </div>
      </div>
    );
  }

  if (!timeline || timeline.days.length === 0) {
    return (
      <div className="glass-card p-5 animate-fade-in">
        <h2 className="text-lg font-semibold font-[family-name:var(--font-mono)] mb-4">
          Activity Timeline
        </h2>
        <div className="flex items-center justify-center h-48 text-white/30 text-sm">
          Timeline data will appear as daily diffs accumulate
        </div>
      </div>
    );
  }

  const chartData = timeline.days.map((d) => ({
    ...d,
    label: formatShortDate(d.date),
  }));

  const hasActivity =
    timeline.total_additions > 0 ||
    timeline.total_removals > 0 ||
    timeline.total_updates > 0;

  return (
    <div className="glass-card p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#06b6d4]" />
          <h2 className="text-lg font-semibold font-[family-name:var(--font-mono)]">
            Activity Timeline
          </h2>
        </div>
      </div>

      {/* Period label */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-white/40 font-[family-name:var(--font-mono)]">
          {formatShortDate(timeline.period_start)} —{" "}
          {formatShortDate(timeline.period_end)} ({timeline.window_days} days)
        </span>
      </div>

      {/* Summary stats */}
      {hasActivity && (
        <div className="flex gap-4 mb-4 text-xs font-[family-name:var(--font-mono)]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
            <span className="text-white/40">Added</span>
            <span className="text-[#22c55e] font-semibold">
              +{formatNumber(timeline.total_additions)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
            <span className="text-white/40">Removed</span>
            <span className="text-[#ef4444] font-semibold">
              -{formatNumber(timeline.total_removals)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
            <span className="text-white/40">Updated</span>
            <span className="text-[#f59e0b] font-semibold">
              ~{formatNumber(timeline.total_updates)}
            </span>
          </div>
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          data={chartData}
          margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="gradientGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradientRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradientAmber" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
          />
          <XAxis
            dataKey="label"
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a1a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "rgba(255,255,255,0.8)",
              fontSize: "12px",
            }}
            labelFormatter={(label) => label}
            formatter={(value, name) => {
              const n = String(name);
              const color =
                n === "additions"
                  ? "#22c55e"
                  : n === "removals"
                    ? "#ef4444"
                    : "#f59e0b";
              return [
                <span key={n} style={{ color }}>
                  {String(value)}
                </span>,
                n.charAt(0).toUpperCase() + n.slice(1),
              ];
            }}
          />
          <Area
            type="monotone"
            dataKey="additions"
            stroke="#22c55e"
            fill="url(#gradientGreen)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="removals"
            stroke="#ef4444"
            fill="url(#gradientRed)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="updates"
            stroke="#f59e0b"
            fill="url(#gradientAmber)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
