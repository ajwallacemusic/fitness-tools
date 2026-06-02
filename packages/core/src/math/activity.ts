import type { Intensity, Occupation } from "./common.js";

const MET: Record<Intensity, number> = { light: 4.0, moderate: 6.0, vigorous: 8.0 };
const OCCUPATION_NEAT_FRACTION: Record<Occupation, number> = {
  desk: 0.15,
  standing: 0.3,
  manual: 0.5,
  heavy: 0.7,
};

/** Exercise activity thermogenesis (EAT), kcal/day, averaged across the week from MET intensity. */
export function eatKcalPerDay(
  sessionsPerWeek: number,
  sessionMinutes: number,
  intensity: Intensity,
  weightKg: number,
): number {
  const kcalPerMin = (MET[intensity] * 3.5 * weightKg) / 200;
  return (sessionsPerWeek * sessionMinutes * kcalPerMin) / 7;
}

/** Non-exercise activity thermogenesis (NEAT), kcal/day, estimated from daily step count. */
export function neatFromSteps(stepsPerDay: number, weightKg: number): number {
  return (stepsPerDay * 0.04 * weightKg) / 70;
}

/** NEAT, kcal/day, as an occupation-based fraction of BMR. */
export function neatFromOccupation(occupation: Occupation, bmr: number): number {
  return OCCUPATION_NEAT_FRACTION[occupation] * bmr;
}
