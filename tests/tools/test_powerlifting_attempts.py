import pytest
from tools.powerlifting_attempts import PowerliftingAttemptsInput, compute

def _orm(value=200, unit="kg", **kw):
    return PowerliftingAttemptsInput(one_rep_max={"value": value, "unit": unit}, **kw)

def test_standard_attempts():
    out = compute(_orm())
    assert out.attempts.opener.weight == pytest.approx(180)
    assert out.attempts.opener.plates_per_side == [25, 25, 25, 5]
    assert out.attempts.second.weight == pytest.approx(190)
    assert out.attempts.third.weight == pytest.approx(202.5)
    assert out.unit == "kg"
    assert out.bar_weight == 20

def test_warmups_start_at_bar_and_increase():
    out = compute(_orm())
    assert out.warmups[0].weight == 20 and out.warmups[0].reps == 5
    weights = [w.weight for w in out.warmups]
    assert weights == sorted(weights)

def test_aggressiveness_lowers_conservative_opener():
    standard = compute(_orm(aggressiveness="standard")).attempts.opener.weight
    conservative = compute(_orm(aggressiveness="conservative")).attempts.opener.weight
    assert conservative < standard

def test_lb_defaults():
    out = compute(_orm(value=405, unit="lb"))
    assert out.unit == "lb" and out.bar_weight == 45
