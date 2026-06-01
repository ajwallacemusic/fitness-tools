import pytest
from fitness_core.common import Sex
from fitness_core.energy import (
    mifflin_bmr, harris_bmr, katch_bmr, cunningham_bmr, lbm_from_bodyfat,
)

def test_mifflin_male_reference():
    assert mifflin_bmr(Sex.MALE, kg=80, cm=180, age=30) == pytest.approx(1780.0)

def test_mifflin_female_reference():
    # 10*80 + 6.25*180 - 5*30 - 161 = 1614
    assert mifflin_bmr(Sex.FEMALE, kg=80, cm=180, age=30) == pytest.approx(1614.0)

def test_harris_male_reference():
    assert harris_bmr(Sex.MALE, kg=80, cm=180, age=30) == pytest.approx(1853.632, abs=0.01)

def test_katch_reference():
    assert katch_bmr(lbm_kg=68) == pytest.approx(1838.8)

def test_cunningham_reference():
    assert cunningham_bmr(lbm_kg=68) == pytest.approx(1996.0)

def test_lbm_from_bodyfat():
    assert lbm_from_bodyfat(kg=80, body_fat_pct=15) == pytest.approx(68.0)
