import type { BadgeTone } from "@/lib/format";

export function difficultyTone(diff?: string): BadgeTone {
  const d = (diff || "").toLowerCase();

  if (d.includes("easy")) return "success";
  if (d.includes("moderate")) return "warning";
  if (d.includes("difficult")) return "danger";

  return "neutral";
}

export function formatGuideTime(seconds: number): string {
  if (!seconds || seconds <= 0) return "";

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}
