import { describe, expect, test } from "vitest";
import { ActivityMultiplierInput, compute } from "./activity-multiplier.js";
import { DomainError } from "../errors.js";

const neatEat = (extra: Record<string, unknown>) =>
  ActivityMultiplierInput.parse({
    bmr: 1780, weight: { value: 80, unit: "kg" },
    sessions_per_week: 4, session_minutes: 60, intensity: "moderate", ...extra,
  });

describe("activity-multiplier tool", () => {
  test("lookup runs", () => {
    const r = compute(ActivityMultiplierInput.parse({ activity_level: "moderate" }))
      .results.find((x) => x.method === "lookup")!;
    expect(r.value).toBeCloseTo(1.55);
    expect(r.unit).toBe("x");
  });
  test("neat-eat with occupation: value + details + source", () => {
    const r = compute(neatEat({ occupation: "desk" })).results.find((x) => x.method === "neat-eat")!;
    expect(r.value).toBeCloseTo(1.312, 3);
    expect((r.detail as any).eat_kcal).toBe(288);
    expect((r.detail as any).neat_kcal).toBe(267);
    expect((r.detail as any).neat_source).toBe("occupation");
  });
  test("neat-eat with steps source + heavy occupation + vigorous eat", () => {
    expect(
      (compute(neatEat({ steps_per_day: 8000 })).results.find((x) => x.method === "neat-eat")!.detail as any).neat_kcal,
    ).toBe(366);
    expect(
      (compute(neatEat({ occupation: "heavy" })).results.find((x) => x.method === "neat-eat")!.detail as any).neat_kcal,
    ).toBe(1246);
    expect(
      (compute(neatEat({ occupation: "desk", intensity: "vigorous" })).results.find((x) => x.method === "neat-eat")!.detail as any).eat_kcal,
    ).toBe(384);
  });
  test("skip + explicit raise + skip reason", () => {
    const out = compute(ActivityMultiplierInput.parse({ activity_level: "moderate" }));
    expect(out.skipped.map((s) => s.method)).toContain("neat-eat");
    expect(out.skipped.find((s) => s.method === "neat-eat")!.reason).toContain("requires bmr");
    expect(() =>
      compute(ActivityMultiplierInput.parse({ methods: ["neat-eat"], activity_level: "moderate" })),
    ).toThrow(DomainError);
  });
  test("consensus when both run", () => {
    const out = compute(neatEat({ activity_level: "moderate", occupation: "desk" }));
    expect(out.consensus!.n).toBe(2);
    expect(out.consensus!.mean).toBeCloseTo(1.431, 3);
  });
});
