import pytest
from fitness_core.errors import DomainError
from tools.one_rep_max import OneRepMaxInput, OneRepMaxOutput, compute

def test_all_methods_run():
    out = compute(OneRepMaxInput(weight={"value": 100, "unit": "kg"}, reps=5))
    assert len(out.results) == 6

def test_epley_value():
    out = compute(OneRepMaxInput(weight={"value": 100, "unit": "kg"}, reps=5))
    epley = next(r for r in out.results if r.method == "epley")
    assert epley.value == pytest.approx(116.7, abs=0.1)
    assert epley.unit == "kg"

def test_percent_table_present():
    out = compute(OneRepMaxInput(weight={"value": 100, "unit": "kg"}, reps=5))
    assert out.percent_table and out.percent_table[0]["percent"] == 50

def test_explicit_subset():
    out = compute(OneRepMaxInput(weight={"value": 100, "unit": "kg"}, reps=5,
                                 methods=["epley", "brzycki"]))
    assert {r.method for r in out.results} == {"epley", "brzycki"}

def test_unknown_method_raises():
    with pytest.raises(DomainError):
        compute(OneRepMaxInput(weight={"value": 100, "unit": "kg"}, reps=5,
                               methods=["bogus"]))

def test_reports_in_user_unit():
    out = compute(OneRepMaxInput(weight={"value": 225, "unit": "lb"}, reps=3))
    assert all(r.unit == "lb" for r in out.results)
