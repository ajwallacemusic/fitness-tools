import type { Sex } from "./common.js";

/** Mifflin-St Jeor (1990) resting BMR, kcal/day. Inputs: kg, cm, years. */
export function mifflinBmr(sex: Sex, kg: number, cm: number, age: number): number {
  const base = 10 * kg + 6.25 * cm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

/** Harris-Benedict BMR (Roza 1984 revision), kcal/day. Inputs: kg, cm, years. */
export function harrisBmr(sex: Sex, kg: number, cm: number, age: number): number {
  return sex === "male"
    ? 88.362 + 13.397 * kg + 4.799 * cm - 5.677 * age
    : 447.593 + 9.247 * kg + 3.098 * cm - 4.33 * age;
}

/** Katch-McArdle BMR, kcal/day, from lean body mass (kg). */
export function katchBmr(lbmKg: number): number {
  return 370 + 21.6 * lbmKg;
}

/** Cunningham (1980) BMR, kcal/day, from lean body mass (kg). */
export function cunninghamBmr(lbmKg: number): number {
  return 500 + 22 * lbmKg;
}

/** Lean body mass (kg) from total weight (kg) and body-fat percentage. */
export function lbmFromBodyfat(kg: number, bodyFatPct: number): number {
  if (kg <= 0) throw new Error("kg must be positive");
  if (bodyFatPct < 0 || bodyFatPct > 100)
    throw new Error("body_fat_pct must be between 0 and 100");
  return kg * (1 - bodyFatPct / 100);
}
