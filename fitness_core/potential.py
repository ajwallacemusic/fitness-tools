"""Maximum natural muscular potential (men). Returns max fat-free mass (kg);
pair with weight_at_bf to get max bodyweight at a target body-fat %.

Sources: Casey Butt (wrist+ankle FFM model); Kouri et al. natural FFMI ~25 cap;
Martin Berkhan max-contest-weight heuristic.
"""
import math

LB_TO_KG = 0.45359237
CM_TO_IN = 1 / 2.54


def weight_at_bf(ffm_kg: float, target_bf_pct: float) -> float:
    return ffm_kg / (1 - target_bf_pct / 100)


def casey_butt_ffm_kg(height_cm: float, wrist_cm: float, ankle_cm: float,
                      target_bf_pct: float) -> float:
    h = height_cm * CM_TO_IN
    w = wrist_cm * CM_TO_IN
    a = ankle_cm * CM_TO_IN
    lbm_lb = (h ** 1.5
              * (math.sqrt(w) / 22.6670 + math.sqrt(a) / 17.0104)
              * (target_bf_pct / 224 + 1))
    return lbm_lb * LB_TO_KG


def ffmi_cap_ffm_kg(height_cm: float) -> float:
    return 25 * (height_cm / 100) ** 2


def berkhan_ffm_kg(height_cm: float) -> float:
    return (height_cm - 100) * (1 - 0.055)
