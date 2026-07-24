import { describe, expect, test } from "vitest";
import { runKalmanEnergyModel, type KalmanDay } from "./energy-model.js";
import { lcg, simulate } from "./energy-model.sim.js";

const v1Noise = { arSigmaKg: 0, whiteSigmaKg: 0.45 }; // clean white-noise profile

describe("kalman energy model — recovery", () => {
	test("recovers a constant TDEE during a clean cut (white noise)", () => {
		const sim = simulate({ n: 120, w0Kg: 93, tdee: () => 2800, intake: () => 2300, ...v1Noise });
		const r = runKalmanEnergyModel(sim.days)!;
		expect(Math.abs(r.tdee - 2800)).toBeLessThan(150);
		expect(Math.abs(r.trueWeightKg - sim.trueW[sim.trueW.length - 1])).toBeLessThan(0.7);
		expect(r.rateKgPerWeek).toBeLessThan(-0.2); // cutting ~0.45 kg/wk
		expect(r.rateCi95KgPerWeek[0]).toBeLessThan(r.rateKgPerWeek);
		expect(r.rateCi95KgPerWeek[1]).toBeGreaterThan(r.rateKgPerWeek);
	});

	test("handles sparse weigh-ins (weekday-only) and returns null with none", () => {
		const sim = simulate({ n: 120, w0Kg: 93, tdee: () => 2800, intake: () => 2300, ...v1Noise, weighIn: (i) => i % 7 < 5 });
		expect(Math.abs(runKalmanEnergyModel(sim.days)!.tdee - 2800)).toBeLessThan(200);
		const noWeights: KalmanDay[] = sim.days.map((d) => ({ ...d, weightKg: null }));
		expect(runKalmanEnergyModel(noWeights)).toBeNull();
	});

	test("is not fooled by heavily under-logged days (0.4×EWMA gate)", () => {
		const sim = simulate({
			n: 120, w0Kg: 93, tdee: () => 2800, intake: () => 2600, ...v1Noise,
			logIntake: (_i, _t, rnd) => { const u = rnd(); return u < 0.1 ? null : u < 0.35 ? 2600 * 0.35 : 2600; },
		});
		expect(Math.abs(runKalmanEnergyModel(sim.days)!.tdee - 2800)).toBeLessThan(200);
	});

	test("prior seeds the filter and is echoed; default prior is 33 kcal/kg", () => {
		const sim = simulate({ n: 3, w0Kg: 93, tdee: () => 2800, intake: () => 2800, ...v1Noise });
		const seeded = runKalmanEnergyModel(sim.days, { priorTdeeKcal: 3055 })!;
		expect(seeded.priorTdeeKcal).toBe(3055);
		expect(Math.abs(seeded.tdee - 3055)).toBeLessThan(120); // 3 days barely moves it
		const dflt = runKalmanEnergyModel(sim.days)!;
		// default prior = 33 × first weigh-in; the weigh-in carries ±0.45 kg noise → ±~15 kcal
		expect(Math.abs(dflt.priorTdeeKcal - 33 * 93)).toBeLessThan(40);
	});

	test("qe controls responsiveness ordering after a TDEE step", () => {
		const sim = simulate({ n: 90, w0Kg: 93, tdee: (i) => (i < 60 ? 2800 : 3100), intake: () => 2800, ...v1Noise });
		const slow = runKalmanEnergyModel(sim.days, { qe: 36 })!.tdee;
		const fast = runKalmanEnergyModel(sim.days, { qe: 400 })!.tdee;
		expect(fast).toBeGreaterThan(slow);
	});
});

