import { FFMI_NATURAL_CAP } from "./indices.js";
import { LB_TO_KG } from "./units.js";

const CM_TO_IN = 1 / 2.54;

/** Total weight (kg) at a target body-fat % given fat-free mass (kg). */
export function weightAtBf(ffmKg: number, targetBfPct: number): number {
  return ffmKg / (1 - targetBfPct / 100);
}

/** Casey Butt's maximum drug-free fat-free mass (kg) from height/wrist/ankle (cm) and target body-fat %. */
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

/** Natural fat-free mass (kg) ceiling implied by an FFMI of 25, from height (cm). */
export function ffmiCapFfmKg(heightCm: number): number {
  return FFMI_NATURAL_CAP * (heightCm / 100) ** 2;
}

/** Martin Berkhan's "contest-shape" fat-free mass (kg) heuristic from height (cm). */
export function berkhanFfmKg(heightCm: number): number {
  return (heightCm - 100) * (1 - 0.055);
}
