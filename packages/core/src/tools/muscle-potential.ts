import { z } from "zod";
import { Sex } from "../math/common.js";
import { LengthSchema, lengthCm } from "../math/units.js";
import {
  caseyButtFfmKg, ffmiCapFfmKg, berkhanFfmKg, weightAtBf,
} from "../math/potential.js";
import { computeConsensus, roundTo } from "../math/stats.js";
import { DomainError } from "../errors.js";
import {
  MethodResultSchema, SkippedMethodSchema, ConsensusSchema,
} from "../models.js";
import { runMethods, type MethodOutput } from "../dispatch.js";
import type { Tool } from "../registry.js";

const ALL_METHODS = ["casey-butt", "ffmi-cap", "berkhan"];
const REASONS: Record<string, string> = {
  "casey-butt": "casey-butt: requires wrist and ankle",
  "ffmi-cap": "ffmi-cap: requires height",
  berkhan: "berkhan: requires height",
};

export const MusclePotentialInput = z.object({
  sex: Sex,
  height: LengthSchema,
  wrist: LengthSchema.nullable().default(null),
  ankle: LengthSchema.nullable().default(null),
  target_body_fat_pct: z.number().gte(3).lte(40).default(10),
  methods: z.union([z.array(z.string()), z.literal("all")]).default("all"),
});
export type MusclePotentialInputT = z.output<typeof MusclePotentialInput>;

export const MusclePotentialOutput = z.object({
  results: z.array(MethodResultSchema),
  consensus: ConsensusSchema.nullable(),
  skipped: z.array(SkippedMethodSchema),
});
export type MusclePotentialOutputT = z.output<typeof MusclePotentialOutput>;

export function compute(inp: MusclePotentialInputT): MusclePotentialOutputT {
  if (inp.sex !== "male")
    throw new DomainError("muscle-potential formulas are validated for men only in v1");
  const bf = inp.target_body_fat_pct;
  const cm = lengthCm(inp.height);

  const run = (method: string): MethodOutput => {
    let ffm: number;
    if (method === "casey-butt") {
      if (inp.wrist === null || inp.ankle === null) return null;
      ffm = caseyButtFfmKg(cm, lengthCm(inp.wrist), lengthCm(inp.ankle), bf);
    } else if (method === "ffmi-cap") {
      ffm = ffmiCapFfmKg(cm);
    } else if (method === "berkhan") {
      ffm = berkhanFfmKg(cm);
    } else {
      throw new DomainError(`unknown method: ${method}`);
    }
    return [weightAtBf(ffm, bf), { max_ffm_kg: roundTo(ffm, 1), target_bf_pct: bf }];
  };

  const requested = inp.methods === "all" ? ALL_METHODS : inp.methods;
  const explicit = inp.methods !== "all";
  const { results, skipped } = runMethods(requested, explicit, run, "kg", {
    reasonFn: (m) => REASONS[m] ?? `${m}: required inputs missing`,
    ndigits: 1,
  });
  return { results, consensus: computeConsensus(results.map((r) => r.value)), skipped };
}

export const tool: Tool<MusclePotentialInputT, MusclePotentialOutputT> = {
  id: "muscle-potential",
  name: "Maximum Muscular Potential",
  description:
    "Estimate drug-free maximum bodyweight at a target body-fat % via Casey Butt " +
    "(wrist+ankle), the FFMI~25 natural cap, and Berkhan's max-contest-weight model. " +
    "Men only in v1.",
  category: "composition",
  tags: ["muscle", "potential", "ffmi", "natural"],
  methods: ALL_METHODS,
  input: MusclePotentialInput,
  output: MusclePotentialOutput,
  compute,
  examples: [
    {
      input: { sex: "male", height: { value: 180, unit: "cm" } },
      output: { results: [{ method: "ffmi-cap", unit: "kg" }] },
    },
  ],
};
