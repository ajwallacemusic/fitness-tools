"""Barbell plate loading and warmup ramp. All weights in one consistent unit.

A loadable weight is `bar + 2 * (multiset of available plates per side)`. The
greedy fill is optimal-enough for standard plate denominations.
"""

WARMUP_PCTS = [0.0, 0.40, 0.60, 0.75, 0.85, 0.93]
WARMUP_REPS = [5, 5, 3, 2, 1, 1]


def nearest_loadable(target: float, bar: float, plates: list[float]):
    """Return (achieved_weight, descending per-side plate list) nearest to target."""
    if target <= bar:
        return bar, []
    plates = sorted(plates, reverse=True)
    per_side = (target - bar) / 2
    used: list[float] = []
    rem = per_side
    for p in plates:
        while rem >= p - 1e-9:
            used.append(p)
            rem -= p
    below = bar + 2 * sum(used)
    smallest = plates[-1]
    above = below + 2 * smallest
    if abs(above - target) < abs(below - target):
        return above, sorted(used + [smallest], reverse=True)
    return below, sorted(used, reverse=True)


def warmup_ramp(opener: float, bar: float, plates: list[float]):
    """Strictly-increasing warmups from the empty bar up to ~opener.

    Returns a list of (weight, reps, per_side_plates).
    """
    out = []
    last = None
    for pct, reps in zip(WARMUP_PCTS, WARMUP_REPS):
        if pct == 0.0:
            weight, ps = bar, []
        else:
            weight, ps = nearest_loadable(opener * pct, bar, plates)
        if last is None or weight > last:
            out.append((weight, reps, ps))
            last = weight
    return out
