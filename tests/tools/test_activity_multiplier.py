import pytest
from fitness_core.errors import DomainError
from tools.activity_multiplier import ActivityMultiplierInput, compute

def test_lookup_runs():
    out = compute(ActivityMultiplierInput(activity_level="moderate"))
    r = next(x for x in out.results if x.method == "lookup")
    assert r.value == pytest.approx(1.55)
    assert r.unit == "x"

def test_neat_eat_runs_with_occupation():
    out = compute(ActivityMultiplierInput(
        bmr=1780, weight={"value": 80, "unit": "kg"},
        sessions_per_week=4, session_minutes=60, intensity="moderate",
        occupation="desk",
    ))
    r = next(x for x in out.results if x.method == "neat-eat")
    assert r.value == pytest.approx(1.312, abs=0.001)
    assert r.detail["eat_kcal"] == 288
    assert r.detail["neat_kcal"] == 267

def test_neat_eat_uses_steps_when_given():
    out = compute(ActivityMultiplierInput(
        bmr=1780, weight={"value": 80, "unit": "kg"},
        sessions_per_week=4, session_minutes=60, intensity="moderate",
        steps_per_day=8000,
    ))
    r = next(x for x in out.results if x.method == "neat-eat")
    assert r.detail["neat_kcal"] == 366  # 365.714 rounded

def test_neat_eat_skipped_without_training():
    out = compute(ActivityMultiplierInput(activity_level="moderate"))
    assert "neat-eat" in {s.method for s in out.skipped}

def test_explicit_neat_eat_missing_raises():
    with pytest.raises(DomainError):
        compute(ActivityMultiplierInput(methods=["neat-eat"], activity_level="moderate"))

def test_consensus_when_both_run():
    out = compute(ActivityMultiplierInput(
        activity_level="moderate", bmr=1780, weight={"value": 80, "unit": "kg"},
        sessions_per_week=4, session_minutes=60, intensity="moderate", occupation="desk",
    ))
    assert out.consensus is not None and out.consensus.n == 2

def test_neat_source_reported():
    occ = compute(ActivityMultiplierInput(
        bmr=1780, weight={"value": 80, "unit": "kg"}, sessions_per_week=4,
        session_minutes=60, intensity="moderate", occupation="desk"))
    assert next(r for r in occ.results if r.method == "neat-eat").detail["neat_source"] == "occupation"
    st = compute(ActivityMultiplierInput(
        bmr=1780, weight={"value": 80, "unit": "kg"}, sessions_per_week=4,
        session_minutes=60, intensity="moderate", steps_per_day=8000))
    assert next(r for r in st.results if r.method == "neat-eat").detail["neat_source"] == "steps"

def test_heavy_occupation_neat():
    out = compute(ActivityMultiplierInput(
        bmr=1780, weight={"value": 80, "unit": "kg"}, sessions_per_week=4,
        session_minutes=60, intensity="moderate", occupation="heavy"))
    assert next(r for r in out.results if r.method == "neat-eat").detail["neat_kcal"] == 1246

def test_vigorous_intensity_eat():
    out = compute(ActivityMultiplierInput(
        bmr=1780, weight={"value": 80, "unit": "kg"}, sessions_per_week=4,
        session_minutes=60, intensity="vigorous", occupation="desk"))
    assert next(r for r in out.results if r.method == "neat-eat").detail["eat_kcal"] == 384

def test_skip_reason_text():
    out = compute(ActivityMultiplierInput(activity_level="moderate"))
    reason = next(s.reason for s in out.skipped if s.method == "neat-eat")
    assert "requires bmr" in reason

def test_consensus_mean_when_both_run():
    out = compute(ActivityMultiplierInput(
        activity_level="moderate", bmr=1780, weight={"value": 80, "unit": "kg"},
        sessions_per_week=4, session_minutes=60, intensity="moderate", occupation="desk"))
    assert out.consensus.mean == pytest.approx(1.431, abs=0.001)
