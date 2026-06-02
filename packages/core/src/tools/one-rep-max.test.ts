import { describe, expect, test } from "vitest";
import { OneRepMaxInput, compute } from "./one-rep-max.js";
import { DomainError } from "../errors.js";

describe("one-rep-max tool", () => {
  test("all six methods run, epley value + unit", () => {
    const out = compute(OneRepMaxInput.parse({ weight: { value: 100, unit: "kg" }, reps: 5 }));
    expect(out.results.length).toBe(6);
    const epley = out.results.find((r) => r.method === "epley")!;
    expect(epley.value).toBeCloseTo(116.7, 1);
    expect(epley.unit).toBe("kg");
  });
  test("consensus over all methods + percent table", () => {
    const out = compute(OneRepMaxInput.parse({ weight: { value: 100, unit: "kg" }, reps: 5 }));
    expect(out.consensus!.n).toBe(6);
    expect(out.consensus!.mean).toBeCloseTo(115.8, 1);
    expect(out.percent_table[0].percent).toBe(50);
    expect(out.percent_table[0].load).toBeCloseTo(57.9, 1);
  });
  test("reports in user unit (lb) + epley lb value", () => {
    const out = compute(OneRepMaxInput.parse({ weight: { value: 225, unit: "lb" }, reps: 3 }));
    expect(out.results.every((r) => r.unit === "lb")).toBe(true);
    expect(out.results.find((r) => r.method === "epley")!.value).toBeCloseTo(247.5, 1);
  });
  test("explicit subset + unknown method raises", () => {
    const out = compute(
      OneRepMaxInput.parse({ weight: { value: 100, unit: "kg" }, reps: 5, methods: ["epley", "brzycki"] }),
    );
    expect(new Set(out.results.map((r) => r.method))).toEqual(new Set(["epley", "brzycki"]));
    expect(() =>
      compute(OneRepMaxInput.parse({ weight: { value: 100, unit: "kg" }, reps: 5, methods: ["bogus"] })),
    ).toThrow(DomainError);
  });
});
