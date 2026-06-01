"""One-rep-max estimation formulas. weight in any consistent unit; reps integer-ish."""
import math

ORM_METHODS = ["epley", "brzycki", "lombardi", "wathan", "oconner", "mayhew"]


def one_rep_max(method: str, weight: float, reps: float) -> float:
    if method == "epley":
        return weight * (1 + reps / 30)
    if method == "brzycki":
        return weight * 36 / (37 - reps)
    if method == "lombardi":
        return weight * reps ** 0.10
    if method == "wathan":
        return 100 * weight / (48.8 + 53.8 * math.exp(-0.075 * reps))
    if method == "oconner":
        return weight * (1 + 0.025 * reps)
    if method == "mayhew":
        return 100 * weight / (52.2 + 41.9 * math.exp(-0.055 * reps))
    raise ValueError(f"unknown 1RM method: {method}")


def percent_table(one_rm: float, percents=range(50, 105, 5)) -> list[dict]:
    """A %1RM -> load chart."""
    return [{"percent": p, "load": round(one_rm * p / 100, 1)} for p in percents]
