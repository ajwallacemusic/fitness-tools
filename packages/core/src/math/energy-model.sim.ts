// Test-only synthetic generator for the Kalman energy model (spec §7 truth
// model): weight via the energy identity + AR(1) water + white scale noise.
// Not exported from the package barrel.
import { KCAL_PER_KG } from "./adaptive.js";
import type { KalmanDay } from "./energy-model.js";

/** Deterministic LCG (no Math.random — CI must be reproducible). */
export function lcg(seed: number) {
	let s = seed >>> 0;
	return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}
/** Box-Muller-ish cheap normal from two uniforms. */
export function normal(rnd: () => number) {
	return () => {
		const u = Math.max(rnd(), 1e-9);
		return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
	};
}
export const day = (i: number) => new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);

export interface SimOpts {
	n: number;
	w0Kg: number;
	tdee: (i: number) => number;
	intake: (i: number) => number;
	/** Logged value for day i given the true intake — may lie or return null (unlogged). */
	logIntake?: (i: number, truth: number, rnd: () => number) => number | null;
	weighIn?: (i: number) => boolean;
	/** Deterministic water offset (kg) added to the scale, e.g. a cut's glycogen drop. */
	waterShiftKg?: (i: number) => number;
	arPhi?: number;
	arSigmaKg?: number;
	whiteSigmaKg?: number;
	seed?: number;
}

export interface Sim { days: KalmanDay[]; trueW: number[]; trueT: number[] }

export function simulate(o: SimOpts): Sim {
	const rnd = lcg(o.seed ?? 42);
	const gauss = normal(rnd);
	const phi = o.arPhi ?? 0.85;
	const arSigma = o.arSigmaKg ?? 0.4;
	const whiteSigma = o.whiteSigmaKg ?? 0.3;
	const days: KalmanDay[] = [];
	const trueW: number[] = [];
	const trueT: number[] = [];
	let w = o.w0Kg;
	let u = 0;
	for (let i = 0; i < o.n; i++) {
		const t = o.tdee(i);
		const intake = o.intake(i);
		w += (intake - t) / KCAL_PER_KG;
		u = phi * u + gauss() * arSigma;
		trueW.push(w);
		trueT.push(t);
		const obs = w + u + (o.waterShiftKg?.(i) ?? 0) + gauss() * whiteSigma;
		const weightKg = (o.weighIn?.(i) ?? true) ? Math.round(obs * 1000) / 1000 : null;
		const logged = o.logIntake ? o.logIntake(i, intake, rnd) : intake;
		days.push({ date: day(i), weightKg, intakeKcal: logged });
	}
	return { days, trueW, trueT };
}
