import { describe, expect, test } from "vitest";
import { REGISTRY } from "@almostjacked/fitness-tools";
import { toCatalogEntry, fullCatalog } from "./catalog.js";

describe("catalog", () => {
  test("entry has schemas + metadata", () => {
    const entry = toCatalogEntry(REGISTRY.get("tdee")!);
    expect(entry.id).toBe("tdee");
    expect(entry.methods).toEqual(["mifflin", "harris", "katch", "cunningham"]);
    expect(entry.input_schema.type).toBe("object");
    expect(entry.output_schema.type).toBe("object");
    expect(entry.examples.length).toBeGreaterThan(0);
  });
  test("full catalog lists all 9 ids", () => {
    const ids = new Set(fullCatalog().map((e) => e.id));
    for (const id of [
      "tdee", "body-fat", "one-rep-max", "macros",
      "activity-multiplier", "powerlifting-attempts", "muscle-potential",
      "ffmi", "rsmi",
    ]) {
      expect(ids.has(id)).toBe(true);
    }
  });
});
