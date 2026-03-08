import { getProgramColor, classNames } from "../../lib/utils";

interface BadgeProps {
  code: string;
  size?: "sm" | "md";
}

export function Badge({ code, size = "sm" }: BadgeProps) {
  const color = getProgramColor(code);

  return (
    <span
      className={classNames(
        "inline-flex items-center font-semibold font-[family-name:var(--font-mono)] rounded",
        size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1"
      )}
      style={{
        backgroundColor: `${color}20`,
        color: color,
      }}
    >
      {code}
    </span>
  );
}
