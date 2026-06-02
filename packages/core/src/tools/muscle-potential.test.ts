import { describe, expect, test } from "vitest";
import { MusclePotentialInput, compute } from "./muscle-potential.js";
import { DomainError } from "../errors.js";

const base = (extra: Record<string, unknown> = {}) =>
  MusclePotentialInput.parse({ sex: "male", height: { value: 180, unit: "cm" }, ...extra });

describe("muscle-potential tool", () => {
  test("height-only runs ffmi + berkhan with consensus", () => {
    const out = compute(base());
    const ffmi = out.results.find((r) => r.method === "ffmi-cap")!;
    expect(ffmi.value).toBeCloseTo(90.0);
    expect(ffmi.unit).toBe("kg");
    expect((ffmi.detail as any).max_ffm_kg).toBeCloseTo(81.0, 1);
    expect(out.results.find((r) => r.method === "berkhan")!.value).toBeCloseTo(84.0);
    expect(out.consensus!.n).toBe(2);
  });
  test("casey-butt runs with measurements / skipped without", () => {
    const out = compute(base({ wrist: { value: 17, unit: "cm" }, ankle: { value: 22, unit: "cm" } }));
    const cb = out.results.find((r) => r.method === "casey-butt")!;
    expect(cb.value).toBeCloseTo(90.2, 1);
    expect((cb.detail as any).max_ffm_kg).toBeCloseTo(81.2, 1);
    expect(out.consensus!.n).toBe(3);
    expect(compute(base()).skipped.map((s) => s.method)).toContain("casey-butt");
  });
  test("female raises; explicit casey missing raises", () => {
    expect(() => compute(base({ sex: "female" }))).toThrow(DomainError);
    expect(() => compute(base({ methods: ["casey-butt"] }))).toThrow(DomainError);
  });
});
