import type { Sex } from "./common.js";

export function mifflinBmr(sex: Sex, kg: number, cm: number, age: number): number {
  const base = 10 * kg + 6.25 * cm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export function harrisBmr(sex: Sex, kg: number, cm: number, age: number): number {
  return sex === "male"
    ? 88.362 + 13.397 * kg + 4.799 * cm - 5.677 * age
    : 447.593 + 9.247 * kg + 3.098 * cm - 4.33 * age;
}

export function katchBmr(lbmKg: number): number {
  return 370 + 21.6 * lbmKg;
}

export function cunninghamBmr(lbmKg: number): number {
  return 500 + 22 * lbmKg;
}

export function lbmFromBodyfat(kg: number, bodyFatPct: number): number {
  if (kg <= 0) throw new Error("kg must be positive");
  if (bodyFatPct < 0 || bodyFatPct > 100)
    throw new Error("body_fat_pct must be between 0 and 100");
  return kg * (1 - bodyFatPct / 100);
}
