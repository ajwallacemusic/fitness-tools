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

def test_navy_female_happy_path():
    out = compute(BodyFatInput(
        sex="female",
        neck={"value": 33, "unit": "cm"},
        waist={"value": 80, "unit": "cm"},
        hip={"value": 95, "unit": "cm"},
        height={"value": 165, "unit": "cm"},
    ))
    navy = next(r for r in out.results if r.method == "navy")
    assert navy.value == pytest.approx(29.4, abs=0.3)

def test_navy_female_without_hip_skipped_in_all_mode():
    out = compute(BodyFatInput(
        sex="female",
        neck={"value": 33, "unit": "cm"},
        waist={"value": 80, "unit": "cm"},
        height={"value": 165, "unit": "cm"},
    ))
    assert "navy" in {s.method for s in out.skipped}
    assert all(r.method != "navy" for r in out.results)

def test_navy_female_without_hip_explicit_raises():
    with pytest.raises(DomainError):
        compute(BodyFatInput(
            sex="female", methods=["navy"],
            neck={"value": 33, "unit": "cm"},
            waist={"value": 80, "unit": "cm"},
            height={"value": 165, "unit": "cm"},
        ))

def test_jp3_happy_path():
    out = compute(BodyFatInput(sex="male", age=30, skinfold_sum=60))
    jp3 = next(r for r in out.results if r.method == "jackson-pollock-3")
    assert jp3.value == pytest.approx(18.0, abs=0.2)

def test_consensus_across_three_methods():
    out = compute(BodyFatInput(
        sex="male", age=30,
        weight={"value": 80, "unit": "kg"},
        height={"value": 180, "unit": "cm"},
        neck={"value": 40, "unit": "cm"},
        waist={"value": 90, "unit": "cm"},
        skinfold_sum=60,
    ))
    assert len(out.results) == 3
    assert out.consensus is not None and out.consensus.n == 3
