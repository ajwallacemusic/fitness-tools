export interface Consensus {
  mean: number;
  median: number;
  min: number;
  max: number;
  n: number;
}

export function roundTo(x: number, ndigits = 1): number {
  const f = 10 ** ndigits;
  return Math.round((x + Number.EPSILON) * f) / f;
}

export function computeConsensus(values: number[]): Consensus | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mid = Math.floor(n / 2);
  const median = n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return {
    mean: values.reduce((a, b) => a + b, 0) / n,
    median,
    min: sorted[0],
    max: sorted[n - 1],
    n,
  };
}
