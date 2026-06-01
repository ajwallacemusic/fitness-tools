import pytest
from fitness_core.errors import DomainError
from tools.muscle_potential import MusclePotentialInput, compute

def _base(**kw):
    data = dict(sex="male", height={"value": 180, "unit": "cm"})
    data.update(kw)
    return MusclePotentialInput(**data)

def test_height_only_runs_ffmi_and_berkhan():
    out = compute(_base())
    methods = {r.method for r in out.results}
    assert "ffmi-cap" in methods and "berkhan" in methods
    ffmi = next(r for r in out.results if r.method == "ffmi-cap")
    assert ffmi.value == pytest.approx(90.0)
    assert ffmi.unit == "kg"
    assert ffmi.detail["max_ffm_kg"] == pytest.approx(81.0, abs=0.1)

def test_casey_butt_skipped_without_measurements():
    out = compute(_base())
    assert "casey-butt" in {s.method for s in out.skipped}

def test_casey_butt_runs_with_measurements():
    out = compute(_base(wrist={"value": 17, "unit": "cm"},
                        ankle={"value": 22, "unit": "cm"}))
    cb = next(r for r in out.results if r.method == "casey-butt")
    assert cb.value == pytest.approx(90.2, abs=0.2)

def test_female_raises_domain_error():
    with pytest.raises(DomainError):
        compute(_base(sex="female"))

def test_target_bf_changes_weight():
    lean = compute(_base(target_body_fat_pct=8))
    fat = compute(_base(target_body_fat_pct=20))
    lean_ffmi = next(r for r in lean.results if r.method == "ffmi-cap").value
    fat_ffmi = next(r for r in fat.results if r.method == "ffmi-cap").value
    assert fat_ffmi > lean_ffmi

def test_explicit_casey_missing_raises():
    with pytest.raises(DomainError):
        compute(_base(methods=["casey-butt"]))
