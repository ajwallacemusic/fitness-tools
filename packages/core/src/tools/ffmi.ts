import { z } from "zod";
import { LengthSchema, MassSchema, massKg, lengthCm } from "../math/units.js";
import { lbmFromBodyfat } from "../math/energy.js";
import { ffmi as ffmiOf, adjustedFfmi, FFMI_NATURAL_CAP } from "../math/indices.js";
import { roundTo } from "../math/stats.js";
import { DomainError } from "../errors.js";
import { MethodResultSchema, ConsensusSchema } from "../models.js";
import { runMethods, type MethodOutput } from "../dispatch.js";
import type { Tool } from "../registry.js";

const ALL_METHODS = ["standard"];

export const FfmiInput = z.object({
  height: LengthSchema,
  weight: MassSchema,
  body_fat: z.number().gte(2).lte(70).nullable().default(null),
  lean_mass: MassSchema.nullable().default(null),
  methods: z.union([z.array(z.string()), z.literal("all")]).default("all"),
});
export type FfmiInputT = z.output<typeof FfmiInput>;

export const FfmiOutput = z.object({
  results: z.array(MethodResultSchema),
  consensus: ConsensusSchema.nullable(),
});
export type FfmiOutputT = z.output<typeof FfmiOutput>;

function ffmKg(inp: FfmiInputT): number {
  if (inp.lean_mass !== null) return massKg(inp.lean_mass);
  if (inp.body_fat !== null) return lbmFromBodyfat(massKg(inp.weight), inp.body_fat);
  throw new DomainError("ffmi: requires body_fat or lean_mass");
}

export function compute(inp: FfmiInputT): FfmiOutputT {
  const ffm = ffmKg(inp);
  const cm = lengthCm(inp.height);
  const raw = ffmiOf(ffm, cm);

  const run = (method: string): MethodOutput => {
    if (method !== "standard") throw new DomainError(`unknown method: ${method}`);
    return [
      raw,
      {
        ffm_kg: roundTo(ffm, 2),
        ffmi_adjusted: roundTo(adjustedFfmi(raw, cm), 2),
        above_natural_limit: adjustedFfmi(raw, cm) > FFMI_NATURAL_CAP,
      },
    ];
  };

  const requested = inp.methods === "all" ? ALL_METHODS : inp.methods;
  const explicit = inp.methods !== "all";
  const { results } = runMethods(requested, explicit, run, "kg/m²", { ndigits: 2 });
  return { results, consensus: null };
}

export const tool: Tool<FfmiInputT, FfmiOutputT> = {
  id: "ffmi",
  name: "Fat-Free Mass Index",
  description:
    "Compute the Fat-Free Mass Index (FFMI) and its height-adjusted form from weight and " +
    "body fat (or lean mass), and flag whether it exceeds the ~25 natural ceiling.",
  category: "body-composition",
  tags: ["ffmi", "lean-mass", "body-composition", "muscle"],
  methods: ALL_METHODS,
  input: FfmiInput,
  output: FfmiOutput,
  compute,
  examples: [
    {
      input: { height: { value: 170, unit: "cm" }, weight: { value: 80, unit: "kg" }, body_fat: 12 },
      output: { results: [{ method: "standard", unit: "kg/m²" }] },
    },
  ],
};
