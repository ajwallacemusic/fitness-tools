import { z } from "zod";
import { Sex } from "../math/common.js";
import { LengthSchema, MassSchema, massKg, lengthCm } from "../math/units.js";
import { navyBf, jacksonPollock3, deurenberg } from "../math/bodyfat.js";
import { computeConsensus, roundTo } from "../math/stats.js";
import { DomainError } from "../errors.js";
import {
  MethodResultSchema, SkippedMethodSchema, ConsensusSchema,
} from "../models.js";
import { runMethods, type MethodOutput } from "../dispatch.js";
import type { Tool } from "../registry.js";

const ALL_METHODS = ["navy", "jackson-pollock-3", "deurenberg"];
const REASONS: Record<string, string> = {
  navy: "navy: requires neck, waist, height (+ hip for female)",
  "jackson-pollock-3": "jackson-pollock-3: requires skinfold_sum and age",
  deurenberg: "deurenberg: requires weight, height, age",
};

export const BodyFatInput = z.object({
  sex: Sex,
  age: z.number().gt(0).lte(120).nullable().default(null),
  height: LengthSchema.nullable().default(null),
  weight: MassSchema.nullable().default(null),
  neck: LengthSchema.nullable().default(null),
  waist: LengthSchema.nullable().default(null),
  hip: LengthSchema.nullable().default(null),
  skinfold_sum: z.number().gt(0).nullable().default(null),
  methods: z.union([z.array(z.string()), z.literal("all")]).default("all"),
});
export type BodyFatInputT = z.output<typeof BodyFatInput>;

export const BodyFatOutput = z.object({
  results: z.array(MethodResultSchema),
  consensus: ConsensusSchema.nullable(),
  skipped: z.array(SkippedMethodSchema),
});
export type BodyFatOutputT = z.output<typeof BodyFatOutput>;

function detail(inp: BodyFatInputT, bf: number): Record<string, unknown> | null {
  if (inp.weight === null) return null;
  const kg = massKg(inp.weight);
  const fat = roundTo((kg * bf) / 100, 2);
  return { fat_mass_kg: fat, lean_mass_kg: roundTo(kg - fat, 2) };
}

function bfValue(method: string, inp: BodyFatInputT): number | null {
  if (method === "navy") {
    if (inp.neck && inp.waist && inp.height) {
      if (inp.sex === "female" && inp.hip === null) return null;
      try {
        return navyBf(
          inp.sex,
          lengthCm(inp.waist),
          lengthCm(inp.neck),
          lengthCm(inp.height),
          inp.hip ? lengthCm(inp.hip) : undefined,
        );
      } catch (e) {
        throw new DomainError((e as Error).message);
      }
    }
    return null;
  }
  if (method === "jackson-pollock-3") {
    if (inp.skinfold_sum !== null && inp.age !== null)
      return jacksonPollock3(inp.sex, inp.skinfold_sum, inp.age);
    return null;
  }
  if (method === "deurenberg") {
    if (inp.weight && inp.height && inp.age !== null) {
      const bmi = massKg(inp.weight) / (lengthCm(inp.height) / 100) ** 2;
      return deurenberg(inp.sex, bmi, inp.age);
    }
    return null;
  }
  throw new DomainError(`unknown method: ${method}`);
}

export function compute(inp: BodyFatInputT): BodyFatOutputT {
  const run = (method: string): MethodOutput => {
    const bf = bfValue(method, inp);
    if (bf === null) return null;
    return [bf, detail(inp, bf)];
  };
  const requested = inp.methods === "all" ? ALL_METHODS : inp.methods;
  const explicit = inp.methods !== "all";
  const { results, skipped } = runMethods(requested, explicit, run, "%", {
    reasonFn: (m) => REASONS[m] ?? `${m}: required inputs missing`,
    ndigits: 2,
  });
  return { results, consensus: computeConsensus(results.map((r) => r.value)), skipped };
}

export const tool: Tool<BodyFatInputT, BodyFatOutputT> = {
  id: "body-fat",
  name: "Body Fat Percentage",
  description:
    "Estimate body-fat % via US Navy circumference, Jackson-Pollock 3-site skinfold, " +
    "and Deurenberg (BMI-based) methods.",
  category: "composition",
  tags: ["body fat", "composition", "navy", "skinfold"],
  methods: ALL_METHODS,
  input: BodyFatInput,
  output: BodyFatOutput,
  compute,
  examples: [
    {
      input: {
        sex: "male",
        neck: { value: 40, unit: "cm" },
        waist: { value: 90, unit: "cm" },
        height: { value: 180, unit: "cm" },
      },
      output: { results: [{ method: "navy", unit: "%" }] },
    },
  ],
};
