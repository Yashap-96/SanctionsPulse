import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 px-4 sm:px-6 py-4 text-xs text-white/30">
      <div className="flex flex-col md:flex-row items-center justify-between gap-2">
        <p className="text-center md:text-left">
          <strong className="text-white/40">Disclaimer:</strong> This tool is
          for educational and research purposes only. It is not affiliated with
          or endorsed by the U.S. Department of the Treasury or OFAC. Always
          consult official OFAC sources for compliance decisions.
        </p>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/Yashap-96/SanctionsPulse"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors"
          >
            <Github className="h-4 w-4" />
            <span>GitHub</span>
          </a>
          <span className="text-white/20">|</span>
          <span>SanctionsPulse</span>
        </div>
      </div>
    </footer>
  );
}
