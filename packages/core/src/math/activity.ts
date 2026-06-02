import type { Intensity, Occupation } from "./common.js";

const MET: Record<Intensity, number> = { light: 4.0, moderate: 6.0, vigorous: 8.0 };
const OCCUPATION_NEAT_FRACTION: Record<Occupation, number> = {
  desk: 0.15,
  standing: 0.3,
  manual: 0.5,
  heavy: 0.7,
};

export function eatKcalPerDay(
  sessionsPerWeek: number,
  sessionMinutes: number,
  intensity: Intensity,
  weightKg: number,
): number {
  const kcalPerMin = (MET[intensity] * 3.5 * weightKg) / 200;
  return (sessionsPerWeek * sessionMinutes * kcalPerMin) / 7;
}

export function neatFromSteps(stepsPerDay: number, weightKg: number): number {
  return (stepsPerDay * 0.04 * weightKg) / 70;
}

export function neatFromOccupation(occupation: Occupation, bmr: number): number {
  return OCCUPATION_NEAT_FRACTION[occupation] * bmr;
}
