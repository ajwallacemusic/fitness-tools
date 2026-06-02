import { z } from "zod";

export const Sex = z.enum(["male", "female"]);
export type Sex = z.infer<typeof Sex>;

export const Goal = z.enum(["cut", "maintain", "bulk"]);
export type Goal = z.infer<typeof Goal>;

export const ActivityLevel = z.enum([
  "sedentary", "light", "moderate", "active", "very_active",
]);
export type ActivityLevel = z.infer<typeof ActivityLevel>;

export const Intensity = z.enum(["light", "moderate", "vigorous"]);
export type Intensity = z.infer<typeof Intensity>;

export const Occupation = z.enum(["desk", "standing", "manual", "heavy"]);
export type Occupation = z.infer<typeof Occupation>;

export const Aggressiveness = z.enum(["conservative", "standard", "aggressive"]);
export type Aggressiveness = z.infer<typeof Aggressiveness>;

const MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function activityMultiplier(activity: ActivityLevel | number): number {
  return typeof activity === "number" ? activity : MULTIPLIERS[activity];
}
