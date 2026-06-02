import { describe, expect, test } from "vitest";
import { nearestLoadable, warmupRamp } from "./plates.js";

const KG = [25, 20, 15, 10, 5, 2.5, 1.25];

describe("plates", () => {
  test("exact load", () => {
    expect(nearestLoadable(180, 20, KG)).toEqual({ weight: 180, plates: [25, 25, 25, 5] });
  });
  test("snaps to nearest loadable", () => {
    expect(nearestLoadable(202, 20, KG)).toEqual({
      weight: 202.5,
      plates: [25, 25, 25, 15, 1.25],
    });
  });
  test("target below bar / empty plates → bare bar", () => {
    expect(nearestLoadable(15, 20, KG)).toEqual({ weight: 20, plates: [] });
    expect(nearestLoadable(100, 20, [])).toEqual({ weight: 20, plates: [] });
  });
  test("snap-up uses canonical plates", () => {
    expect(nearestLoadable(34, 20, [5, 2.5, 1.25])).toEqual({ weight: 35, plates: [5, 2.5] });
  });
  test("lb set exact", () => {
    expect(nearestLoadable(225, 45, [45, 35, 25, 10, 5, 2.5])).toEqual({
      weight: 225,
      plates: [45, 45],
    });
  });
  test("warmup ramp starts at bar, strictly increases", () => {
    const ramp = warmupRamp(180, 20, KG);
    expect(ramp[0]).toEqual({ weight: 20, reps: 5, plates: [] });
    const weights = ramp.map((r) => r.weight);
    expect(weights).toEqual([...weights].sort((a, b) => a - b));
    expect(new Set(weights).size).toBe(weights.length);
  });
});
