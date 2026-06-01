import pytest
from fitness_core.errors import DomainError
from tools.body_fat import BodyFatInput, compute

def test_navy_runs_with_circumferences():
    out = compute(BodyFatInput(
        sex="male",
        neck={"value": 40, "unit": "cm"},
        waist={"value": 90, "unit": "cm"},
        height={"value": 180, "unit": "cm"},
    ))
    navy = next(r for r in out.results if r.method == "navy")
    assert navy.value == pytest.approx(18.4, abs=0.2)
    assert navy.unit == "%"

def test_deurenberg_runs_with_weight_height_age():
    out = compute(BodyFatInput(
        sex="male", age=30,
        weight={"value": 80, "unit": "kg"},
        height={"value": 180, "unit": "cm"},
    ))
    d = next(r for r in out.results if r.method == "deurenberg")
    assert d.value == pytest.approx(20.3, abs=0.2)

def test_jp3_skipped_without_skinfolds():
    out = compute(BodyFatInput(
        sex="male", age=30,
        weight={"value": 80, "unit": "kg"},
        height={"value": 180, "unit": "cm"},
    ))
    assert "jackson-pollock-3" in {s.method for s in out.skipped}

def test_explicit_missing_method_raises():
    with pytest.raises(DomainError):
        compute(BodyFatInput(sex="male", methods=["jackson-pollock-3"]))

def test_detail_has_mass_when_weight_present():
    out = compute(BodyFatInput(
        sex="male", age=30,
        weight={"value": 80, "unit": "kg"},
        height={"value": 180, "unit": "cm"},
    ))
    d = next(r for r in out.results if r.method == "deurenberg")
    assert "fat_mass_kg" in d.detail and "lean_mass_kg" in d.detail

def test_invalid_measurements_raise_domain_error():
    # waist <= neck makes the Navy formula undefined -> DomainError, not a silent skip
    with pytest.raises(DomainError):
        compute(BodyFatInput(
            sex="male", methods=["navy"],
            neck={"value": 45, "unit": "cm"},
            waist={"value": 40, "unit": "cm"},
            height={"value": 180, "unit": "cm"},
        ))
