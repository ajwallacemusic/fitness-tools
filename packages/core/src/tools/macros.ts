import { z } from "zod";
import { Goal } from "../math/common.js";
import { MassSchema, massKg } from "../math/units.js";
import { macrosGPerKg } from "../math/macros.js";
import { DomainError } from "../errors.js";
import { MethodResultSchema, ConsensusSchema } from "../models.js";
import { runMethods, type MethodOutput } from "../dispatch.js";
import type { Tool } from "../registry.js";

const ALL_METHODS = ["g-per-kg"];
const PROTEIN_DEFAULT: Record<string, number> = { cut: 2.2, maintain: 2.0, bulk: 1.8 };

export const MacrosInput = z.object({
  calories: z.number().gt(0),
  weight: MassSchema,
  goal: Goal.default("maintain"),
  protein_g_per_kg: z.number().gt(0).lte(4).nullable().default(null),
  fat_g_per_kg: z.number().gt(0).lte(3).nullable().default(null),
  methods: z.union([z.array(z.string()), z.literal("all")]).default("all"),
});
export type MacrosInputT = z.output<typeof MacrosInput>;

export const MacrosOutput = z.object({
  results: z.array(MethodResultSchema),
  consensus: ConsensusSchema.nullable(),
});
export type MacrosOutputT = z.output<typeof MacrosOutput>;

export function compute(inp: MacrosInputT): MacrosOutputT {
  const run = (method: string): MethodOutput => {
    if (method !== "g-per-kg") throw new DomainError(`unknown method: ${method}`);
    const protein = inp.protein_g_per_kg ?? PROTEIN_DEFAULT[inp.goal];
    const fat = inp.fat_g_per_kg ?? 0.9;
    const split = macrosGPerKg(inp.calories, massKg(inp.weight), protein, fat);
    return [split.calories, split as unknown as Record<string, unknown>];
  };
  const requested = inp.methods === "all" ? ALL_METHODS : inp.methods;
  const explicit = inp.methods !== "all";
  const { results } = runMethods(requested, explicit, run, "kcal", { ndigits: 0 });
  return { results, consensus: null };
}

export const tool: Tool<MacrosInputT, MacrosOutputT> = {
  id: "macros",
  name: "Macronutrient Split",
  description:
    "Compute protein/fat/carb grams for a calorie target using the g-per-kg-bodyweight " +
    "method, with goal-based protein defaults.",
  category: "nutrition",
  tags: ["macros", "protein", "nutrition", "diet"],
  methods: ALL_METHODS,
  input: MacrosInput,
  output: MacrosOutput,
  compute,
  examples: [
    {
      input: { calories: 2500, weight: { value: 80, unit: "kg" }, goal: "maintain" },
      output: { results: [{ method: "g-per-kg", unit: "kcal" }] },
    },
  ],
};
