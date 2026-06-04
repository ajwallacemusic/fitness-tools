import { describe, it, expect } from "vitest";
import { compute, RsmiInput } from "./rsmi.js";

const base = {
  sex: "male" as const,
  height: { value: 180, unit: "cm" as const },
  weight: { value: 80, unit: "kg" as const },
  age: 30,
};

describe("rsmi tool", () => {
  it("estimates via wen-2011 and skips direct without asm_kg", () => {
    const out = compute(RsmiInput.parse({ ...base }));
    expect(out.results).toHaveLength(1);
    const r = out.results[0];
    expect(r.method).toBe("wen-2011");
    expect(r.unit).toBe("kg/m²");
    expect(r.value).toBeCloseTo(8.27, 2);
    expect(r.detail).toMatchObject({
      asm_kg: 26.8,
      below_ewgsop2: false,
      below_awgs: false,
      below_baumgartner: false,
    });
    expect(out.skipped).toEqual([{ method: "direct", reason: "direct: requires asm_kg" }]);
    expect(out.consensus).not.toBeNull();
    expect(out.consensus!.n).toBe(1);
  });

  it("runs both methods and a consensus when asm_kg is given", () => {
    const out = compute(RsmiInput.parse({ ...base, asm_kg: 20 }));
    const methods = out.results.map((r) => r.method).sort();
    expect(methods).toEqual(["direct", "wen-2011"]);
    const direct = out.results.find((r) => r.method === "direct")!;
    // 20 / 1.8² = 6.17 → below every male cutoff (7.0 / 7.0 / 7.26)
    expect(direct.value).toBeCloseTo(6.17, 2);
    expect(direct.detail).toMatchObject({
      below_ewgsop2: true,
      below_awgs: true,
      below_baumgartner: true,
    });
    expect(out.consensus!.n).toBe(2);
    expect(out.skipped).toEqual([]);
  });

  it("uses female cutoffs for women", () => {
    const out = compute(RsmiInput.parse({ ...base, sex: "female", asm_kg: 14 }));
    const direct = out.results.find((r) => r.method === "direct")!;
    // 14 / 1.8² = 4.32 → below women's cutoffs (5.5 / 5.4 / 5.45)
    expect(direct.detail).toMatchObject({ below_ewgsop2: true, below_awgs: true });
  });
});
