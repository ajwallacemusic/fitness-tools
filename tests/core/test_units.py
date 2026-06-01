import pytest
from pydantic import ValidationError
from fitness_core.units import Mass, Length, MassUnit, LengthUnit

def test_mass_kg_identity():
    assert Mass(value=80, unit="kg").kg == 80

def test_mass_lb_to_kg():
    assert Mass(value=176.37, unit="lb").kg == pytest.approx(80.0, abs=0.01)

def test_length_cm_identity():
    assert Length(value=180, unit="cm").cm == 180

def test_length_in_to_cm():
    assert Length(value=70, unit="in").cm == pytest.approx(177.8, abs=0.01)

def test_length_mm_property():
    assert Length(value=12, unit="mm").mm == 12
    assert Length(value=1, unit="cm").mm == 10

def test_mass_default_unit_is_kg():
    assert Mass(value=70).unit == MassUnit.KG

def test_negative_value_rejected():
    with pytest.raises(ValidationError):
        Mass(value=-5, unit="kg")
