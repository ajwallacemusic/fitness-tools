import { describe, expect, test } from "vitest";
import {
  MassSchema, LengthSchema, massKg, lengthCm, lengthMm,
} from "./units.js";

describe("units", () => {
  test("mass kg identity + lb→kg", () => {
    expect(massKg(MassSchema.parse({ value: 80, unit: "kg" }))).toBe(80);
    expect(massKg(MassSchema.parse({ value: 176.37, unit: "lb" }))).toBeCloseTo(80, 2);
  });
  test("mass default unit is kg", () => {
    expect(MassSchema.parse({ value: 70 }).unit).toBe("kg");
  });
  test("length conversions", () => {
    expect(lengthCm(LengthSchema.parse({ value: 180, unit: "cm" }))).toBe(180);
    expect(lengthCm(LengthSchema.parse({ value: 70, unit: "in" }))).toBeCloseTo(177.8, 2);
    expect(lengthCm(LengthSchema.parse({ value: 10, unit: "mm" }))).toBeCloseTo(1.0);
    expect(lengthMm(LengthSchema.parse({ value: 1, unit: "cm" }))).toBe(10);
    expect(LengthSchema.parse({ value: 180 }).unit).toBe("cm");
  });
  test("rejects non-positive, inf, nan, and bad units", () => {
    expect(() => MassSchema.parse({ value: -5, unit: "kg" })).toThrow();
    expect(() => MassSchema.parse({ value: 0, unit: "kg" })).toThrow();
    expect(() => MassSchema.parse({ value: Infinity, unit: "kg" })).toThrow();
    expect(() => MassSchema.parse({ value: NaN, unit: "kg" })).toThrow();
    expect(() => MassSchema.parse({ value: 80, unit: "stone" })).toThrow();
  });
});
