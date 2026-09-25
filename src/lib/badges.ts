import type { CSSProperties } from "react";

export const BADGE_COLORS = [
  "#f30808",
  "#c6db4e",
  "#fdde4f",
  "#e36414",
  "#2a9d8f",
  "#1d4ed8",
  "#7c3aed",
  "#c9184a",
  "#0077b6",
  "#bc6c25",
  "#2d6a4f",
  "#5a189a",
  "#0a9396",
];

const BADGE_INK: Record<string, string> = {
  "#c6db4e": "#1d3501",
  "#fdde4f": "#1e3604",
};

export function badgeVars(index: number): CSSProperties {
  const background = BADGE_COLORS[index % BADGE_COLORS.length];
  return {
    "--badge": background,
    "--badge-ink": BADGE_INK[background] ?? "#ffffff",
  } as CSSProperties;
}

export function badgeIndex(numbers: number[], number: number) {
  return [...numbers].sort((a, b) => a - b).indexOf(number);
}
