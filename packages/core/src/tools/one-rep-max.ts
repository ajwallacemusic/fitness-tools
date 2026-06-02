import { z } from "zod";
import { MassSchema } from "../math/units.js";
import { oneRepMax, percentTable, ORM_METHODS, type PercentRow } from "../math/strength.js";
import { computeConsensus } from "../math/stats.js";
import { DomainError } from "../errors.js";
import { MethodResultSchema, ConsensusSchema } from "../models.js";
import { runMethods, type MethodOutput } from "../dispatch.js";
import type { Tool } from "../registry.js";

const METHODS = [...ORM_METHODS];

export const OneRepMaxInput = z.object({
  weight: MassSchema,
  reps: z.number().int().gt(0).lte(20),
  methods: z.union([z.array(z.string()), z.literal("all")]).default("all"),
});
export type OneRepMaxInputT = z.output<typeof OneRepMaxInput>;

export const OneRepMaxOutput = z.object({
  results: z.array(MethodResultSchema),
  consensus: ConsensusSchema.nullable(),
  percent_table: z.array(z.object({ percent: z.number(), load: z.number() })),
});
export type OneRepMaxOutputT = z.output<typeof OneRepMaxOutput>;

export function compute(inp: OneRepMaxInputT): OneRepMaxOutputT {
  const w = inp.weight.value; // report in the unit the user supplied
  const unit = inp.weight.unit;

  const run = (method: string): MethodOutput => {
    if (!(METHODS as string[]).includes(method))
      throw new DomainError(`unknown method: ${method}`);
    return [oneRepMax(method, w, inp.reps), null];
  };

  const requested = inp.methods === "all" ? METHODS : inp.methods;
  const explicit = inp.methods !== "all";
  const { results } = runMethods(requested, explicit, run, unit, { ndigits: 1 });
  const consensus = computeConsensus(results.map((r) => r.value));
  const percent_table: PercentRow[] = consensus ? percentTable(consensus.mean) : [];
  return { results, consensus, percent_table };
}

export const tool: Tool<OneRepMaxInputT, OneRepMaxOutputT> = {
  id: "one-rep-max",
  name: "One-Rep Max",
  description:
    "Estimate 1RM from a submaximal set via Epley, Brzycki, Lombardi, Wathan, " +
    "O'Conner, and Mayhew; returns a %1RM load chart.",
  category: "strength",
  tags: ["1rm", "strength", "powerlifting"],
  methods: METHODS,
  input: OneRepMaxInput,
  output: OneRepMaxOutput,
  compute,
  examples: [
    {
      input: { weight: { value: 100, unit: "kg" }, reps: 5 },
      output: { results: [{ method: "epley", unit: "kg" }] },
    },
  ],
};
