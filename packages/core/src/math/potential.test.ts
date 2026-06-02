import { describe, expect, test } from "vitest";
import {
  caseyButtFfmKg, ffmiCapFfmKg, berkhanFfmKg, weightAtBf,
} from "./potential.js";

describe("potential", () => {
  test("ffmi cap + berkhan references", () => {
    expect(ffmiCapFfmKg(180)).toBeCloseTo(81.0);
    expect(berkhanFfmKg(180)).toBeCloseTo(75.6);
  });
  test("casey-butt reference", () => {
    expect(caseyButtFfmKg(180, 17, 22, 10)).toBeCloseTo(81.17, 1);
  });
  test("weight at body fat", () => {
    expect(weightAtBf(81.0, 10)).toBeCloseTo(90.0);
    expect(weightAtBf(75.6, 10)).toBeCloseTo(84.0);
  });
});
