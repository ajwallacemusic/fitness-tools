import pytest
from fitness_core.stats import compute_consensus

def test_consensus_basic():
    c = compute_consensus([10.0, 20.0, 30.0])
    assert c["mean"] == pytest.approx(20.0)
    assert c["median"] == pytest.approx(20.0)
    assert c["min"] == 10.0
    assert c["max"] == 30.0
    assert c["n"] == 3

def test_consensus_even_count_median():
    c = compute_consensus([10.0, 20.0, 30.0, 40.0])
    assert c["median"] == pytest.approx(25.0)

def test_consensus_empty_returns_none():
    assert compute_consensus([]) is None
