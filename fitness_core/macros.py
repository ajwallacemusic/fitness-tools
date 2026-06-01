"""Macro split logic. Calorie math: protein/carb 4 kcal/g, fat 9 kcal/g."""

KCAL_PER_G = {"protein": 4, "carb": 4, "fat": 9}


def macros_g_per_kg(calories: float, kg: float,
                    protein_g_per_kg: float, fat_g_per_kg: float) -> dict:
    protein_g = protein_g_per_kg * kg
    fat_g = fat_g_per_kg * kg
    remaining = calories - protein_g * 4 - fat_g * 9
    carb_g = max(0.0, remaining / 4)
    return {
        "protein_g": round(protein_g, 1),
        "fat_g": round(fat_g, 1),
        "carb_g": round(carb_g, 1),
        "calories": round(protein_g * 4 + fat_g * 9 + carb_g * 4, 0),
    }
