import { describe, expect, test } from "vitest";
import { REGISTRY } from "@almostjacked/fitness-tools";
import { buildApp } from "./app.js";

const app = buildApp();
const ids = [...REGISTRY.keys()];

describe("registry contract", () => {
  test("registry not empty", () => {
    expect(ids.length).toBe(9);
  });
  test.each(ids)("%s is in the catalog with object schemas", async (id) => {
    const catalog = (await (await app.request("/v1/tools")).json()) as any[];
    const entry = catalog.find((e) => e.id === id);
    expect(entry).toBeDefined();
    expect(entry.input_schema.type).toBe("object");
    expect(entry.output_schema.type).toBe("object");
  });
  test.each(ids)("%s example input runs to 200 + parses as output", async (id) => {
    const tool = REGISTRY.get(id)!;
    expect(tool.examples.length).toBeGreaterThan(0);
    for (const ex of tool.examples) {
      const r = await app.request(`/v1/tools/${id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(ex.input),
      });
      expect(r.status).toBe(200);
      const data = await r.json();
      expect(() => tool.output.parse(data)).not.toThrow();
      if (data && typeof data === "object" && "results" in data) {
        expect((data as { results: unknown[] }).results.length).toBeGreaterThan(0);
      }
    }
  });
});
