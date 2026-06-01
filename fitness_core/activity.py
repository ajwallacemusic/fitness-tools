"""Non-exercise (NEAT) and exercise (EAT) activity thermogenesis, kcal/day.

EAT uses the ACSM kcal-per-minute formula (MET * 3.5 * kg / 200). NEAT comes
from steps (~0.04 kcal/step at 70 kg, scaled by mass) or from occupation as a
fraction of BMR.
"""
from fitness_core.common import Intensity, Occupation

MET = {Intensity.LIGHT: 4.0, Intensity.MODERATE: 6.0, Intensity.VIGOROUS: 8.0}
OCCUPATION_NEAT_FRACTION = {
    Occupation.DESK: 0.15,
    Occupation.STANDING: 0.30,
    Occupation.MANUAL: 0.50,
    Occupation.HEAVY: 0.70,
}


def eat_kcal_per_day(sessions_per_week: float, session_minutes: float,
                     intensity: Intensity, weight_kg: float) -> float:
    kcal_per_min = MET[intensity] * 3.5 * weight_kg / 200
    return sessions_per_week * session_minutes * kcal_per_min / 7


def neat_from_steps(steps_per_day: float, weight_kg: float) -> float:
    return steps_per_day * 0.04 * weight_kg / 70


def neat_from_occupation(occupation: Occupation, bmr: float) -> float:
    return OCCUPATION_NEAT_FRACTION[occupation] * bmr
