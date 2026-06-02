import { describe, expect, test } from "vitest";
import { activityMultiplier } from "./common.js";

describe("common", () => {
  test("activity multiplier values", () => {
    expect(activityMultiplier("sedentary")).toBe(1.2);
    expect(activityMultiplier("moderate")).toBe(1.55);
    expect(activityMultiplier("very_active")).toBe(1.9);
  });
  test("float passthrough", () => {
    expect(activityMultiplier(1.43)).toBe(1.43);
  });
});
