import { roundTo } from "./stats.js";

export const KCAL_PER_G = { protein: 4, carb: 4, fat: 9 } as const;

export interface MacroSplit {
  protein_g: number;
  fat_g: number;
  carb_g: number;
  calories: number;
}

/** Macro split (grams): protein and fat set by g/kg bodyweight, carbs fill the calorie budget. */
export function macrosGPerKg(
  calories: number,
  kg: number,
  proteinGPerKg: number,
  fatGPerKg: number,
): MacroSplit {
  const { protein: p, carb: c, fat: f } = KCAL_PER_G;
  const proteinG = proteinGPerKg * kg;
  const fatG = fatGPerKg * kg;
  const carbG = Math.max(0, (calories - proteinG * p - fatG * f) / c);
  return {
    protein_g: roundTo(proteinG, 1),
    fat_g: roundTo(fatG, 1),
    carb_g: roundTo(carbG, 1),
    calories: roundTo(proteinG * p + fatG * f + carbG * c, 0),
  };
}
