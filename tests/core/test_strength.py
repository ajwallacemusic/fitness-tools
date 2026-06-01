import pytest
from fitness_core.strength import one_rep_max, ORM_METHODS

def test_epley_reference():
    assert one_rep_max("epley", 100, 5) == pytest.approx(116.6667, abs=0.001)

def test_brzycki_reference():
    assert one_rep_max("brzycki", 100, 5) == pytest.approx(112.5, abs=0.001)

def test_oconner_reference():
    assert one_rep_max("oconner", 100, 5) == pytest.approx(112.5, abs=0.001)

def test_one_rep_max_at_one_rep_returns_weight():
    # Epley and O'Conner only equal w exactly at r adjustments; check Brzycki at r=1
    assert one_rep_max("brzycki", 100, 1) == pytest.approx(100.0, abs=0.001)

def test_all_methods_defined():
    for m in ORM_METHODS:
        assert one_rep_max(m, 100, 5) > 100
