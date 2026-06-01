import pytest
from fitness_core.macros import macros_g_per_kg

def test_g_per_kg_reference():
    m = macros_g_per_kg(calories=2500, kg=80, protein_g_per_kg=2.0, fat_g_per_kg=0.9)
    assert m["protein_g"] == pytest.approx(160.0)
    assert m["fat_g"] == pytest.approx(72.0)
    assert m["carb_g"] == pytest.approx(303.0)

def test_g_per_kg_negative_carbs_clamped_to_zero():
    m = macros_g_per_kg(calories=1000, kg=80, protein_g_per_kg=2.0, fat_g_per_kg=0.9)
    assert m["carb_g"] == 0.0
