import { describe, expect, test } from "vitest";
import { runMethods } from "./dispatch.js";
import { DomainError } from "./errors.js";

describe("runMethods", () => {
  test("runs and rounds", () => {
    const { results, skipped } = runMethods(
      ["a", "b"], false, (m) => [10.126, { k: m }], "u", { ndigits: 2 },
    );
    expect(results.map((r) => r.value)).toEqual([10.13, 10.13]);
    expect(results[0].unit).toBe("u");
    expect(results[0].detail).toEqual({ k: "a" });
    expect(skipped).toEqual([]);
  });
  test("skip under all-mode", () => {
    const { results, skipped } = runMethods(
      ["a", "b"], false, (m) => (m === "b" ? null : [5.0, null]), "u",
    );
    expect(results.map((r) => r.method)).toEqual(["a"]);
    expect(skipped.map((s) => s.method)).toEqual(["b"]);
  });
  test("explicit missing raises", () => {
    expect(() => runMethods(["b"], true, () => null, "u")).toThrow(DomainError);
  });
  test("dedupe", () => {
    const { results } = runMethods(["a", "a"], false, () => [1.0, null], "u");
    expect(results.length).toBe(1);
  });
  test("custom reason", () => {
    const { skipped } = runMethods(["x"], false, () => null, "u", {
      reasonFn: (m) => `${m}: nope`,
    });
    expect(skipped[0].reason).toBe("x: nope");
  });
});
