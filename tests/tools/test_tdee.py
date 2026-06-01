import pytest
from fitness_core.errors import DomainError
from tools.tdee import TdeeInput, compute

def _base(**kw):
    data = dict(sex="male", age=30, height={"value": 180, "unit": "cm"},
                weight={"value": 80, "unit": "kg"}, activity="moderate")
    data.update(kw)
    return TdeeInput(**data)

def test_runs_mifflin_and_harris_by_default():
    out = compute(_base())
    methods = {r.method for r in out.results}
    assert "mifflin" in methods and "harris" in methods

def test_mifflin_tdee_reference():
    out = compute(_base())
    mifflin = next(r for r in out.results if r.method == "mifflin")
    assert mifflin.value == pytest.approx(2759.0, abs=0.01)
    assert mifflin.unit == "kcal/day"
    assert mifflin.detail["bmr"] == pytest.approx(1780.0)

def test_katch_skipped_without_body_fat():
    out = compute(_base())
    skipped = {s.method for s in out.skipped}
    assert "katch" in skipped and "cunningham" in skipped

def test_katch_runs_with_body_fat():
    out = compute(_base(body_fat=15))
    katch = next(r for r in out.results if r.method == "katch")
    assert katch.value == pytest.approx(2850.14, abs=0.05)

def test_consensus_present():
    out = compute(_base())
    assert out.consensus is not None and out.consensus.n >= 2

def test_explicit_missing_method_raises():
    with pytest.raises(DomainError):
        compute(_base(methods=["katch"]))
