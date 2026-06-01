import pytest
from fitness_core.errors import DomainError
from tools._dispatch import run_methods

def test_runs_and_rounds():
    res, sk = run_methods(["a", "b"], False, lambda m: (10.126, {"k": m}), "u", ndigits=2)
    assert [r.value for r in res] == [10.13, 10.13]
    assert res[0].unit == "u" and res[0].detail == {"k": "a"}
    assert sk == []

def test_skip_under_all():
    res, sk = run_methods(["a", "b"], False, lambda m: None if m == "b" else (5.0, None), "u")
    assert [r.method for r in res] == ["a"]
    assert [s.method for s in sk] == ["b"]

def test_explicit_missing_raises():
    with pytest.raises(DomainError):
        run_methods(["b"], True, lambda m: None, "u")

def test_dedupe():
    res, sk = run_methods(["a", "a"], False, lambda m: (1.0, None), "u")
    assert len(res) == 1

def test_custom_reason():
    res, sk = run_methods(["x"], False, lambda m: None, "u", reason_fn=lambda m: f"{m}: nope")
    assert sk[0].reason == "x: nope"