describe("kalman energy model — conditioning & robustness", () => {
	test("a 9,639 kcal mislog is ceiling-rejected: TDEE perturbed <40 kcal and surfaced", () => {
		const base = simulate({ n: 150, w0Kg: 93, tdee: () => 2900, intake: () => 2900 });
		const poisoned = structuredClone(base.days);
		poisoned[100].intakeKcal = 9639;
		const clean = runKalmanEnergyModel(base.days)!.tdee;
		const dirty = runKalmanEnergyModel(poisoned)!;
		expect(Math.abs(dirty.tdee - clean)).toBeLessThan(40);
		expect(dirty.flaggedIntakeDays).toContainEqual(
			expect.objectContaining({ date: poisoned[100].date, logged_kcal: 9639 }),
		);
	});

	test("a plausible-high day is flagged but BELIEVED (MAD flag-but-believe)", () => {
		const base = simulate({ n: 120, w0Kg: 93, tdee: () => 2500, intake: () => 2500, ...v1Noise });
		const spiked = structuredClone(base.days);
		spiked[80].intakeKcal = 4600; // above MAD gate, below 3×TDEE
		const r = runKalmanEnergyModel(spiked)!;
		expect(r.flaggedIntakeDays).toContainEqual(
			expect.objectContaining({ date: spiked[80].date, reason: "exceeds_median_plus_3mad" }),
		);
		// believed: the estimate moves vs a run where the day is null (imputed)
		const nulled = structuredClone(spiked);
		nulled[80].intakeKcal = null;
		expect(runKalmanEnergyModel(spiked)!.tdee).not.toBe(runKalmanEnergyModel(nulled)!.tdee);
	});

	test("stays within 100 kcal of the full-data run with 50% intake deleted (10 seeds)", () => {
		for (let seed = 1; seed <= 10; seed++) {
			const sim = simulate({ n: 150, w0Kg: 93, tdee: () => 2800, intake: () => 2450, seed });
			const full = runKalmanEnergyModel(sim.days)!.tdee;
			const holey = structuredClone(sim.days);
			const rnd = lcg(seed * 7919);
			for (const d of holey) if (rnd() < 0.5) d.intakeKcal = null;
			expect(Math.abs(runKalmanEnergyModel(holey)!.tdee - full)).toBeLessThan(100);
		}
	});

	test("a gross +5 kg scale outlier is innovation-gated: true weight moves <0.25 kg", () => {
		const base = simulate({ n: 120, w0Kg: 93, tdee: () => 2800, intake: () => 2800, arSigmaKg: 0, whiteSigmaKg: 0.18 });
		const spiked = structuredClone(base.days);
		spiked[119].weightKg = spiked[119].weightKg! + 5;
		const a = runKalmanEnergyModel(base.days)!.trueWeightKg;
		const b = runKalmanEnergyModel(spiked)!.trueWeightKg;
		expect(Math.abs(b - a)).toBeLessThan(0.25);
	});

	test("surplus→deficit with a 2 kg water drop over 5 days: TDEE overshoot <150 kcal", () => {
		const drop = (i: number) => (i < 60 ? 0 : i < 65 ? -((i - 59) / 5) * 2 : -2);
		const sim = simulate({ n: 100, w0Kg: 93, tdee: () => 3000, intake: (i) => (i < 60 ? 3300 : 2400), waterShiftKg: drop });
		// evaluate the causal estimate at truncation points through the transition
		for (let k = 65; k < 100; k += 5) {
			const r = runKalmanEnergyModel(sim.days.slice(0, k + 1))!;
			expect(r.tdee).toBeLessThan(3000 + 150);
		}
	});

	test("non-finite intake is treated as missing, never poisons the state", () => {
		const sim = simulate({ n: 60, w0Kg: 93, tdee: () => 2600, intake: () => 2600, ...v1Noise });
		const nan = structuredClone(sim.days);
		nan[30].intakeKcal = Number.NaN;
		expect(Number.isFinite(runKalmanEnergyModel(nan)!.tdee)).toBe(true);
	});

	test("pauses when >3 of the trailing 7 days lack intake, and reports the last confident estimate", () => {
		const sim = simulate({ n: 120, w0Kg: 93, tdee: () => 2800, intake: () => 2500, ...v1Noise,
			logIntake: (i, t) => (i >= 115 ? null : t) });
		const r = runKalmanEnergyModel(sim.days)!;
		expect(r.status).toBe("paused");
		expect(r.lastConfident).not.toBeNull();
		expect(r.lastConfident!.asOf < sim.days[sim.days.length - 1].date).toBe(true);
	});

	test("short history reports low confidence and no 28-day change", () => {
		const sim = simulate({ n: 15, w0Kg: 93, tdee: () => 2800, intake: () => 2500, ...v1Noise });
		const r = runKalmanEnergyModel(sim.days)!;
		expect(r.status).toBe("low_confidence");
		expect(r.change28dKcal).toBeNull();
		const long = runKalmanEnergyModel(simulate({ n: 120, w0Kg: 93, tdee: () => 2800, intake: () => 2500, ...v1Noise }).days)!;
		expect(typeof long.change28dKcal).toBe("number");
		expect(long.meanIntakeKcal14d).toBeCloseTo(2500, -2);
		expect(long.impliedDailyBalanceKcal!).toBeCloseTo(2500 - long.tdee, 0);
	});
});
