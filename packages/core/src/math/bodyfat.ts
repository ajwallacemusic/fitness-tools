import type { Sex } from "./common.js";

const log10 = Math.log10;

export function siri(density: number): number {
  return 495 / density - 450;
}

export function navyBf(
  sex: Sex,
  waistCm: number,
  neckCm: number,
  heightCm: number,
  hipCm?: number,
): number {
  let d: number;
  if (sex === "male") {
    if (waistCm <= neckCm)
      throw new Error(`waist_cm (${waistCm}) must be greater than neck_cm (${neckCm})`);
    d = 1.0324 - 0.19077 * log10(waistCm - neckCm) + 0.15456 * log10(heightCm);
  } else {
    if (hipCm === undefined)
      throw new Error("hip_cm is required for female Navy estimate");
    if (waistCm + hipCm <= neckCm)
      throw new Error(
        `waist_cm + hip_cm (${waistCm + hipCm}) must be greater than neck_cm (${neckCm})`,
      );
    d = 1.29579 - 0.35004 * log10(waistCm + hipCm - neckCm) + 0.221 * log10(heightCm);
  }
  return siri(d);
}

export function jacksonPollock3(sex: Sex, sumMm: number, age: number): number {
  const density =
    sex === "male"
      ? 1.10938 - 0.0008267 * sumMm + 0.0000016 * sumMm ** 2 - 0.0002574 * age
      : 1.0994921 - 0.0009929 * sumMm + 0.0000023 * sumMm ** 2 - 0.0001392 * age;
  return siri(density);
}

export function deurenberg(sex: Sex, bmi: number, age: number): number {
  const sexf = sex === "male" ? 1 : 0;
  return 1.2 * bmi + 0.23 * age - 10.8 * sexf - 5.4;
}
