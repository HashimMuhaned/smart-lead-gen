import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const statusStyles: Record<string, string> = {
  "Hot Lead": "bg-coral-100 text-coral-500",
  "Warm Lead": "bg-amber-100 text-amber-500",
  "Cold Lead": "bg-paper-200 text-ink-500",
  Contacted: "bg-signal-100 text-signal-600",
  Replied: "bg-mint-100 text-mint-500",
  Booked: "bg-ink-900-solid text-white",
  Running: "bg-mint-100 text-mint-500",
  Paused: "bg-amber-100 text-amber-500",
  Completed: "bg-signal-100 text-signal-600",
  Draft: "bg-paper-200 text-ink-500",
  Processing: "bg-amber-100 text-amber-500",
  Failed: "bg-coral-100 text-coral-500",
};

export const logoColorStyles: Record<string, string> = {
  signal: "bg-signal-100 text-signal-600",
  coral: "bg-coral-100 text-coral-500",
  amber: "bg-amber-100 text-amber-500",
  mint: "bg-mint-100 text-mint-500",
};

export function scoreColor(score: number) {
  if (score >= 85) return "text-mint-500";
  if (score >= 65) return "text-signal-600";
  if (score >= 45) return "text-amber-500";
  return "text-coral-500";
}

export function scoreRing(score: number) {
  if (score >= 85) return "#17B897";
  if (score >= 65) return "#4F5BFF";
  if (score >= 45) return "#F2A93B";
  return "#F2596B";
}
