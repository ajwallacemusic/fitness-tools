import { describe, expect, test } from "vitest";
import { buildApp } from "./app.js";

const app = buildApp();
const get = (p: string) => app.request(p);
const post = (p: string, body: unknown) =>
  app.request(p, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("api routes", () => {
  test("catalog lists tdee with schemas + methods", async () => {
    const body = (await (await get("/v1/tools")).json()) as any[];
    const ids = new Set(body.map((t) => t.id));
    expect(ids.has("tdee")).toBe(true);
    expect(body.length).toBe(7);
    const tdee = body.find((t) => t.id === "tdee");
    expect(tdee.input_schema).toBeDefined();
    expect(tdee.output_schema).toBeDefined();
    expect(tdee.methods).toEqual(["mifflin", "harris", "katch", "cunningham"]);
  });
  test("single tool + unknown 404 envelope", async () => {
    expect((await (await get("/v1/tools/tdee")).json()).id).toBe("tdee");
    const r = await get("/v1/tools/nope");
    expect(r.status).toBe(404);
    expect((await r.json()).error.type).toBe("not_found");
  });
  test("run tdee returns mifflin reference", async () => {
    const r = await post("/v1/tools/tdee", {
      sex: "male", age: 30,
      height: { value: 180, unit: "cm" },
      weight: { value: 80, unit: "kg" },
      activity: "moderate",
    });
    expect(r.status).toBe(200);
    const mifflin = (await r.json()).results.find((x: any) => x.method === "mifflin");
    expect(mifflin.value).toBeCloseTo(2759.0, 1);
  });
  test("validation 422 + domain 400 envelopes", async () => {
    const v = await post("/v1/tools/tdee", { sex: "male" });
    expect(v.status).toBe(422);
    expect((await v.json()).error.type).toBe("validation_error");
    const d = await post("/v1/tools/tdee", {
      sex: "male", age: 30,
      height: { value: 180, unit: "cm" },
      weight: { value: 80, unit: "kg" },
      activity: "moderate", methods: ["katch"],
    });
    expect(d.status).toBe(400);
    expect((await d.json()).error.type).toBe("domain_error");
  });
  test("run unknown tool 404", async () => {
    const r = await post("/v1/tools/nope", {});
    expect(r.status).toBe(404);
    expect((await r.json()).error.type).toBe("not_found");
  });
  test("GET /openapi.json returns the OpenAPI document", async () => {
    const r = await get("/openapi.json");
    expect(r.status).toBe(200);
    const doc = (await r.json()) as any;
    expect(doc.openapi).toBe("3.0.3");
    expect(doc.paths["/v1/tools/tdee"].post.operationId).toBe("runTdee");
  });

  test("GET /docs serves the Scalar UI", async () => {
    const r = await get("/docs");
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type") ?? "").toContain("text/html");
    const html = await r.text();
    expect(html).toContain("/openapi.json"); // the UI loads the spec by URL
  });
});
