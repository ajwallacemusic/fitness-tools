import pytest
from fitness_core.errors import DomainError
from tools.macros import MacrosInput, compute

def test_g_per_kg_default_maintain():
    out = compute(MacrosInput(calories=2500, weight={"value": 80, "unit": "kg"},
                              goal="maintain"))
    r = next(x for x in out.results if x.method == "g-per-kg")
    assert r.detail["protein_g"] == pytest.approx(160.0)   # 2.0 g/kg * 80
    assert r.detail["carb_g"] == pytest.approx(303.0)
    assert r.unit == "kcal"
    assert r.value == pytest.approx(2500.0)   # carbs fill to the calorie budget exactly

def test_cut_uses_higher_protein():
    out = compute(MacrosInput(calories=2000, weight={"value": 80, "unit": "kg"},
                              goal="cut"))
    r = next(x for x in out.results if x.method == "g-per-kg")
    assert r.detail["protein_g"] == pytest.approx(176.0)   # 2.2 g/kg * 80

def test_overrides_respected():
    out = compute(MacrosInput(calories=2500, weight={"value": 80, "unit": "kg"},
                              goal="maintain", protein_g_per_kg=1.6, fat_g_per_kg=1.0))
    r = next(x for x in out.results if x.method == "g-per-kg")
    assert r.detail["protein_g"] == pytest.approx(128.0)
    assert r.detail["fat_g"] == pytest.approx(80.0)

def test_bulk_uses_lower_protein():
    out = compute(MacrosInput(calories=3000, weight={"value": 80, "unit": "kg"},
                              goal="bulk"))
    r = next(x for x in out.results if x.method == "g-per-kg")
    assert r.detail["protein_g"] == pytest.approx(144.0)   # 1.8 g/kg * 80
    assert r.value == pytest.approx(3000.0)

def test_unknown_method_raises():
    with pytest.raises(DomainError):
        compute(MacrosInput(calories=2500, weight={"value": 80, "unit": "kg"},
                            methods=["bogus"]))
