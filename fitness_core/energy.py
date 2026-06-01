"""Basal metabolic rate formulas. All inputs canonical (kg, cm, years).

Sources:
- Mifflin-St Jeor (1990)
- Harris-Benedict revised by Roza & Shizgal (1984)
- Katch-McArdle; Cunningham (1980)  [LBM-based]
"""
from fitness_core.common import Sex


def mifflin_bmr(sex: Sex, kg: float, cm: float, age: float) -> float:
    base = 10 * kg + 6.25 * cm - 5 * age
    return base + 5 if sex == Sex.MALE else base - 161


def harris_bmr(sex: Sex, kg: float, cm: float, age: float) -> float:
    if sex == Sex.MALE:
        return 88.362 + 13.397 * kg + 4.799 * cm - 5.677 * age
    return 447.593 + 9.247 * kg + 3.098 * cm - 4.330 * age


def katch_bmr(lbm_kg: float) -> float:
    return 370 + 21.6 * lbm_kg


def cunningham_bmr(lbm_kg: float) -> float:
    return 500 + 22 * lbm_kg


def lbm_from_bodyfat(kg: float, body_fat_pct: float) -> float:
    return kg * (1 - body_fat_pct / 100)
