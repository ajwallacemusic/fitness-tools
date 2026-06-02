import { z } from "zod";

export const MethodResultSchema = z.object({
  method: z.string(),
  value: z.number(),
  unit: z.string(),
  detail: z.record(z.unknown()).nullable().default(null),
});
export type MethodResult = z.output<typeof MethodResultSchema>;

export const SkippedMethodSchema = z.object({
  method: z.string(),
  reason: z.string(),
});
export type SkippedMethod = z.output<typeof SkippedMethodSchema>;

export const ConsensusSchema = z.object({
  mean: z.number(),
  median: z.number(),
  min: z.number(),
  max: z.number(),
  n: z.number().int(),
});
export type Consensus = z.output<typeof ConsensusSchema>;
