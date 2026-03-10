import { Shield } from "lucide-react";

const TERMS = [
  {
    term: "U.S. Sanctions",
    definition:
      "Economic and trade restrictions imposed by the U.S. government to advance foreign policy and national security objectives. They prohibit U.S. persons from engaging in transactions with sanctioned targets and can include asset freezes, trade embargoes, and travel bans.",
  },
  {
    term: "OFAC",
    definition:
      "The Office of Foreign Assets Control is a division of the U.S. Department of the Treasury that administers and enforces economic and trade sanctions against targeted foreign countries, regimes, terrorists, narcotics traffickers, and others deemed a threat to national security.",
  },
];

export function InfoBanner() {
  return (
    <div className="glass-card animate-fade-in px-5 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TERMS.map(({ term, definition }) => (
          <div key={term} className="flex gap-3">
            <div className="mt-0.5 shrink-0">
              <Shield className="h-4 w-4 text-[#3b82f6]/60" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/90 mb-1">
                {term}
              </h3>
              <p className="text-xs text-white/45 leading-relaxed">
                {definition}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
