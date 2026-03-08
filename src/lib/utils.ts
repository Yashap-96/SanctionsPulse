import { PROGRAM_COLORS } from "./constants";

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getProgramColor(code: string): string {
  const upper = code.toUpperCase();
  for (const [key, color] of Object.entries(PROGRAM_COLORS)) {
    if (key !== "default" && upper.includes(key)) {
      return color;
    }
  }
  return PROGRAM_COLORS.default;
}

export function getEntryTypeIcon(type: string): string {
  switch (type) {
    case "Individual":
      return "User";
    case "Entity":
      return "Building2";
    case "Vessel":
      return "Ship";
    case "Aircraft":
      return "Plane";
    default:
      return "FileText";
  }
}

export function classNames(
  ...args: (string | undefined | null | false)[]
): string {
  return args.filter(Boolean).join(" ");
}
