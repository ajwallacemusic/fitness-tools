// @vitest-environment jsdom
import { describe, expect, test } from "vitest";
import { REGISTRY, mifflinBmr, activityMultiplier } from "./index.js";

describe("browser-native execution (jsdom, no network)", () => {
  test("DOM globals exist (running in a browser-like env)", () => {
    expect(typeof window).toBe("object");
    expect(typeof document).toBe("object");
  });
  test("direct math call works client-side", () => {
    expect(mifflinBmr("male", 80, 180, 30) * activityMultiplier("moderate")).toBeCloseTo(2759.0, 1);
  });
  test("registry dispatch works client-side", () => {
    const tdee = REGISTRY.get("tdee")!;
    const input = tdee.input.parse({
      sex: "male", age: 30,
      height: { value: 180, unit: "cm" },
      weight: { value: 80, unit: "kg" },
      activity: "moderate",
    });
    const out = tdee.compute(input) as { results: { method: string; value: number }[] };
    const mifflin = out.results.find((r) => r.method === "mifflin")!;
    expect(mifflin.value).toBeCloseTo(2759.0, 1);
  });
});
