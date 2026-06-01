from typing import Literal
from pydantic import BaseModel, Field
from fitness_core.common import Goal
from fitness_core.units import Mass
from fitness_core.macros import macros_g_per_kg
from fitness_core.errors import DomainError
from tools._models import MethodResult, Consensus, Example
from tools._dispatch import run_methods
from tools._registry import Tool, register

ALL_METHODS = ["g-per-kg"]
_PROTEIN_DEFAULT = {Goal.CUT: 2.2, Goal.MAINTAIN: 2.0, Goal.BULK: 1.8}


class MacrosInput(BaseModel):
    calories: float = Field(gt=0)
    weight: Mass
    goal: Goal = Goal.MAINTAIN
    protein_g_per_kg: float | None = Field(default=None, gt=0, le=4)
    fat_g_per_kg: float | None = Field(default=None, gt=0, le=3)
    methods: list[str] | Literal["all"] = "all"


class MacrosOutput(BaseModel):
    results: list[MethodResult]
    consensus: Consensus | None


def compute(inp: MacrosInput) -> MacrosOutput:
    def run(method: str):
        if method != "g-per-kg":
            raise DomainError(f"unknown method: {method}")
        protein = inp.protein_g_per_kg or _PROTEIN_DEFAULT[inp.goal]
        fat = inp.fat_g_per_kg or 0.9
        split = macros_g_per_kg(inp.calories, inp.weight.kg, protein, fat)
        # value == detail["calories"]: recomputed kcal total (may exceed inp.calories
        # if protein+fat already exceed budget and carbs clamp to 0)
        return split["calories"], split

    requested = ALL_METHODS if inp.methods == "all" else inp.methods
    explicit = inp.methods != "all"
    results, _ = run_methods(requested, explicit, run, "kcal", ndigits=0)
    # single method in Phase 1 -> a calorie consensus is not meaningful
    return MacrosOutput(results=results, consensus=None)


TOOL = Tool(
    id="macros",
    name="Macronutrient Split",
    description=("Compute protein/fat/carb grams for a calorie target using the "
                 "g-per-kg-bodyweight method, with goal-based protein defaults."),
    category="nutrition",
    tags=["macros", "protein", "nutrition", "diet"],
    methods=ALL_METHODS,
    input_model=MacrosInput,
    output_model=MacrosOutput,
    compute=compute,
    examples=[Example(
        input={"calories": 2500, "weight": {"value": 80, "unit": "kg"},
               "goal": "maintain"},
        output={"results": [{"method": "g-per-kg", "unit": "kcal"}]},
    )],
)
register(TOOL)
