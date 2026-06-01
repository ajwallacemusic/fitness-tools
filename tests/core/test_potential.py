import pytest
from fitness_core.potential import (
    casey_butt_ffm_kg, ffmi_cap_ffm_kg, berkhan_ffm_kg, weight_at_bf,
)

def test_ffmi_cap_reference():
    assert ffmi_cap_ffm_kg(180) == pytest.approx(81.0)

def test_berkhan_reference():
    assert berkhan_ffm_kg(180) == pytest.approx(75.6)

def test_casey_butt_reference():
    assert casey_butt_ffm_kg(180, 17, 22, 10) == pytest.approx(81.17, abs=0.05)

def test_weight_at_bf():
    assert weight_at_bf(81.0, 10) == pytest.approx(90.0)
    assert weight_at_bf(75.6, 10) == pytest.approx(84.0)
