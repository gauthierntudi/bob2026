export const PUBLIC_WEIGHT = 0.4;
export const JURY_WEIGHT = 0.6;

export const CRITERIA = [
  {
    key: "technique",
    label: "Technique et maîtrise vocale",
    weight: 20,
  },
  {
    key: "interpretation",
    label: "Interprétation et émotion",
    weight: 20,
  },
  {
    key: "presence",
    label: "Présence scénique et charisme",
    weight: 20,
  },
  {
    key: "originality",
    label: "Choix de la chanson et originalité",
    weight: 20,
  },
] as const;

export type CriterionKey = (typeof CRITERIA)[number]["key"];
export type JurySheet = Record<CriterionKey, number>;

/** Each criterion is marked out of 20. The four marks still make up the jury score. */
export const CRITERION_MAX = 20;

const WEIGHT_SUM = CRITERIA.reduce((sum, criterion) => sum + criterion.weight, 0);

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(CRITERION_MAX, Math.max(0, Math.round(value)));
}

/** Older sheets were stored out of 100. A mark above 20 is brought back to /20. */
export function asCriterionMark(value: number): number {
  if (value > CRITERION_MAX) return clampScore(Math.round(value / (100 / CRITERION_MAX)));
  return clampScore(value);
}

/** A full 20/20 on every criterion is 100% of the jury score. */
export function jurySheetScore(sheet: JurySheet): number {
  return CRITERIA.reduce((sum, criterion) => {
    const percent = (sheet[criterion.key] / CRITERION_MAX) * 100;
    return sum + percent * (criterion.weight / WEIGHT_SUM);
  }, 0);
}

export function averageJuryScore(sheets: JurySheet[]): number | null {
  if (sheets.length === 0) return null;
  const total = sheets.reduce((sum, sheet) => sum + jurySheetScore(sheet), 0);
  return total / sheets.length;
}

export function publicShare(votes: number, totalVotes: number): number | null {
  if (totalVotes <= 0) return null;
  return (votes / totalVotes) * 100;
}

export function finalScore(publicScore: number | null, juryScore: number | null): number | null {
  if (publicScore == null && juryScore == null) return null;
  return (publicScore ?? 0) * PUBLIC_WEIGHT + (juryScore ?? 0) * JURY_WEIGHT;
}

export function formatScore(value: number | null): string {
  if (value == null) return "—";
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
