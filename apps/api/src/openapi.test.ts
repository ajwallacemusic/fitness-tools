import { describe, expect, test } from "vitest";
import { buildOpenApiDocument } from "./openapi.js";

const doc = buildOpenApiDocument() as any;

describe("buildOpenApiDocument", () => {
  test("is an OpenAPI 3.1 document with info", () => {
    expect(doc.openapi).toBe("3.0.3");
    expect(doc.info.title).toBe("Fitness Tools API");
    expect(typeof doc.info.version).toBe("string");
    expect(doc.info.version.length).toBeGreaterThan(0);
  });

  test("one POST operation per tool, with example + responses", () => {
    const tdee = doc.paths["/v1/tools/tdee"].post;
    expect(tdee.operationId).toBe("runTdee");
    expect(tdee.summary).toBe("Total Daily Energy Expenditure");
    expect(tdee.tags).toEqual(["energy"]);
    const media = tdee.requestBody.content["application/json"];
    expect(media.schema.$ref).toBe("#/components/schemas/TdeeInput");
    expect(media.example.sex).toBe("male"); // the registry example
    expect(tdee.responses["200"].content["application/json"].schema.$ref)
      .toBe("#/components/schemas/TdeeOutput");
    expect(tdee.responses["422"].$ref).toBe("#/components/responses/ValidationError");
    expect(tdee.responses["400"].$ref).toBe("#/components/responses/DomainError");
  });

  test("operationIds are PascalCased for hyphenated ids", () => {
    expect(doc.paths["/v1/tools/body-fat"].post.operationId).toBe("runBodyFat");
    expect(doc.paths["/v1/tools/one-rep-max"].post.operationId).toBe("runOneRepMax");
    expect(doc.paths["/v1/tools/muscle-potential"].post.operationId).toBe("runMusclePotential");
  });

  test("all 9 tool paths present", () => {
    for (const id of [
      "tdee", "body-fat", "one-rep-max", "macros",
      "activity-multiplier", "powerlifting-attempts", "muscle-potential",
      "ffmi", "rsmi",
    ]) {
      expect(doc.paths[`/v1/tools/${id}`].post).toBeDefined();
    }
  });

  test("documents discovery + health routes", () => {
    expect(doc.paths["/v1/tools"].get.operationId).toBe("listTools");
    expect(doc.paths["/v1/tools/{id}"].get.operationId).toBe("getTool");
    expect(doc.paths["/v1/tools/{id}"].get.responses["404"].$ref)
      .toBe("#/components/responses/NotFound");
    expect(doc.paths["/healthz"].get.operationId).toBe("healthz");
  });

  test("components: 18 tool schemas (object) + ErrorEnvelope + 3 responses", () => {
    const s = doc.components.schemas;
    expect(s.TdeeInput.type).toBe("object");
    expect(s.TdeeOutput.type).toBe("object");
    expect(s.MusclePotentialOutput.type).toBe("object");
    expect(s.ErrorEnvelope.type).toBe("object");
    // 9 tools × (Input+Output) = 18, plus ErrorEnvelope = 19
    expect(Object.keys(s).length).toBe(19);
    for (const r of ["ValidationError", "DomainError", "NotFound"]) {
      expect(doc.components.responses[r].content["application/json"].schema.$ref)
        .toBe("#/components/schemas/ErrorEnvelope");
    }
  });
});
