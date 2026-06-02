import { describe, expect, test } from "vitest";
import { computeConsensus, roundTo } from "./stats.js";

describe("stats", () => {
  test("consensus basic", () => {
    const c = computeConsensus([10, 20, 30])!;
    expect(c.mean).toBeCloseTo(20);
    expect(c.median).toBeCloseTo(20);
    expect(c.min).toBe(10);
    expect(c.max).toBe(30);
    expect(c.n).toBe(3);
  });
  test("even-count median", () => {
    expect(computeConsensus([10, 20, 30, 40])!.median).toBeCloseTo(25);
  });
  test("empty returns null", () => {
    expect(computeConsensus([])).toBeNull();
  });
  test("roundTo", () => {
    expect(roundTo(10.126, 2)).toBe(10.13);
    expect(roundTo(365.714, 0)).toBe(366);
    expect(roundTo(72.0, 1)).toBe(72);
  });
});
