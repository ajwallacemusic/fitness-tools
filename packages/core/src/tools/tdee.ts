import { z } from "zod";
import { Sex, ActivityLevel, activityMultiplier } from "../math/common.js";
import { LengthSchema, MassSchema, massKg, lengthCm } from "../math/units.js";
import {
  mifflinBmr, harrisBmr, katchBmr, cunninghamBmr, lbmFromBodyfat,
} from "../math/energy.js";
import { computeConsensus, roundTo } from "../math/stats.js";
import { DomainError } from "../errors.js";
import {
  MethodResultSchema, SkippedMethodSchema, ConsensusSchema,
} from "../models.js";
import { runMethods, type MethodOutput } from "../dispatch.js";
import type { Tool } from "../registry.js";

const ALL_METHODS = ["mifflin", "harris", "katch", "cunningham"];

export const TdeeInput = z.object({
  sex: Sex,
  age: z.number().gt(0).lte(120),
  height: LengthSchema,
  weight: MassSchema,
  activity: z.union([ActivityLevel, z.number()]),
  body_fat: z.number().gte(2).lte(70).nullable().default(null),
  lean_mass: MassSchema.nullable().default(null),
  methods: z.union([z.array(z.string()), z.literal("all")]).default("all"),
});
export type TdeeInputT = z.output<typeof TdeeInput>;

export const TdeeOutput = z.object({
  results: z.array(MethodResultSchema),
  consensus: ConsensusSchema.nullable(),
  skipped: z.array(SkippedMethodSchema),
});
export type TdeeOutputT = z.output<typeof TdeeOutput>;

function lbm(inp: TdeeInputT): number | null {
  if (inp.lean_mass !== null) return massKg(inp.lean_mass);
  if (inp.body_fat !== null) return lbmFromBodyfat(massKg(inp.weight), inp.body_fat);
  return null;
}

export function compute(inp: TdeeInputT): TdeeOutputT {
  const mult = activityMultiplier(inp.activity);
  const kg = massKg(inp.weight);
  const cm = lengthCm(inp.height);
  const lean = lbm(inp);

  const bmrFor = (method: string): number | null => {
    if (method === "mifflin") return mifflinBmr(inp.sex, kg, cm, inp.age);
    if (method === "harris") return harrisBmr(inp.sex, kg, cm, inp.age);
    if (method === "katch") return lean !== null ? katchBmr(lean) : null;
    if (method === "cunningham") return lean !== null ? cunninghamBmr(lean) : null;
    throw new DomainError(`unknown method: ${method}`);
  };

  const run = (method: string): MethodOutput => {
    const bmr = bmrFor(method);
    if (bmr === null) return null;
    return [bmr * mult, { bmr: roundTo(bmr, 1), multiplier: mult }];
  };

  const requested = inp.methods === "all" ? ALL_METHODS : inp.methods;
  const explicit = inp.methods !== "all";
  const { results, skipped } = runMethods(requested, explicit, run, "kcal/day", {
    reasonFn: (m) => `${m}: requires body_fat or lean_mass`,
  });
  return { results, consensus: computeConsensus(results.map((r) => r.value)), skipped };
}

export const tool: Tool<TdeeInputT, TdeeOutputT> = {
  id: "tdee",
  name: "Total Daily Energy Expenditure",
  description:
    "Estimate BMR and TDEE via Mifflin-St Jeor, Harris-Benedict, Katch-McArdle, and " +
    "Cunningham. Provide body_fat or lean_mass to unlock the LBM-based methods.",
  category: "energy",
  tags: ["tdee", "bmr", "calories", "maintenance"],
  methods: ALL_METHODS,
  input: TdeeInput,
  output: TdeeOutput,
  compute,
  examples: [
    {
      input: {
        sex: "male", age: 30,
        height: { value: 180, unit: "cm" },
        weight: { value: 80, unit: "kg" },
        activity: "moderate",
      },
      output: { consensus: { n: 2 } },
    },
  ],
};
