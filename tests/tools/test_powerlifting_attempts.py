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

def test_third_attempt_plates():
    out = compute(_orm())
    assert out.attempts.third.plates_per_side == [25, 25, 25, 15, 1.25]

def test_aggressive_raises_opener():
    out = compute(_orm(aggressiveness="aggressive"))
    assert out.attempts.opener.weight == pytest.approx(182.5)

def test_conservative_opener_exact():
    out = compute(_orm(aggressiveness="conservative"))
    assert out.attempts.opener.weight == pytest.approx(175.0)
    assert out.attempts.opener.plates_per_side == [25, 25, 25, 2.5]

def test_warmup_plate_loads():
    out = compute(_orm())
    assert out.warmups[1].plates_per_side == [25, 1.25]

def test_bar_weight_in_different_unit_is_converted():
    # 1RM in lb, bar given in kg -> must be converted to ~44.09 lb, not used as 20.
    out = compute(PowerliftingAttemptsInput(
        one_rep_max={"value": 405, "unit": "lb"},
        bar_weight={"value": 20, "unit": "kg"}))
    assert out.unit == "lb"
    assert out.bar_weight == pytest.approx(44.09, abs=0.1)
