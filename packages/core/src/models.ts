import { z } from "zod";

/** One formula's result: method name, numeric value, unit, and optional detail. */
export const MethodResultSchema = z.object({
  method: z.string(),
  value: z.number(),
  unit: z.string(),
  detail: z.record(z.unknown()).nullable().default(null),
});
export type MethodResult = z.output<typeof MethodResultSchema>;

/** A method that was not run, with the reason (e.g. missing inputs). */
export const SkippedMethodSchema = z.object({
  method: z.string(),
  reason: z.string(),
});
export type SkippedMethod = z.output<typeof SkippedMethodSchema>;

/** Consensus across method values: mean, median, min, max, and count n. */
export const ConsensusSchema = z.object({
  mean: z.number(),
  median: z.number(),
  min: z.number(),
  max: z.number(),
  n: z.number().int(),
});
// Single source of truth for the Consensus shape lives in math/stats.ts
// (computeConsensus returns it). Re-export here so the public barrel exposes
// one `Consensus` symbol and ConsensusSchema.parse() output stays compatible.
export type { Consensus } from "./math/stats.js";
