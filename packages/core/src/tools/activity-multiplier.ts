import { z } from "zod";
import {
  ActivityLevel, Intensity, Occupation, activityMultiplier,
} from "../math/common.js";
import { MassSchema, massKg } from "../math/units.js";
import {
  eatKcalPerDay, neatFromSteps, neatFromOccupation,
} from "../math/activity.js";
import { computeConsensus, roundTo } from "../math/stats.js";
import { DomainError } from "../errors.js";
import {
  MethodResultSchema, SkippedMethodSchema, ConsensusSchema,
} from "../models.js";
import { runMethods, type MethodOutput } from "../dispatch.js";
import type { Tool } from "../registry.js";

const ALL_METHODS = ["lookup", "neat-eat"];
const REASONS: Record<string, string> = {
  lookup: "lookup: requires activity_level",
  "neat-eat":
    "neat-eat: requires bmr, weight, sessions_per_week, session_minutes, intensity, " +
    "and steps_per_day or occupation",
};

export const ActivityMultiplierInput = z.object({
  activity_level: ActivityLevel.nullable().default(null),
  bmr: z.number().gt(0).nullable().default(null),
  weight: MassSchema.nullable().default(null),
  sessions_per_week: z.number().int().gte(0).lte(21).nullable().default(null),
  session_minutes: z.number().gt(0).lte(600).nullable().default(null),
  intensity: Intensity.nullable().default(null),
  steps_per_day: z.number().int().gte(0).lte(100000).nullable().default(null),
  occupation: Occupation.nullable().default(null),
  methods: z.union([z.array(z.string()), z.literal("all")]).default("all"),
});
export type ActivityMultiplierInputT = z.output<typeof ActivityMultiplierInput>;

export const ActivityMultiplierOutput = z.object({
  results: z.array(MethodResultSchema),
  consensus: ConsensusSchema.nullable(),
  skipped: z.array(SkippedMethodSchema),
});
export type ActivityMultiplierOutputT = z.output<typeof ActivityMultiplierOutput>;

function neatEat(inp: ActivityMultiplierInputT): MethodOutput {
  if (
    inp.bmr === null || inp.weight === null || inp.sessions_per_week === null ||
    inp.session_minutes === null || inp.intensity === null
  )
    return null;
  if (inp.steps_per_day === null && inp.occupation === null) return null;
  const eat = eatKcalPerDay(
    inp.sessions_per_week, inp.session_minutes, inp.intensity, massKg(inp.weight),
  );
  let neat: number;
  let neatSource: string;
  if (inp.steps_per_day !== null) {
    neat = neatFromSteps(inp.steps_per_day, massKg(inp.weight));
    neatSource = "steps";
  } else {
    neat = neatFromOccupation(inp.occupation!, inp.bmr);
    neatSource = "occupation";
  }
  const tdee = inp.bmr + neat + eat;
  return [
    tdee / inp.bmr,
    {
      neat_kcal: roundTo(neat, 0),
      eat_kcal: roundTo(eat, 0),
      tdee_kcal: roundTo(tdee, 0),
      neat_source: neatSource,
    },
  ];
}

export function compute(inp: ActivityMultiplierInputT): ActivityMultiplierOutputT {
  const run = (method: string): MethodOutput => {
    if (method === "lookup") {
      if (inp.activity_level === null) return null;
      return [activityMultiplier(inp.activity_level), null];
    }
    if (method === "neat-eat") return neatEat(inp);
    throw new DomainError(`unknown method: ${method}`);
  };
  const requested = inp.methods === "all" ? ALL_METHODS : inp.methods;
  const explicit = inp.methods !== "all";
  const { results, skipped } = runMethods(requested, explicit, run, "x", {
    reasonFn: (m) => REASONS[m] ?? `${m}: required inputs missing`,
    ndigits: 3,
  });
  return { results, consensus: computeConsensus(results.map((r) => r.value)), skipped };
}

export const tool: Tool<ActivityMultiplierInputT, ActivityMultiplierOutputT> = {
  id: "activity-multiplier",
  name: "Activity Multiplier",
  description:
    "Estimate the TDEE activity multiplier via the classic lookup table or a NEAT+EAT " +
    "model (occupation/steps for non-exercise, training volume for exercise).",
  category: "energy",
  tags: ["activity", "tdee", "neat", "eat"],
  methods: ALL_METHODS,
  input: ActivityMultiplierInput,
  output: ActivityMultiplierOutput,
  compute,
  examples: [
    {
      input: { activity_level: "moderate" },
      output: { results: [{ method: "lookup", unit: "x" }] },
    },
  ],
};
