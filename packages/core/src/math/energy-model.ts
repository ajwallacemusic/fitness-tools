/** Adaptive energy model: joint Kalman estimation of true weight (kg) and
 * TDEE (kcal/day) with robust input conditioning and an RTS smoother.
 * Pure — no I/O. Design principle: never assume complete data — missing or
 * implausible inputs widen uncertainty, never error.
 * Ported from the health-mcp implementation validated against ~6 years of
 * real daily logs (see repo docs/superpowers/plans/2026-07-24-adaptive-tdee-kalman.md). */
import { KCAL_PER_KG } from "./adaptive.js";

// Do not make RHO asymmetric. The obvious "improvement" — a lower value for
// weight gain because lean tissue is ~1,800 kcal/kg vs fat's ~9,400 — is wrong
// here. MacroFactor shipped that in V1/V2 and removed it in V3: under symmetric
// weight noise, an asymmetric RHO ratchets the estimate upward (~80 kcal
// persistent bias), because the expenditure bump from a random 0.5 lb loss
// exceeds the drop from regaining it. It also cancels out in the
// recommendation — a lower expenditure estimate pairs with a larger implied
// surplus for the same target rate, giving an identical calorie target.
// Ref: https://macrofactor.com/expenditure-v3/
const RHO = KCAL_PER_KG; // 7700 kcal per kg of body-mass change, symmetric

// Tuning (kg-native spec values).
const DEFAULT_R_KG2 = 0.4;    // scale observation noise (σ ≈ 0.63 kg)
const DEFAULT_QW_KG2 = 0.005; // energy-identity model error (σ ≈ 0.07 kg/day)
const DEFAULT_QE = 144;       // TDEE drift — the responsiveness knob (σ ≈ 12)

const LOW_INTAKE_FRAC = 0.4;   // below × EWMA → partial log, treated missing
const MAD_K = 3 * 1.4826;      // high-day gate: median + 3σ-equivalent
const MAD_FLOOR_FRAC = 0.05;   // degenerate-MAD floor (× median)
const CEILING_TDEE_MULT = 3;   // hard reject: intake > 3 × current TDEE
const EWMA_ALPHA = 2 / 15;     // 14-day EWMA of believed logged intake
const BASELINE_WINDOW = 28;
const MIN_BASELINE_DAYS = 7;
const DISCOUNT_Q_MULT = 4;     // process noise × on imputed-intake days
const NIS_GATE = 3;            // innovation gate (σ)
const SHIFT_EWMA_DELTA = 300;  // 14-day EWMA move that flags a diet transition
const SHIFT_R_MULT = 3;
const SHIFT_QW_MULT = 100;     // absorb a transition's glycogen drop into W, not
                               // TDEE — R×3 alone cannot (a cut's water drop is
                               // permanent; the cumulative innovation leaks into
                               // T regardless of R). Windows may chain while the
                               // EWMA delta stays high: one-shot hysteresis and
                               // no-guard variants were measured on real data and
                               // both landed outside the validated TDEE bracket.
const SHIFT_R_DAYS = 7;
const INIT_T_PER_KG = 33;      // prior fallback (≈ 15 kcal/lb)
const INIT_T_VAR = 400 ** 2;
const RATE_WINDOW = 14;
const WARMUP_OBS = 21;
const PAUSE_MISSING_7D = 3;
const LOW_CONF_MIN_DAYS = 21;
const LOW_CONF_CI_WIDTH = 400;

export interface KalmanDay {
	date: string;
	weightKg: number | null;
	intakeKcal: number | null;
}

export interface KalmanOptions {
	rKg2?: number;
	qwKg2?: number;
	qe?: number;
	priorTdeeKcal?: number;
}

export interface FlaggedIntakeDay {
	date: string;
	logged_kcal: number;
	reason: "exceeds_median_plus_3mad" | "exceeds_3x_tdee";
}

export interface KalmanResult {
	tdee: number;
	tdeeCi95: [number, number];
	change28dKcal: number | null;
	trueWeightKg: number;
	trueWeightCi95Kg: number;
	rateKgPerWeek: number;
	rateCi95KgPerWeek: [number, number];
	meanIntakeKcal14d: number | null;
	impliedDailyBalanceKcal: number | null;
	daysInModel: number;
	weightLoggingRate28d: number;
	intakeLoggingRate28d: number;
	flaggedIntakeDays: FlaggedIntakeDay[];
	status: "ok" | "low_confidence" | "paused";
	lastConfident: { asOf: string; tdee: number; tdeeCi95: [number, number] } | null;
	priorTdeeKcal: number;
}

