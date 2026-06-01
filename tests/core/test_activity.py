import pytest
from fitness_core.common import Intensity, Occupation
from fitness_core.activity import (
    eat_kcal_per_day, neat_from_steps, neat_from_occupation,
)

def test_eat_reference():
    assert eat_kcal_per_day(4, 60, Intensity.MODERATE, 80) == pytest.approx(288.0)

def test_neat_from_occupation_reference():
    assert neat_from_occupation(Occupation.DESK, 1780) == pytest.approx(267.0)

def test_neat_from_steps_reference():
    assert neat_from_steps(8000, 80) == pytest.approx(365.714, abs=0.01)

def test_intensity_met_scaling():
    assert eat_kcal_per_day(3, 45, Intensity.VIGOROUS, 70) > \
           eat_kcal_per_day(3, 45, Intensity.LIGHT, 70)
