import { describe, expect, test } from "vitest";
import { siri, navyBf, jacksonPollock3, deurenberg } from "./bodyfat.js";

describe("bodyfat", () => {
  test("siri", () => {
    expect(siri(1.0)).toBeCloseTo(45.0, 6);
    expect(siri(1.05)).toBeCloseTo(21.4286, 4);
  });
  test("navy male/female", () => {
    expect(navyBf("male", 90, 40, 180)).toBeCloseTo(18.4, 1);
    expect(navyBf("female", 80, 33, 165, 95)).toBeCloseTo(29.4, 1);
  });
  test("navy raises on bad geometry / missing hip", () => {
    expect(() => navyBf("male", 40, 40, 180)).toThrow();
    expect(() => navyBf("female", 80, 33, 165)).toThrow();
  });
  test("jackson-pollock 3 male/female", () => {
    expect(jacksonPollock3("male", 60, 30)).toBeCloseTo(18.0, 1);
    expect(jacksonPollock3("female", 50, 25)).toBeCloseTo(20.5, 1);
  });
  test("deurenberg male", () => {
    expect(deurenberg("male", 24.69, 30)).toBeCloseTo(20.3, 1);
  });
});
