import { describe, expect, test } from "vitest";
import { REGISTRY, tools } from "./index.js";

const EXPECTED = [
  "tdee", "body-fat", "one-rep-max", "macros",
  "activity-multiplier", "powerlifting-attempts", "muscle-potential", "ffmi", "rsmi",
];

describe("core public API", () => {
  test("all nine tools registered", () => {
    for (const id of EXPECTED) expect(REGISTRY.has(id)).toBe(true);
    expect(REGISTRY.size).toBe(EXPECTED.length);
  });
  test("every example input validates + computes + output parses", () => {
    for (const tool of tools) {
      expect(tool.examples.length).toBeGreaterThan(0);
      for (const ex of tool.examples) {
        const parsed = tool.input.parse(ex.input);
        const out = tool.compute(parsed);
        expect(() => tool.output.parse(out)).not.toThrow();
        if (out && typeof out === "object" && "results" in out) {
          expect((out as { results: unknown[] }).results.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
