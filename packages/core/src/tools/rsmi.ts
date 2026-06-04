import { z } from "zod";
import { Sex } from "../math/common.js";
import { LengthSchema, MassSchema, massKg, lengthCm } from "../math/units.js";
import {
  rsmi as rsmiOf, wenAsmKg, EWGSOP2, AWGS, BAUMGARTNER,
} from "../math/indices.js";
import { computeConsensus, roundTo } from "../math/stats.js";
import { DomainError } from "../errors.js";
import {
  MethodResultSchema, SkippedMethodSchema, ConsensusSchema,
} from "../models.js";
import { runMethods, type MethodOutput } from "../dispatch.js";
import type { Tool } from "../registry.js";

const ALL_METHODS = ["direct", "wen-2011"];

export const RsmiInput = z.object({
  sex: Sex,
  height: LengthSchema,
  weight: MassSchema,
  age: z.number().gt(0).lte(120),
  asm_kg: z.number().positive().nullable().default(null),
  methods: z.union([z.array(z.string()), z.literal("all")]).default("all"),
});
export type RsmiInputT = z.output<typeof RsmiInput>;

export const RsmiOutput = z.object({
  results: z.array(MethodResultSchema),
  consensus: ConsensusSchema.nullable(),
  skipped: z.array(SkippedMethodSchema),
});
export type RsmiOutputT = z.output<typeof RsmiOutput>;

function flags(sex: "male" | "female", value: number) {
  return {
    below_ewgsop2: value < EWGSOP2[sex],
    below_awgs: value < AWGS[sex],
    below_baumgartner: value < BAUMGARTNER[sex],
  };
}

export function compute(inp: RsmiInputT): RsmiOutputT {
  const cm = lengthCm(inp.height);

  const asmFor = (method: string): number | null => {
    if (method === "direct") return inp.asm_kg;
    if (method === "wen-2011") return wenAsmKg(inp.sex, massKg(inp.weight), cm, inp.age);
    throw new DomainError(`unknown method: ${method}`);
  };

  const run = (method: string): MethodOutput => {
    const asm = asmFor(method);
    if (asm === null) return null;
    const value = rsmiOf(asm, cm);
    return [value, { asm_kg: roundTo(asm, 2), ...flags(inp.sex, value) }];
  };

  const requested = inp.methods === "all" ? ALL_METHODS : inp.methods;
  const explicit = inp.methods !== "all";
  const { results, skipped } = runMethods(requested, explicit, run, "kg/m²", {
    reasonFn: () => "direct: requires asm_kg",
    ndigits: 2,
  });
  return { results, consensus: computeConsensus(results.map((r) => r.value)), skipped };
}

export const tool: Tool<RsmiInputT, RsmiOutputT> = {
  id: "rsmi",
  name: "Relative Skeletal Muscle Index",
  description:
    "Estimate the appendicular skeletal muscle index (RSMI) from a DXA value (direct) and/or " +
    "an anthropometric estimate (Wen 2011), and flag low muscle mass against EWGSOP2, AWGS, " +
    "and Baumgartner sarcopenia cutoffs.",
  category: "body-composition",
  tags: ["rsmi", "sarcopenia", "muscle", "body-composition"],
  methods: ALL_METHODS,
  input: RsmiInput,
  output: RsmiOutput,
  compute,
  examples: [
    {
      input: {
        sex: "male",
        height: { value: 180, unit: "cm" },
        weight: { value: 80, unit: "kg" },
        age: 30,
      },
      output: { consensus: { n: 1 } },
    },
  ],
};
