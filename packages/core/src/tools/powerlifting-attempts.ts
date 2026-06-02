import { z } from "zod";
import { Aggressiveness } from "../math/common.js";
import { MassSchema, MassUnit, massKg, LB_TO_KG, type Mass } from "../math/units.js";
import { nearestLoadable, warmupRamp } from "../math/plates.js";
import type { Tool } from "../registry.js";

const ATTEMPT_PCTS: Record<string, [number, number, number]> = {
  conservative: [0.88, 0.93, 0.98],
  standard: [0.9, 0.95, 1.01],
  aggressive: [0.91, 0.97, 1.03],
};
const DEFAULT_PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];
const DEFAULT_PLATES_LB = [45, 35, 25, 10, 5, 2.5];

export const PowerliftingAttemptsInput = z.object({
  one_rep_max: MassSchema,
  bar_weight: MassSchema.nullable().default(null),
  available_plates: z.array(z.number()).nullable().default(null),
  aggressiveness: Aggressiveness.default("standard"),
});
export type PowerliftingAttemptsInputT = z.output<typeof PowerliftingAttemptsInput>;

const PlateLoad = z.object({ weight: z.number(), plates_per_side: z.array(z.number()) });
const WarmupSet = z.object({
  weight: z.number(), reps: z.number().int(), plates_per_side: z.array(z.number()),
});
export const PowerliftingAttemptsOutput = z.object({
  attempts: z.object({ opener: PlateLoad, second: PlateLoad, third: PlateLoad }),
  warmups: z.array(WarmupSet),
  bar_weight: z.number(),
  unit: MassUnit,
  aggressiveness: Aggressiveness,
});
export type PowerliftingAttemptsOutputT = z.output<typeof PowerliftingAttemptsOutput>;

function massInUnit(m: Mass, unit: "kg" | "lb"): number {
  if (m.unit === unit) return m.value;
  return unit === "kg" ? massKg(m) : massKg(m) / LB_TO_KG;
}

export function compute(inp: PowerliftingAttemptsInputT): PowerliftingAttemptsOutputT {
  const unit = inp.one_rep_max.unit;
  const orm = inp.one_rep_max.value;
  const bar =
    inp.bar_weight !== null
      ? massInUnit(inp.bar_weight, unit)
      : unit === "kg" ? 20.0 : 45.0;
  const plates =
    inp.available_plates !== null
      ? inp.available_plates
      : unit === "kg" ? DEFAULT_PLATES_KG : DEFAULT_PLATES_LB;
  const [pOpen, pSecond, pThird] = ATTEMPT_PCTS[inp.aggressiveness];

  const load = (pct: number) => {
    const { weight, plates: ps } = nearestLoadable(orm * pct, bar, plates);
    return { weight, plates_per_side: ps };
  };

  const opener = load(pOpen);
  const warmups = warmupRamp(opener.weight, bar, plates).map((w) => ({
    weight: w.weight, reps: w.reps, plates_per_side: w.plates,
  }));
  return {
    attempts: { opener, second: load(pSecond), third: load(pThird) },
    warmups,
    bar_weight: bar,
    unit,
    aggressiveness: inp.aggressiveness,
  };
}

export const tool: Tool<PowerliftingAttemptsInputT, PowerliftingAttemptsOutputT> = {
  id: "powerlifting-attempts",
  name: "Powerlifting Meet Attempts",
  description:
    "Deterministic opener/second/third attempts from an estimated 1RM, plus a warmup " +
    "ramp and per-side plate loading. Tunable by aggressiveness and available plates.",
  category: "strength",
  tags: ["powerlifting", "meet", "attempts", "warmup", "plates"],
  methods: ["standard"],
  input: PowerliftingAttemptsInput,
  output: PowerliftingAttemptsOutput,
  compute,
  examples: [
    {
      input: { one_rep_max: { value: 200, unit: "kg" } },
      output: { attempts: { opener: { weight: 180 } } },
    },
  ],
};
