import { describe, expect, test } from "vitest";
import { MethodResultSchema, ConsensusSchema } from "./models.js";
import { DomainError } from "./errors.js";

describe("models + errors", () => {
  test("MethodResult parses with default null detail", () => {
    const r = MethodResultSchema.parse({ method: "epley", value: 116.7, unit: "kg" });
    expect(r.detail).toBeNull();
  });
  test("Consensus schema accepts a full record", () => {
    expect(ConsensusSchema.parse({ mean: 1, median: 1, min: 1, max: 1, n: 1 }).n).toBe(1);
  });
  test("DomainError is named and instanceof Error", () => {
    const e = new DomainError("nope");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("DomainError");
  });
});