const median = (xs: number[]): number => {
	const s = [...xs].sort((a, b) => a - b);
	const m = s.length >> 1;
	return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const r2 = (x: number) => Math.round(x * 100) / 100;

class Trailing {
	private buf: number[] = [];
	constructor(private cap: number) {}
	push(x: number) {
		this.buf.push(x);
		if (this.buf.length > this.cap) this.buf.shift();
	}
	get n() { return this.buf.length; }
	median(): number | null { return this.buf.length ? median(this.buf) : null; }
	mad(): number | null {
		if (!this.buf.length) return null;
		const m = median(this.buf);
		return median(this.buf.map((x) => Math.abs(x - m)));
	}
}

interface Step {
	predW: number; predT: number; pp00: number; pp01: number; pp11: number;
	filtW: number; filtT: number; pf00: number; pf01: number; pf11: number;
}

export function runKalmanEnergyModel(days: KalmanDay[], opts: KalmanOptions = {}): KalmanResult | null {
	const firstWeighIdx = days.findIndex((d) => d.weightKg != null);
	if (firstWeighIdx < 0) return null;

	const obsVar = opts.rKg2 ?? DEFAULT_R_KG2;
	const qwVar = opts.qwKg2 ?? DEFAULT_QW_KG2;
	const qeVar = opts.qe ?? DEFAULT_QE;

	// State [W, T], covariance P (2×2 symmetric as p00, p01, p11).
	let W = days[firstWeighIdx].weightKg!;
	const priorTdee = opts.priorTdeeKcal ?? INIT_T_PER_KG * W;
	let T = priorTdee;
	let p00 = obsVar, p01 = 0, p11 = INIT_T_VAR;

	// Deliberately inclusive: the MAD baseline ingests ALL logged days (incl.
	// ceiling-rejected and discounted) so the gate cannot enter a
	// self-reinforcing exclusion spiral; median/MAD are robust to the noise.
	const intakeWindow = new Trailing(BASELINE_WINDOW);
	let ewma: number | null = null;
	const ewmaHist: (number | null)[] = [];
	let shiftDaysLeft = 0;
	const flaggedIntakeDays: FlaggedIntakeDay[] = [];
	const intakeMissingEff: boolean[] = [];
	const cleanLogged: boolean[] = [];
	const weighObserved: boolean[] = [];
	const intakeUsedHist: number[] = [];
	const steps: Step[] = [];
	const dates: string[] = [];
	let obsCount = 0;

	for (let i = firstWeighIdx; i < days.length; i++) {
		const d = days[i];

		// --- intake trust (spec §3.1, measured amendments): reject only over the
		// hard ceiling; MAD hits are flagged but BELIEVED (rejection measurably
		// biased real-data TDEE low — MAD hits are usually genuine refeeds);
		// partial logs (<0.4×EWMA) are treated as missing, not real fast days ---
		const med = intakeWindow.n >= MIN_BASELINE_DAYS ? intakeWindow.median() : null;
		const madRaw = intakeWindow.n >= MIN_BASELINE_DAYS ? intakeWindow.mad() : null;
		const highGate = med != null && madRaw != null ? med + MAD_K * Math.max(madRaw, MAD_FLOOR_FRAC * med) : null;
		const impute = () => ewma ?? T; // pre-baseline: assume maintenance
		let intakeUsed: number;
		let qMult = 1;
		if (d.intakeKcal == null || !Number.isFinite(d.intakeKcal) || d.intakeKcal <= 0) {
			intakeUsed = impute();
			qMult = DISCOUNT_Q_MULT;
		} else if (d.intakeKcal > CEILING_TDEE_MULT * T) {
			flaggedIntakeDays.push({ date: d.date, logged_kcal: Math.round(d.intakeKcal), reason: "exceeds_3x_tdee" });
			intakeUsed = impute(); // don't winsorize — the true value is unknown
			qMult = DISCOUNT_Q_MULT;
		} else if (highGate != null && d.intakeKcal > highGate) {
			flaggedIntakeDays.push({ date: d.date, logged_kcal: Math.round(d.intakeKcal), reason: "exceeds_median_plus_3mad" });
			intakeUsed = d.intakeKcal; // believed
			ewma = ewma == null ? d.intakeKcal : ewma + EWMA_ALPHA * (d.intakeKcal - ewma);
		} else if (ewma != null && intakeWindow.n >= MIN_BASELINE_DAYS && d.intakeKcal < LOW_INTAKE_FRAC * ewma) {
			intakeUsed = impute(); // partial log, not a real fast day
			qMult = DISCOUNT_Q_MULT;
		} else {
			intakeUsed = d.intakeKcal;
			ewma = ewma == null ? d.intakeKcal : ewma + EWMA_ALPHA * (d.intakeKcal - ewma);
		}
		if (d.intakeKcal != null && Number.isFinite(d.intakeKcal) && d.intakeKcal > 0) intakeWindow.push(d.intakeKcal);
		intakeMissingEff.push(qMult > 1);
		cleanLogged.push(qMult === 1 && d.intakeKcal != null);
		intakeUsedHist.push(intakeUsed);

		// --- diet-transition heuristic (spec §6 + measured amendment): a
		// sustained intake shift means glycogen/water is moving; distrust the
		// scale AND widen W's own process noise for a week ---
		ewmaHist.push(ewma);
		const past = ewmaHist.length > 14 ? ewmaHist[ewmaHist.length - 15] : null;
		if (ewma != null && past != null && Math.abs(ewma - past) > SHIFT_EWMA_DELTA && shiftDaysLeft === 0) {
			shiftDaysLeft = SHIFT_R_DAYS;
		}
		let shiftMult = 1;
		let shiftQw = 1;
		if (shiftDaysLeft > 0) {
			shiftMult = SHIFT_R_MULT;
			shiftQw = SHIFT_QW_MULT;
			shiftDaysLeft--;
		}

		// --- predict: W += (I − T)/ρ; T random-walks ---
		// F = [[1, −1/ρ],[0,1]]; P ← F P Fᵀ + Q
		const a = -1 / RHO;
		W = W + (intakeUsed - T) / RHO;
		const n00 = p00 + a * p01 + a * (p01 + a * p11) + qwVar * qMult * shiftQw;
		const n01 = p01 + a * p11;
		const n11 = p11 + qeVar * qMult;
		p00 = n00; p01 = n01; p11 = n11;
		const predW = W, predT = T, pp00 = p00, pp01 = p01, pp11 = p11;

		// --- observation: today's weigh-in, Huber-gated so a gross outlier
		// moves the state a little, not a lot ---
		const z = d.weightKg;
		if (z != null && Number.isFinite(z)) {
			obsCount++;
			let R = obsVar * shiftMult;
			const y = z - W;
			const nis = Math.abs(y) / Math.sqrt(p00 + R);
			if (nis > NIS_GATE) R *= (nis / NIS_GATE) ** 2;
			const S = p00 + R;
			const k0 = p00 / S, k1 = p01 / S;
			W += k0 * y;
			T += k1 * y;
			const q00 = (1 - k0) * p00, q01 = (1 - k0) * p01, q11 = p11 - k1 * p01;
			p00 = q00; p01 = q01; p11 = q11;
			weighObserved.push(true);
		} else {
			weighObserved.push(false);
		}

		steps.push({ predW, predT, pp00, pp01, pp11, filtW: W, filtT: T, pf00: p00, pf01: p01, pf11: p11 });
		dates.push(d.date);
	}

	// --- RTS smoother: smoothed history for the rate/28d-change; the CURRENT
	// estimate stays the causal filtered state (never peek at the future) ---
	const n = steps.length;
	const sw = new Array<number>(n), st = new Array<number>(n);
	const sp00 = new Array<number>(n), sp01 = new Array<number>(n), sp11 = new Array<number>(n);
	const lastS = steps[n - 1];
	sw[n - 1] = lastS.filtW; st[n - 1] = lastS.filtT;
	sp00[n - 1] = lastS.pf00; sp01[n - 1] = lastS.pf01; sp11[n - 1] = lastS.pf11;
	const a = -1 / RHO;
	for (let t = n - 2; t >= 0; t--) {
		const s = steps[t], nx = steps[t + 1];
		const det = nx.pp00 * nx.pp11 - nx.pp01 * nx.pp01;
		if (!(det > 0)) {
			sw[t] = s.filtW; st[t] = s.filtT; sp00[t] = s.pf00; sp01[t] = s.pf01; sp11[t] = s.pf11;
			continue;
		}
		// C = P_filt(t) · Fᵀ · inv(P_pred(t+1)),  F = [[1, a], [0, 1]]
		const g00 = s.pf00 + a * s.pf01, g01 = s.pf01;
		const g10 = s.pf01 + a * s.pf11, g11 = s.pf11;
		const i00 = nx.pp11 / det, i01 = -nx.pp01 / det, i11 = nx.pp00 / det;
		const c00 = g00 * i00 + g01 * i01, c01 = g00 * i01 + g01 * i11;
		const c10 = g10 * i00 + g11 * i01, c11 = g10 * i01 + g11 * i11;
		const dW = sw[t + 1] - nx.predW, dT = st[t + 1] - nx.predT;
		sw[t] = s.filtW + c00 * dW + c01 * dT;
		st[t] = s.filtT + c10 * dW + c11 * dT;
		const d00 = sp00[t + 1] - nx.pp00, d01 = sp01[t + 1] - nx.pp01, d11 = sp11[t + 1] - nx.pp11;
		const m00 = c00 * d00 + c01 * d01, m01 = c00 * d01 + c01 * d11;
		const m10 = c10 * d00 + c11 * d01, m11 = c10 * d01 + c11 * d11;
		// P_s stays symmetric (C·Δ·Cᵀ of symmetric Δ), so storing (00,01,11) suffices.
		sp00[t] = s.pf00 + (m00 * c00 + m01 * c01);
		sp01[t] = s.pf01 + (m00 * c10 + m01 * c11);
		sp11[t] = s.pf11 + (m10 * c10 + m11 * c11);
	}

	// --- rate: WLS slope over the trailing 14 smoothed days, weights 1/P_s ---
	const m = Math.min(RATE_WINDOW, n);
	let swSum = 0, sx = 0, sy = 0;
	const pts: { x: number; y: number; w: number }[] = [];
	for (let i = n - m; i < n; i++) {
		const w = 1 / Math.max(sp00[i], 1e-9);
		pts.push({ x: i - (n - m), y: sw[i], w });
		swSum += w; sx += w * (i - (n - m)); sy += w * sw[i];
	}
	const xbar = sx / swSum, ybar = sy / swSum;
	let sxx = 0, sxy = 0;
	for (const p of pts) { sxx += p.w * (p.x - xbar) ** 2; sxy += p.w * (p.x - xbar) * (p.y - ybar); }
	const slope = sxx > 0 ? sxy / sxx : 0;
	const slopeSe = sxx > 0 ? Math.sqrt(1 / sxx) : 0;
	const weeklyKg = slope * 7;

	const tdeeCiHalf = Math.round(1.96 * Math.sqrt(Math.max(lastS.pf11, 0)));
	const tdeeNow = Math.round(lastS.filtT);

	const bal = intakeUsedHist.slice(-14);
	const meanIntake14 = bal.length ? Math.round(mean(bal)) : null;

	// --- compliance gate (spec §3.4) + status ---
	const missIn7 = (endIdx: number) => {
		let c = 0;
		for (let i = Math.max(0, endIdx - 6); i <= endIdx; i++) if (intakeMissingEff[i]) c++;
		return c;
	};
	const paused = missIn7(n - 1) > PAUSE_MISSING_7D;
	let lastConfident: KalmanResult["lastConfident"] = null;
	if (paused) {
		for (let i = n - 1; i >= 0; i--) {
			if (missIn7(i) <= PAUSE_MISSING_7D) {
				const half = Math.round(1.96 * Math.sqrt(Math.max(steps[i].pf11, 0)));
				const v = Math.round(steps[i].filtT);
				lastConfident = { asOf: dates[i], tdee: v, tdeeCi95: [v - half, v + half] };
				break;
			}
		}
	}
	const status: KalmanResult["status"] =
		paused ? "paused" : n < LOW_CONF_MIN_DAYS || 2 * tdeeCiHalf > LOW_CONF_CI_WIDTH || obsCount < WARMUP_OBS ? "low_confidence" : "ok";

	const tail28 = Math.min(28, n);
	const weigh28 = weighObserved.slice(-tail28).filter(Boolean).length;
	const clean28 = cleanLogged.slice(-tail28).filter(Boolean).length;

	return {
		tdee: tdeeNow,
		tdeeCi95: [tdeeNow - tdeeCiHalf, tdeeNow + tdeeCiHalf],
		change28dKcal: n >= 29 ? Math.round(lastS.filtT - st[n - 29]) : null,
		trueWeightKg: r2(lastS.filtW),
		trueWeightCi95Kg: r2(1.96 * Math.sqrt(Math.max(lastS.pf00, 0))),
		rateKgPerWeek: r2(weeklyKg),
		rateCi95KgPerWeek: [r2(weeklyKg - 1.96 * slopeSe * 7), r2(weeklyKg + 1.96 * slopeSe * 7)],
		meanIntakeKcal14d: meanIntake14,
		impliedDailyBalanceKcal: meanIntake14 == null ? null : meanIntake14 - tdeeNow,
		daysInModel: n,
		weightLoggingRate28d: r2(weigh28 / tail28),
		intakeLoggingRate28d: r2(clean28 / tail28),
		flaggedIntakeDays,
		status,
		lastConfident,
		priorTdeeKcal: Math.round(priorTdee),
	};
}
