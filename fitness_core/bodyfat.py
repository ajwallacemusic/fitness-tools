"""Body-fat estimation formulas.

Sources:
- Siri (1961) two-compartment equation.
- US Navy circumference method (metric form).
- Jackson & Pollock 3-site (1978/1980) body density + Siri.
- Deurenberg (1991) BMI-based.
"""
import math
from fitness_core.common import Sex


def siri(density: float) -> float:
    return 495 / density - 450


def navy_bf(sex: Sex, waist_cm: float, neck_cm: float, height_cm: float,
            hip_cm: float | None = None) -> float:
    log10 = math.log10
    if sex == Sex.MALE:
        d = (1.0324 - 0.19077 * log10(waist_cm - neck_cm)
             + 0.15456 * log10(height_cm))
    else:
        if hip_cm is None:
            raise ValueError("hip_cm is required for female Navy estimate")
        d = (1.29579 - 0.35004 * log10(waist_cm + hip_cm - neck_cm)
             + 0.22100 * log10(height_cm))
    return 495 / d - 450


def jackson_pollock_3(sex: Sex, sum_mm: float, age: float) -> float:
    if sex == Sex.MALE:
        density = (1.10938 - 0.0008267 * sum_mm + 0.0000016 * sum_mm ** 2
                   - 0.0002574 * age)
    else:
        density = (1.0994921 - 0.0009929 * sum_mm + 0.0000023 * sum_mm ** 2
                   - 0.0001392 * age)
    return siri(density)


def deurenberg(sex: Sex, bmi: float, age: float) -> float:
    sexf = 1 if sex == Sex.MALE else 0
    return 1.20 * bmi + 0.23 * age - 10.8 * sexf - 5.4
