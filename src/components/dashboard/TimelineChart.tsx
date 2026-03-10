import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TimelineDataPoint {
  date: string;
  additions: number;
  removals: number;
}

interface TimelineChartProps {
  data?: TimelineDataPoint[];
}

export function TimelineChart({ data }: TimelineChartProps) {
  if (!data || data.length === 0) {
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

  return (
    <div className="glass-card p-5 animate-fade-in">
      <h2 className="text-lg font-semibold font-[family-name:var(--font-mono)] mb-4">
        Activity Timeline
      </h2>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="gradientGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradientRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a1a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "rgba(255,255,255,0.8)",
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
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
