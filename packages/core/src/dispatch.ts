import { DomainError } from "./errors.js";
import type { MethodResult, SkippedMethod } from "./models.js";
import { roundTo } from "./math/stats.js";

export type MethodOutput = [number, Record<string, unknown> | null] | null;
export type ComputeFn = (method: string) => MethodOutput;

export interface RunMethodsOptions {
  reasonFn?: (method: string) => string;
  ndigits?: number;
}

export function runMethods(
  requested: string[],
  explicit: boolean,
  computeFn: ComputeFn,
  unit: string,
  opts: RunMethodsOptions = {},
): { results: MethodResult[]; skipped: SkippedMethod[] } {
  const { reasonFn, ndigits = 1 } = opts;
  const results: MethodResult[] = [];
  const skipped: SkippedMethod[] = [];
  const seen = new Set<string>();
  for (const m of requested) {
    if (seen.has(m)) continue;
    seen.add(m);
    const out = computeFn(m);
    if (out === null) {
      const reason = reasonFn ? reasonFn(m) : `${m}: required inputs missing`;
      if (explicit) throw new DomainError(reason);
      skipped.push({ method: m, reason });
      continue;
    }
    const [value, detail] = out;
    results.push({ method: m, value: roundTo(value, ndigits), unit, detail });
  }
  return { results, skipped };
}
