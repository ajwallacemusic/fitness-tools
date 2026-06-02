/**
 * @packageDocumentation
 * Validated, self-describing fitness calculators. Import the raw formula
 * functions directly (e.g. {@link mifflinBmr}), or use the {@link REGISTRY} of
 * tools — each registry tool validates input with Zod, runs several published
 * formulas, and reports a consensus across them. Isomorphic: runs in the browser
 * and on the server.
 */
import { register, REGISTRY, type Tool } from "./registry.js";
import { tool as tdee } from "./tools/tdee.js";
import { tool as bodyFat } from "./tools/body-fat.js";
import { tool as oneRepMax } from "./tools/one-rep-max.js";
import { tool as macros } from "./tools/macros.js";
import { tool as activityMultiplier } from "./tools/activity-multiplier.js";
import { tool as powerliftingAttempts } from "./tools/powerlifting-attempts.js";
import { tool as musclePotential } from "./tools/muscle-potential.js";

export const tools: Tool[] = [
  tdee, bodyFat, oneRepMax, macros,
  activityMultiplier, powerliftingAttempts, musclePotential,
];

for (const t of tools) register(t);

export { REGISTRY, register };
export type { Tool } from "./registry.js";
export { DomainError } from "./errors.js";
export * from "./models.js";

// math (for direct browser-native use without the registry)
export * from "./math/units.js";
export * from "./math/common.js";
export * from "./math/stats.js";
export * from "./math/energy.js";
export * from "./math/bodyfat.js";
export * from "./math/macros.js";
export * from "./math/strength.js";
export * from "./math/activity.js";
export * from "./math/potential.js";
export * from "./math/plates.js";
