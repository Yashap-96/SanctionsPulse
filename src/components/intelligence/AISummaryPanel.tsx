import {
  Sparkles,
  AlertTriangle,
  Globe,
  CheckSquare,
  TrendingUp,
  User,
  MapPin,
} from "lucide-react";
import { Badge } from "../common/Badge";
import { classNames } from "../../lib/utils";
import type {
  AISummary,
  NotableEntity,
  RiskImplication,
  ProgramHighlight,
  GeographicHotspot,
} from "../../lib/types";

interface AISummaryPanelProps {
  summary: AISummary;
}

export function AISummaryPanel({ summary }: AISummaryPanelProps) {
  // Groq sometimes returns strings instead of arrays — normalize defensively
  const notableEntities = Array.isArray(summary.notable_entities) ? summary.notable_entities : [];
  const riskImplications = Array.isArray(summary.risk_implications) ? summary.risk_implications : [];
  const programHighlights = Array.isArray(summary.program_highlights) ? summary.program_highlights : [];
  const geographicHotspots = Array.isArray(summary.geographic_hotspots) ? summary.geographic_hotspots : [];
  const recommendations = Array.isArray(summary.compliance_recommendations) ? summary.compliance_recommendations : [];

  // If a field was returned as a string, show it as a fallback paragraph
  const riskFallback = typeof summary.risk_implications === "string" ? summary.risk_implications : null;
  const entitiesFallback = typeof summary.notable_entities === "string" ? summary.notable_entities : null;
  const programsFallback = typeof summary.program_highlights === "string" ? summary.program_highlights : null;
  const hotspotsFallback = typeof summary.geographic_hotspots === "string" ? summary.geographic_hotspots : null;

  return (
    <div className="space-y-8">
      {/* Executive Summary */}
      <div className="glass-card p-6 border-l-4 border-l-[#06b6d4]">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-[#06b6d4]" />
          <h2 className="text-lg font-bold font-[family-name:var(--font-mono)] text-white/90">
            Executive Summary
          </h2>
        </div>
        <div className="text-sm text-white/60 leading-relaxed whitespace-pre-line">
          {summary.executive_summary}
        </div>
      </div>

      {/* Notable Entities */}
      {(notableEntities.length > 0 || entitiesFallback) && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-[#f59e0b]" />
            <h2 className="text-lg font-bold font-[family-name:var(--font-mono)] text-white/90">
              Notable Entities
            </h2>
          </div>
          {entitiesFallback ? (
            <div className="glass-card p-5 text-sm text-white/60 leading-relaxed whitespace-pre-line">{entitiesFallback}</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {notableEntities.map((entity, i) => (
                <NotableEntityCard key={entity.uid ?? i} entity={entity} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Risk Implications */}
      {(riskImplications.length > 0 || riskFallback) && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-[#ef4444]" />
            <h2 className="text-lg font-bold font-[family-name:var(--font-mono)] text-white/90">
              Risk Implications
            </h2>
          </div>
          {riskFallback ? (
            <div className="glass-card p-5 text-sm text-white/60 leading-relaxed whitespace-pre-line">{riskFallback}</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {riskImplications.map((risk, i) => (
                <RiskCard key={risk.area ?? i} risk={risk} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Program Highlights */}
      {(programHighlights.length > 0 || programsFallback) && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-[#22c55e]" />
            <h2 className="text-lg font-bold font-[family-name:var(--font-mono)] text-white/90">
              Program Highlights
            </h2>
          </div>
          {programsFallback ? (
            <div className="glass-card p-5 text-sm text-white/60 leading-relaxed whitespace-pre-line">{programsFallback}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {programHighlights.map((highlight, i) => (
                <ProgramHighlightCard
                  key={highlight.program ?? i}
                  highlight={highlight}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Geographic Hotspots */}
      {(geographicHotspots.length > 0 || hotspotsFallback) && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-[#3b82f6]" />
            <h2 className="text-lg font-bold font-[family-name:var(--font-mono)] text-white/90">
              Geographic Hotspots
            </h2>
          </div>
          {hotspotsFallback ? (
            <div className="glass-card p-5 text-sm text-white/60 leading-relaxed whitespace-pre-line">{hotspotsFallback}</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {geographicHotspots.map((hotspot, i) => (
                <HotspotCard key={hotspot.region ?? i} hotspot={hotspot} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Compliance Recommendations */}
      {recommendations.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CheckSquare className="h-5 w-5 text-[#a855f7]" />
            <h2 className="text-lg font-bold font-[family-name:var(--font-mono)] text-white/90">
              Compliance Recommendations
            </h2>
          </div>
          <div className="glass-card p-5 space-y-4">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded bg-[#a855f7]/10 text-[#a855f7] flex items-center justify-center text-xs font-bold font-[family-name:var(--font-mono)]">
                  {i + 1}
                </div>
                <p className="text-sm text-white/60 leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function NotableEntityCard({ entity }: { entity: NotableEntity }) {
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold font-[family-name:var(--font-mono)] text-white/90">
          {entity.name}
        </h3>
        <span className="text-[10px] text-white/20 font-[family-name:var(--font-mono)] flex-shrink-0">
          {entity.uid}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {entity.programs.map((prog) => (
          <Badge key={prog} code={prog} />
        ))}
      </div>
      <p className="text-xs text-white/50 leading-relaxed">
        {entity.significance}
      </p>
    </div>
  );
}

function RiskCard({ risk }: { risk: RiskImplication }) {
  const borderColor =
    risk.level === "HIGH"
      ? "border-l-[#ef4444]"
      : risk.level === "MEDIUM"
        ? "border-l-[#f59e0b]"
        : "border-l-[#22c55e]";

  const levelColor =
    risk.level === "HIGH"
      ? "text-[#ef4444] bg-[#ef4444]/10"
      : risk.level === "MEDIUM"
        ? "text-[#f59e0b] bg-[#f59e0b]/10"
        : "text-[#22c55e] bg-[#22c55e]/10";

  return (
    <div className={classNames("glass-card p-5 border-l-4 space-y-3", borderColor)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white/90">{risk.area}</h3>
        <span
          className={classNames(
            "text-[10px] font-bold font-[family-name:var(--font-mono)] px-2 py-0.5 rounded",
            levelColor
          )}
        >
          {risk.level}
        </span>
      </div>
      <p className="text-xs text-white/50 leading-relaxed">
        {risk.description}
      </p>
    </div>
  );
}

function ProgramHighlightCard({ highlight }: { highlight: ProgramHighlight }) {
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Badge code={highlight.program} size="md" />
        <span className="text-sm font-bold font-[family-name:var(--font-mono)] text-[#22c55e]">
          +{highlight.daily_added}
        </span>
      </div>
      <p className="text-xs text-white/50 leading-relaxed">{highlight.note}</p>
    </div>
  );
}

function HotspotCard({ hotspot }: { hotspot: GeographicHotspot }) {
  const trendColor =
    hotspot.trend === "Escalating"
      ? "text-[#ef4444] bg-[#ef4444]/10"
      : hotspot.trend === "Steady"
        ? "text-[#f59e0b] bg-[#f59e0b]/10"
        : "text-[#22c55e] bg-[#22c55e]/10";

  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#3b82f6]" />
          <h3 className="text-sm font-bold text-white/90">{hotspot.region}</h3>
        </div>
        <span
          className={classNames(
            "text-[10px] font-bold font-[family-name:var(--font-mono)] px-2 py-0.5 rounded",
            trendColor
          )}
        >
          {hotspot.trend}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {hotspot.countries.map((country) => (
          <span
            key={country}
            className="text-[10px] font-[family-name:var(--font-mono)] text-white/40 bg-white/5 px-1.5 py-0.5 rounded"
          >
            {country}
          </span>
        ))}
      </div>
      <p className="text-xs text-white/50 leading-relaxed">
        {hotspot.activity}
      </p>
    </div>
  );
}
