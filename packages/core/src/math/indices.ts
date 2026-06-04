/**
 * Body-composition indices (mass ÷ height²) and the sarcopenia cutoffs used to
 * interpret RSMI. Pure functions — no Zod, no units wrappers.
 */

/** The widely-cited natural fat-free-mass index ceiling (Kouri et al. 1995). */
export const FFMI_NATURAL_CAP = 25;

const heightM = (heightCm: number): number => heightCm / 100;

/** Fat-Free Mass Index (kg/m²) from fat-free mass (kg) and height (cm). */
export function ffmi(ffmKg: number, heightCm: number): number {
  return ffmKg / heightM(heightCm) ** 2;
}

/** Height-normalized FFMI: adjust toward a 1.8 m reference (Kouri et al. 1995). */
export function adjustedFfmi(ffmiValue: number, heightCm: number): number {
  return ffmiValue + 6.1 * (1.8 - heightM(heightCm));
}

/** Relative Skeletal Muscle Index (kg/m²) from appendicular muscle (kg) and height (cm). */
export function rsmi(asmKg: number, heightCm: number): number {
  return asmKg / heightM(heightCm) ** 2;
}

/**
 * Appendicular skeletal muscle mass (kg) estimated from anthropometry.
 * Wen X, et al. Asia Pac J Clin Nutr 2011;20(4):551-556. sex code: male=1, female=2.
 */
export function wenAsmKg(
  sex: "male" | "female",
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  const sexCode = sex === "male" ? 1 : 2;
  return 0.193 * weightKg + 0.107 * heightCm - 4.157 * sexCode - 0.037 * age - 2.631;
}

/** Sex-specific RSMI cutoffs (kg/m², DXA) below which low muscle mass is flagged. */
export const EWGSOP2 = { male: 7.0, female: 5.5 } as const; // Cruz-Jentoft 2019
export const AWGS = { male: 7.0, female: 5.4 } as const; // Chen 2020
export const BAUMGARTNER = { male: 7.26, female: 5.45 } as const; // Baumgartner 1998
