import { roundTo } from "./stats.js";

export const ORM_METHODS = [
  "epley", "brzycki", "lombardi", "wathan", "oconner", "mayhew",
] as const;
export type OrmMethod = (typeof ORM_METHODS)[number];

export function oneRepMax(method: string, weight: number, reps: number): number {
  switch (method) {
    case "epley":
      return weight * (1 + reps / 30);
    case "brzycki":
      if (reps >= 37) throw new Error("Brzycki formula is undefined for reps >= 37");
      return (weight * 36) / (37 - reps);
    case "lombardi":
      return weight * reps ** 0.1;
    case "wathan":
      return (100 * weight) / (48.8 + 53.8 * Math.exp(-0.075 * reps));
    case "oconner":
      return weight * (1 + 0.025 * reps);
    case "mayhew":
      return (100 * weight) / (52.2 + 41.9 * Math.exp(-0.055 * reps));
    default:
      throw new Error(`unknown 1RM method: ${method}; valid: ${ORM_METHODS.join(", ")}`);
  }
}

export interface PercentRow {
  percent: number;
  load: number;
}

export function percentTable(oneRm: number): PercentRow[] {
  const rows: PercentRow[] = [];
  for (let p = 50; p < 105; p += 5) {
    rows.push({ percent: p, load: roundTo((oneRm * p) / 100, 1) });
  }
  return rows;
}
