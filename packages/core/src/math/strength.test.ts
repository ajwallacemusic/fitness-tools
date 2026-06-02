import { describe, expect, test } from "vitest";
import { oneRepMax, percentTable, ORM_METHODS } from "./strength.js";

describe("strength", () => {
  test("reference 1RMs at 100x5", () => {
    expect(oneRepMax("epley", 100, 5)).toBeCloseTo(116.6667, 3);
    expect(oneRepMax("brzycki", 100, 5)).toBeCloseTo(112.5, 3);
    expect(oneRepMax("oconner", 100, 5)).toBeCloseTo(112.5, 3);
    expect(oneRepMax("lombardi", 100, 5)).toBeCloseTo(117.462, 2);
    expect(oneRepMax("wathan", 100, 5)).toBeCloseTo(116.583, 2);
    expect(oneRepMax("mayhew", 100, 5)).toBeCloseTo(119.011, 2);
  });
  test("brzycki returns weight at 1 rep; undefined at >=37", () => {
    expect(oneRepMax("brzycki", 100, 1)).toBeCloseTo(100.0, 3);
    expect(() => oneRepMax("brzycki", 100, 37)).toThrow();
  });
  test("all methods amplify above the working weight", () => {
    for (const m of ORM_METHODS) expect(oneRepMax(m, 100, 5)).toBeGreaterThan(100);
  });
  test("percent table starts at 50%", () => {
    const t = percentTable(100);
    expect(t[0].percent).toBe(50);
    expect(t[0].load).toBeCloseTo(50);
  });
});
