import { z } from "zod";
import {
  KCAL_PER_KG, endpointSlopeKgPerDay, energyBalanceTdee, olsSlopeKgPerDay,
  type WeightPoint,
} from "../math/adaptive.js";
import { runKalmanEnergyModel, type KalmanDay } from "../math/energy-model.js";
import { MassSchema, massKg } from "../math/units.js";
import { computeConsensus, roundTo } from "../math/stats.js";
import { DomainError } from "../errors.js";
import {
  MethodResultSchema, SkippedMethodSchema, ConsensusSchema,
} from "../models.js";
import { resolveMethods, runMethods, type MethodOutput } from "../dispatch.js";
import type { Tool } from "../registry.js";

const ALL_METHODS = ["kalman", "regression", "endpoints"];
const REASONS: Record<string, string> = {
  kalman: "kalman: requires at least one weigh-in entry",
  regression: "regression: requires at least 2 distinct dates with weight",
  endpoints: "endpoints: requires a date span of at least 2x window_days with weights",
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// BREAKING (0.4.0): weight and kcal are now optional per entry (>=1 of the two);
// default methods is "kalman" (was "all" over the window methods).
export const AdaptiveTdeeInput = z.object({
  entries: z
    .array(
      z
        .object({
          date: z.string().regex(DATE_RE, "expected YYYY-MM-DD"),
          weight: MassSchema.optional(),
          kcal: z.number().gt(0).lte(20000).optional(),
        })
        .refine((e) => e.weight != null || e.kcal != null, {
          message: "each entry needs weight and/or kcal",
        }),
    )
    .min(10)
    .max(400),
  window_days: z.number().int().gte(3).lte(14).default(7),
  prior_tdee_kcal: z.number().gte(500).lte(10000).optional()
    .describe("Optional starting TDEE estimate, e.g. from the tdee tool; speeds early convergence."),
  // Same accepted shapes as the shared MethodsSchema, but this tool defaults
  // to the kalman estimate alone — the window methods are for comparison.
  methods: z.union([z.array(z.string()), z.string()]).default("kalman"),
});
export type AdaptiveTdeeInputT = z.output<typeof AdaptiveTdeeInput>;

export const AdaptiveTdeeOutput = z.object({
  results: z.array(MethodResultSchema),
  consensus: ConsensusSchema.nullable(),
  skipped: z.array(SkippedMethodSchema),
});
export type AdaptiveTdeeOutputT = z.output<typeof AdaptiveTdeeOutput>;

function toPoints(inp: AdaptiveTdeeInputT): { points: WeightPoint[]; meanKcal: number | null } {
  const stamps = inp.entries.map((e) => ({
    t: Date.parse(`${e.date}T00:00:00Z`), e,
  }));
  const seen = new Set<number>();
  for (const s of stamps) {
    if (seen.has(s.t)) throw new DomainError("duplicate date in entries");
    seen.add(s.t);
  }
  stamps.sort((a, b) => a.t - b.t);
  const t0 = stamps[0].t;
  const points = stamps
    .filter((s) => s.e.weight != null)
    .map((s) => ({ day: Math.round((s.t - t0) / 86_400_000), weightKg: massKg(s.e.weight!) }));
  const kcals = stamps.map((s) => s.e.kcal).filter((k): k is number => k != null);
  const meanKcal = kcals.length ? kcals.reduce((a, b) => a + b, 0) / kcals.length : null;
  return { points, meanKcal };
}

function toKalmanDays(inp: AdaptiveTdeeInputT): KalmanDay[] {
  const stamps = inp.entries
    .map((e) => ({ t: Date.parse(`${e.date}T00:00:00Z`), e }))
    .sort((a, b) => a.t - b.t);
  const t0 = stamps[0].t;
  const span = Math.round((stamps[stamps.length - 1].t - t0) / 86_400_000) + 1;
  const byDay = new Map<number, (typeof stamps)[number]["e"]>();
  for (const s of stamps) byDay.set(Math.round((s.t - t0) / 86_400_000), s.e);
  return Array.from({ length: span }, (_, i) => {
    const e = byDay.get(i);
    return {
      date: new Date(t0 + i * 86_400_000).toISOString().slice(0, 10),
      weightKg: e?.weight ? massKg(e.weight) : null,
      intakeKcal: e?.kcal ?? null,
    };
  });
}

export function compute(inp: AdaptiveTdeeInputT): AdaptiveTdeeOutputT {
  const { points, meanKcal } = toPoints(inp);
  const info = (slope: number) => ({
    mean_intake_kcal: roundTo(meanKcal as number, 0),
    weight_change_kg_per_week: roundTo(slope * 7, 3),
    span_days: points[points.length - 1].day - points[0].day + 1,
    n_entries: points.length,
    kcal_per_kg: KCAL_PER_KG,
  });
  const run = (method: string): MethodOutput => {
    if (method === "kalman") {
      const r = runKalmanEnergyModel(toKalmanDays(inp), { priorTdeeKcal: inp.prior_tdee_kcal });
      if (r == null) return null;
      return [
        r.tdee,
        {
          ci95_kcal: r.tdeeCi95,
          change_28d_kcal: r.change28dKcal,
          true_weight_kg: r.trueWeightKg,
          true_weight_ci95_kg: r.trueWeightCi95Kg,
          rate_kg_per_week: r.rateKgPerWeek,
          rate_ci95_kg_per_week: r.rateCi95KgPerWeek,
          mean_intake_kcal_14d: r.meanIntakeKcal14d,
          implied_daily_balance_kcal: r.impliedDailyBalanceKcal,
          prior_tdee_kcal: r.priorTdeeKcal,
          data_quality: {
            days_in_model: r.daysInModel,
            weight_logging_rate_28d: r.weightLoggingRate28d,
            intake_logging_rate_28d: r.intakeLoggingRate28d,
            flagged_intake_days: r.flaggedIntakeDays,
            status: r.status,
            last_confident: r.lastConfident,
          },
          kcal_per_kg: KCAL_PER_KG,
          symmetric_rho: true,
          q_e: 144,
        },
      ];
    }
    if (method === "regression") {
      if (points.length < 2 || meanKcal == null) return null;
      const slope = olsSlopeKgPerDay(points);
      return [energyBalanceTdee(meanKcal, slope), info(slope)];
    }
    if (method === "endpoints") {
      if (points.length < 2 || meanKcal == null) return null;
      let slope: number;
      try {
        slope = endpointSlopeKgPerDay(points, inp.window_days);
      } catch {
        return null; // span too short -> skipped with REASONS.endpoints
      }
      return [energyBalanceTdee(meanKcal, slope), info(slope)];
    }
    throw new DomainError(`unknown method: ${method}`);
  };
  const { requested, explicit } = resolveMethods(inp.methods, ALL_METHODS);
  const { results, skipped } = runMethods(requested, explicit, run, "kcal/day", {
    reasonFn: (m) => REASONS[m] ?? `${m}: required inputs missing`,
    ndigits: 0,
  });
  return { results, consensus: computeConsensus(results.map((r) => r.value)), skipped };
}

export const tool: Tool<AdaptiveTdeeInputT, AdaptiveTdeeOutputT> = {
  id: "adaptive-tdee",
  name: "Adaptive TDEE",
  description:
    "Measure actual TDEE from a logged history of daily weight and/or calorie intake. " +
    "Default method (kalman) is a joint Kalman filter over true weight and TDEE — " +
    "handles missing days, gates outliers, and reports uncertainty (CI95) alongside " +
    "denoised true weight; regression/endpoints are simple window-based estimates kept " +
    "for comparison. Use instead of formula TDEE once real logged data exists. " +
    "Note: all methods need at least one weigh-in (kalman) or two (regression/endpoints) " +
    "— a history with zero weight entries throws under the kalman default; pass " +
    "methods:'all' to get a graceful empty/skipped result instead.",
  category: "energy",
  tags: ["tdee", "adaptive", "energy-balance", "weight-trend", "kalman"],
  methods: ALL_METHODS,
  input: AdaptiveTdeeInput,
  output: AdaptiveTdeeOutput,
  compute,
  examples: [
    {
      input: {
        entries: Array.from({ length: 14 }, (_, d) => ({
          date: new Date(Date.UTC(2026, 0, 1 + d)).toISOString().slice(0, 10),
          weight: { value: 80 - 0.05 * d, unit: "kg" },
          kcal: 2500,
        })),
      },
      output: { results: [{ method: "kalman", unit: "kcal/day" }] },
    },
  ],
};
