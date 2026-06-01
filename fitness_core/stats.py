from statistics import mean, median


def compute_consensus(values: list[float]) -> dict | None:
    """Mean/median/min/max/n across comparable values. None if empty."""
    if not values:
        return None
    return {
        "mean": float(mean(values)),
        "median": float(median(values)),
        "min": float(min(values)),
        "max": float(max(values)),
        "n": len(values),
    }
