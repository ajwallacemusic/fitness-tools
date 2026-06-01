"""Macro split logic. Calorie math: protein/carb 4 kcal/g, fat 9 kcal/g."""

KCAL_PER_G = {"protein": 4, "carb": 4, "fat": 9}


def macros_g_per_kg(calories: float, kg: float,
                    protein_g_per_kg: float, fat_g_per_kg: float) -> dict:
    """Protein/fat anchored to bodyweight (g/kg); carbs fill remaining calories.

    The returned `calories` is recomputed from the resulting macros, so it may
    EXCEED the `calories` argument when protein+fat alone surpass the budget
    (carbs are clamped to 0 in that case).
    """
    p, c, f = KCAL_PER_G["protein"], KCAL_PER_G["carb"], KCAL_PER_G["fat"]
    protein_g = protein_g_per_kg * kg
    fat_g = fat_g_per_kg * kg
    carb_g = max(0.0, (calories - protein_g * p - fat_g * f) / c)
    return {
        "protein_g": round(protein_g, 1),
        "fat_g": round(fat_g, 1),
        "carb_g": round(carb_g, 1),
        "calories": round(protein_g * p + fat_g * f + carb_g * c, 0),
    }
