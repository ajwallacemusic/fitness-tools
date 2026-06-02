import { describe, expect, test } from "vitest";
import { eatKcalPerDay, neatFromSteps, neatFromOccupation } from "./activity.js";

describe("activity", () => {
  test("eat reference", () => {
    expect(eatKcalPerDay(4, 60, "moderate", 80)).toBeCloseTo(288.0);
  });
  test("neat from occupation / steps", () => {
    expect(neatFromOccupation("desk", 1780)).toBeCloseTo(267.0);
    expect(neatFromSteps(8000, 80)).toBeCloseTo(365.714, 2);
  });
  test("intensity scales eat", () => {
    expect(eatKcalPerDay(3, 45, "vigorous", 70)).toBeGreaterThan(
      eatKcalPerDay(3, 45, "light", 70),
    );
  });
});
