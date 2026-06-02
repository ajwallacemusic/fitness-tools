import { describe, expect, test } from "vitest";
import {
  mifflinBmr, harrisBmr, katchBmr, cunninghamBmr, lbmFromBodyfat,
} from "./energy.js";

describe("energy", () => {
  test("mifflin male/female", () => {
    expect(mifflinBmr("male", 80, 180, 30)).toBeCloseTo(1780.0);
    expect(mifflinBmr("female", 80, 180, 30)).toBeCloseTo(1614.0);
  });
  test("harris male/female", () => {
    expect(harrisBmr("male", 80, 180, 30)).toBeCloseTo(1853.632, 2);
    expect(harrisBmr("female", 80, 180, 30)).toBeCloseTo(1615.093, 2);
  });
  test("katch + cunningham + intercepts", () => {
    expect(katchBmr(68)).toBeCloseTo(1838.8);
    expect(cunninghamBmr(68)).toBeCloseTo(1996.0);
    expect(katchBmr(0)).toBeCloseTo(370.0);
  });
  test("lbm from bodyfat + boundaries + rejects", () => {
    expect(lbmFromBodyfat(80, 15)).toBeCloseTo(68.0);
    expect(lbmFromBodyfat(80, 0)).toBeCloseTo(80.0);
    expect(lbmFromBodyfat(80, 100)).toBeCloseTo(0.0);
    expect(() => lbmFromBodyfat(80, 101)).toThrow();
    expect(() => lbmFromBodyfat(0, 15)).toThrow();
  });
});
