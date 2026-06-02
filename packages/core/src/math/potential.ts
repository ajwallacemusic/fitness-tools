import { LB_TO_KG } from "./units.js";

const CM_TO_IN = 1 / 2.54;

export function weightAtBf(ffmKg: number, targetBfPct: number): number {
  return ffmKg / (1 - targetBfPct / 100);
}

export function caseyButtFfmKg(
  heightCm: number,
  wristCm: number,
  ankleCm: number,
  targetBfPct: number,
): number {
  const h = heightCm * CM_TO_IN;
  const w = wristCm * CM_TO_IN;
  const a = ankleCm * CM_TO_IN;
  const lbmLb =
    h ** 1.5 *
    (Math.sqrt(w) / 22.667 + Math.sqrt(a) / 17.0104) *
    (targetBfPct / 224 + 1);
  return lbmLb * LB_TO_KG;
}

export function ffmiCapFfmKg(heightCm: number): number {
  return 25 * (heightCm / 100) ** 2;
}

export function berkhanFfmKg(heightCm: number): number {
  return (heightCm - 100) * (1 - 0.055);
}
