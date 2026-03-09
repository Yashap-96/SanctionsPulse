import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="flex items-center justify-center py-20 px-4">
      <div className="glass-card p-8 max-w-md w-full text-center space-y-4 animate-fade-in">
        <AlertTriangle className="h-10 w-10 text-[#f59e0b] mx-auto" />
        <h1 className="text-4xl font-bold font-[family-name:var(--font-mono)] text-white/90">
          404
        </h1>
        <p className="text-sm text-white/40">
          Page not found. The page you are looking for does not exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-sm text-white/80 hover:bg-white/15 hover:text-white transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
