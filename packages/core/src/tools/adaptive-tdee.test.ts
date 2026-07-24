import { describe, expect, test } from "vitest";
import { tool, AdaptiveTdeeInput } from "./adaptive-tdee.js";

function series(days: number, w0: number, slopePerDay: number, kcal: number) {
	return Array.from({ length: days }, (_, d) => ({
		date: new Date(Date.UTC(2026, 0, 1 + d)).toISOString().slice(0, 10),
		weight: { value: w0 + slopePerDay * d, unit: "kg" as const },
		kcal,
	}));
}

describe("adaptive-tdee tool v2", () => {
	test("default method is kalman only", () => {
		const out = tool.compute(AdaptiveTdeeInput.parse({ entries: series(60, 80, -0.05, 2500) }));
		expect(out.results.map((r) => r.method)).toEqual(["kalman"]);
		expect(out.results[0].unit).toBe("kcal/day");
		// clean linear cut: kalman should land near the energy-balance truth 2885
		expect(Math.abs(out.results[0].value - 2885)).toBeLessThan(150);
		expect(out.consensus!.n).toBe(1);
	});

	test("kalman detail carries the model outputs", () => {
		const out = tool.compute(AdaptiveTdeeInput.parse({ entries: series(60, 80, -0.05, 2500) }));
		const d = out.results[0].detail as Record<string, unknown>;
		expect(d).toMatchObject({ kcal_per_kg: 7700, symmetric_rho: true, q_e: 144 });
		expect(Array.isArray(d.ci95_kcal)).toBe(true);
		expect(typeof d.true_weight_kg).toBe("number");
		expect(Array.isArray(d.rate_ci95_kg_per_week)).toBe(true);
		expect(typeof (d.data_quality as any).status).toBe("string");
		expect(typeof (d.data_quality as any).days_in_model).toBe("number");
	});

	test("PARITY (0.3.0 pin): window methods on a legacy payload are unchanged", () => {
		// -0.05 kg/day at 2500 kcal -> TDEE = 2500 + 0.05*7700 = 2885 (pinned in 0.3.0)
		const out = tool.compute(AdaptiveTdeeInput.parse({ entries: series(28, 80, -0.05, 2500), methods: ["regression", "endpoints"] }));
		expect(out.skipped).toEqual([]);
		for (const r of out.results) expect(r.value).toBeCloseTo(2885, 0);
	});

	test('methods:"all" runs all three', () => {
		const out = tool.compute(AdaptiveTdeeInput.parse({ entries: series(28, 80, -0.05, 2500), methods: "all" }));
		expect(out.results.map((r) => r.method).sort()).toEqual(["endpoints", "kalman", "regression"]);
	});

	test("kcal-less days are allowed (kalman imputes); window methods use logged days only", () => {
		const entries: any[] = series(60, 80, -0.05, 2500);
		for (let i = 0; i < entries.length; i += 3) delete entries[i].kcal;
		const out = tool.compute(AdaptiveTdeeInput.parse({ entries, methods: "all" }));
		const kalman = out.results.find((r) => r.method === "kalman")!;
		expect(Math.abs(kalman.value - 2885)).toBeLessThan(200);
		expect(out.results.find((r) => r.method === "regression")).toBeDefined();
	});

	test("weight-less days are allowed; all-weightless input skips kalman gracefully under 'all'", () => {
		const entries: any[] = series(60, 80, -0.05, 2500);
		for (let i = 1; i < entries.length; i += 2) delete entries[i].weight;
		const out = tool.compute(AdaptiveTdeeInput.parse({ entries }));
		expect(out.results[0].method).toBe("kalman");
		const noWeights = series(20, 80, 0, 2500).map(({ weight: _w, ...rest }) => rest);
		const out2 = tool.compute(AdaptiveTdeeInput.parse({ entries: noWeights, methods: "all" }));
		expect(out2.skipped.some((s) => s.method === "kalman")).toBe(true);
	});

	test("an entry with neither weight nor kcal is rejected", () => {
		const entries: any[] = series(20, 80, 0, 2500);
		entries[5] = { date: entries[5].date };
		expect(() => AdaptiveTdeeInput.parse({ entries })).toThrow(/weight|kcal/);
	});

	test("prior_tdee_kcal seeds the filter", () => {
		const short = series(12, 80, 0, 2500);
		const seeded = tool.compute(AdaptiveTdeeInput.parse({ entries: short, prior_tdee_kcal: 3200 }));
		const dflt = tool.compute(AdaptiveTdeeInput.parse({ entries: short }));
		expect(seeded.results[0].value).toBeGreaterThan(dflt.results[0].value);
	});

	test("lb weights convert", () => {
		const entries = series(28, 176.37, -0.11, 2500).map((e) => ({
			...e, weight: { value: e.weight.value, unit: "lb" as const },
		}));
		const out = tool.compute(AdaptiveTdeeInput.parse({ entries, methods: ["regression"] }));
		expect(out.results[0].value).toBeCloseTo(2884, 0);
	});

	test("duplicate dates are a DomainError", () => {
		const entries = series(14, 80, 0, 2500);
		entries[1] = { ...entries[0] };
		expect(() => tool.compute(AdaptiveTdeeInput.parse({ entries }))).toThrow(/duplicate/);
	});

	test("explicitly requesting kalman with no weights throws a clear DomainError", () => {
		const noWeights = series(20, 80, 0, 2500).map(({ weight: _w, ...rest }) => rest);
		expect(() => tool.compute(AdaptiveTdeeInput.parse({ entries: noWeights, methods: ["kalman"] }))).toThrow(/weigh/);
	});
});
