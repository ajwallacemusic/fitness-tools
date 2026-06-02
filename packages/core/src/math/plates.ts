const WARMUP_PCTS = [0.0, 0.4, 0.6, 0.75, 0.85, 0.93];
const WARMUP_REPS = [5, 5, 3, 2, 1, 1];

export interface LoadResult {
  weight: number;
  plates: number[];
}
export interface WarmupSet {
  weight: number;
  reps: number;
  plates: number[];
}

function greedyFill(perSide: number, platesDesc: number[]): number[] {
  const used: number[] = [];
  let rem = perSide;
  for (const p of platesDesc) {
    while (rem >= p - 1e-9) {
      used.push(p);
      rem -= p;
    }
  }
  return used;
}

export function nearestLoadable(
  target: number,
  bar: number,
  plates: number[],
): LoadResult {
  if (target <= bar || plates.length === 0) return { weight: bar, plates: [] };
  const desc = [...plates].sort((a, b) => b - a);
  const used = greedyFill((target - bar) / 2, desc);
  const below = bar + 2 * used.reduce((a, b) => a + b, 0);
  const above = below + 2 * desc[desc.length - 1];
  if (Math.abs(above - target) < Math.abs(below - target)) {
    return { weight: above, plates: greedyFill((above - bar) / 2, desc) };
  }
  return { weight: below, plates: [...used].sort((a, b) => b - a) };
}

export function warmupRamp(opener: number, bar: number, plates: number[]): WarmupSet[] {
  const out: WarmupSet[] = [];
  let last: number | null = null;
  for (let i = 0; i < WARMUP_PCTS.length; i++) {
    const pct = WARMUP_PCTS[i];
    const { weight, plates: ps } =
      pct === 0.0 ? { weight: bar, plates: [] } : nearestLoadable(opener * pct, bar, plates);
    if (last === null || weight > last) {
      out.push({ weight, reps: WARMUP_REPS[i], plates: ps });
      last = weight;
    }
  }
  return out;
}
