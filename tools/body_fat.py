from typing import Literal
from pydantic import BaseModel, Field
from fitness_core.common import Sex
from fitness_core.units import Length, Mass
from fitness_core.bodyfat import navy_bf, jackson_pollock_3, deurenberg
from fitness_core.errors import DomainError
from fitness_core.stats import compute_consensus
from tools._models import MethodResult, SkippedMethod, Consensus, Example
from tools._dispatch import run_methods
from tools._registry import Tool, register

ALL_METHODS = ["navy", "jackson-pollock-3", "deurenberg"]

_REASONS = {
    "navy": "navy: requires neck, waist, height (+ hip for female)",
    "jackson-pollock-3": "jackson-pollock-3: requires skinfold_sum and age",
    "deurenberg": "deurenberg: requires weight, height, age",
}


class BodyFatInput(BaseModel):
    sex: Sex
    age: float | None = Field(default=None, gt=0, le=120)
    height: Length | None = None
    weight: Mass | None = None
    neck: Length | None = None
    waist: Length | None = None
    hip: Length | None = None
    skinfold_sum: float | None = Field(default=None, gt=0,
                                       description="sum of skinfolds (mm)")
    methods: list[str] | Literal["all"] = "all"


class BodyFatOutput(BaseModel):
    results: list[MethodResult]
    consensus: Consensus | None
    skipped: list[SkippedMethod]


def _detail(inp: BodyFatInput, bf: float) -> dict | None:
    if inp.weight is None:
        return None
    fat = round(inp.weight.kg * bf / 100, 2)
    return {"fat_mass_kg": fat, "lean_mass_kg": round(inp.weight.kg - fat, 2)}


def _bf_value(method: str, inp: BodyFatInput) -> float | None:
    if method == "navy":
        if inp.neck and inp.waist and inp.height:
            try:
                return navy_bf(inp.sex, inp.waist.cm, inp.neck.cm, inp.height.cm,
                               inp.hip.cm if inp.hip else None)
            except ValueError as e:
                raise DomainError(str(e))
        return None
    if method == "jackson-pollock-3":
        if inp.skinfold_sum is not None and inp.age is not None:
            return jackson_pollock_3(inp.sex, inp.skinfold_sum, inp.age)
        return None
    if method == "deurenberg":
        if inp.weight and inp.height and inp.age is not None:
            bmi = inp.weight.kg / (inp.height.cm / 100) ** 2
            return deurenberg(inp.sex, bmi, inp.age)
        return None
    raise DomainError(f"unknown method: {method}")


def compute(inp: BodyFatInput) -> BodyFatOutput:
    def run(method: str):
        bf = _bf_value(method, inp)
        if bf is None:
            return None
        return bf, _detail(inp, bf)

    requested = ALL_METHODS if inp.methods == "all" else inp.methods
    explicit = inp.methods != "all"
    results, skipped = run_methods(
        requested, explicit, run, "%", reason_fn=lambda m: _REASONS[m], ndigits=2)
    c = compute_consensus([r.value for r in results])
    return BodyFatOutput(
        results=results,
        consensus=Consensus(**c) if c else None,
        skipped=skipped,
    )


TOOL = Tool(
    id="body-fat",
    name="Body Fat Percentage",
    description=("Estimate body-fat % via US Navy circumference, Jackson-Pollock "
                 "3-site skinfold, and Deurenberg (BMI-based) methods."),
    category="composition",
    tags=["body fat", "composition", "navy", "skinfold"],
    methods=ALL_METHODS,
    input_model=BodyFatInput,
    output_model=BodyFatOutput,
    compute=compute,
    examples=[Example(
        input={"sex": "male", "neck": {"value": 40, "unit": "cm"},
               "waist": {"value": 90, "unit": "cm"},
               "height": {"value": 180, "unit": "cm"}},
        output={"results": [{"method": "navy", "unit": "%"}]},
    )],
)
register(TOOL)
