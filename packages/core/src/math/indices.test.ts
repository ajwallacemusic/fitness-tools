import { describe, it, expect } from "vitest";
import {
  FFMI_NATURAL_CAP, ffmi, adjustedFfmi, rsmi, wenAsmKg,
  EWGSOP2, AWGS, BAUMGARTNER,
} from "./indices.js";

describe("ffmi", () => {
  it("FFM 70.4 kg at 170 cm → 24.36 kg/m²", () => {
    expect(ffmi(70.4, 170)).toBeCloseTo(24.36, 2);
  });
  it("adjusts toward a 1.8 m reference height", () => {
    // raw 24.36 at 170 cm: + 6.1*(1.8-1.70) = +0.61
    expect(adjustedFfmi(ffmi(70.4, 170), 170)).toBeCloseTo(24.97, 2);
  });
  it("does not adjust at exactly 180 cm", () => {
    expect(adjustedFfmi(22, 180)).toBeCloseTo(22, 6);
  });
  it("exposes the natural cap as 25", () => {
    expect(FFMI_NATURAL_CAP).toBe(25);
  });
});

describe("rsmi / wen-2011", () => {
  it("Wen 2011 ASM for male 80 kg, 180 cm, age 30 → 26.80 kg", () => {
    // 0.193*80 + 0.107*180 - 4.157*1 - 0.037*30 - 2.631
    expect(wenAsmKg("male", 80, 180, 30)).toBeCloseTo(26.80, 2);
  });
  it("female uses sex code 2", () => {
    // male minus (4.157 * (2-1)) = 26.802 - 4.157
    expect(wenAsmKg("female", 80, 180, 30)).toBeCloseTo(22.645, 2);
  });
  it("RSMI = ASM / height² (26.80 kg at 180 cm → 8.27)", () => {
    expect(rsmi(26.80, 180)).toBeCloseTo(8.27, 2);
  });
});

describe("sarcopenia cutoffs", () => {
  it("EWGSOP2 men 7.0 / women 5.5", () => {
    expect(EWGSOP2).toEqual({ male: 7.0, female: 5.5 });
  });
  it("AWGS men 7.0 / women 5.4", () => {
    expect(AWGS).toEqual({ male: 7.0, female: 5.4 });
  });
  it("Baumgartner men 7.26 / women 5.45", () => {
    expect(BAUMGARTNER).toEqual({ male: 7.26, female: 5.45 });
  });
});
