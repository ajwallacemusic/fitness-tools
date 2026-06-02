import { describe, expect, test } from "vitest";
import { PowerliftingAttemptsInput, compute } from "./powerlifting-attempts.js";

const orm = (extra: Record<string, unknown> = {}) =>
  PowerliftingAttemptsInput.parse({ one_rep_max: { value: 200, unit: "kg" }, ...extra });

describe("powerlifting-attempts tool", () => {
  test("standard attempts + plates", () => {
    const out = compute(orm());
    expect(out.attempts.opener.weight).toBeCloseTo(180);
    expect(out.attempts.opener.plates_per_side).toEqual([25, 25, 25, 5]);
    expect(out.attempts.second.weight).toBeCloseTo(190);
    expect(out.attempts.third.weight).toBeCloseTo(202.5);
    expect(out.attempts.third.plates_per_side).toEqual([25, 25, 25, 15, 1.25]);
    expect(out.unit).toBe("kg");
    expect(out.bar_weight).toBe(20);
  });
  test("warmups start at bar, increase, with plate loads", () => {
    const out = compute(orm());
    expect(out.warmups[0].weight).toBe(20);
    expect(out.warmups[0].reps).toBe(5);
    expect(out.warmups[1].plates_per_side).toEqual([25, 1.25]);
    const weights = out.warmups.map((w) => w.weight);
    expect(weights).toEqual([...weights].sort((a, b) => a - b));
  });
  test("aggressiveness shifts opener", () => {
    const std = compute(orm({ aggressiveness: "standard" })).attempts.opener.weight;
    const con = compute(orm({ aggressiveness: "conservative" }));
    expect(con.attempts.opener.weight).toBeLessThan(std);
    expect(con.attempts.opener.weight).toBeCloseTo(175.0);
    expect(con.attempts.opener.plates_per_side).toEqual([25, 25, 25, 2.5]);
    expect(compute(orm({ aggressiveness: "aggressive" })).attempts.opener.weight).toBeCloseTo(182.5);
  });
  test("lb defaults + bar in different unit is converted", () => {
    const lb = compute(orm({ one_rep_max: { value: 405, unit: "lb" } }));
    expect(lb.unit).toBe("lb");
    expect(lb.bar_weight).toBe(45);
    const mixed = compute(
      PowerliftingAttemptsInput.parse({
        one_rep_max: { value: 405, unit: "lb" }, bar_weight: { value: 20, unit: "kg" },
      }),
    );
    expect(mixed.unit).toBe("lb");
    expect(mixed.bar_weight).toBeCloseTo(44.09, 1);
  });
});
