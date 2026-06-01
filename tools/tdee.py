from typing import Literal
from pydantic import BaseModel, Field
from fitness_core.common import Sex, ActivityLevel, activity_multiplier
from fitness_core.units import Length, Mass
from fitness_core.energy import (
    mifflin_bmr, harris_bmr, katch_bmr, cunningham_bmr, lbm_from_bodyfat,
)
from fitness_core.errors import DomainError
from fitness_core.stats import compute_consensus
from tools._models import MethodResult, SkippedMethod, Consensus, Example
from tools._registry import Tool, register

ALL_METHODS = ["mifflin", "harris", "katch", "cunningham"]


class TdeeInput(BaseModel):
    sex: Sex
    age: float = Field(gt=0, le=120)
    height: Length
    weight: Mass
    activity: ActivityLevel | float
    body_fat: float | None = Field(default=None, ge=2, le=70)
    lean_mass: Mass | None = None
    methods: list[str] | Literal["all"] = "all"


class TdeeOutput(BaseModel):
    results: list[MethodResult]
    consensus: Consensus | None
    skipped: list[SkippedMethod]


def _lbm(inp: TdeeInput) -> float | None:
    if inp.lean_mass is not None:
        return inp.lean_mass.kg
    if inp.body_fat is not None:
        return lbm_from_bodyfat(inp.weight.kg, inp.body_fat)
    return None


def compute(inp: TdeeInput) -> TdeeOutput:
    mult = activity_multiplier(inp.activity)
    kg, cm = inp.weight.kg, inp.height.cm
    lbm = _lbm(inp)

    def bmr_for(method: str) -> float | None:
        if method == "mifflin":
            return mifflin_bmr(inp.sex, kg, cm, inp.age)
        if method == "harris":
            return harris_bmr(inp.sex, kg, cm, inp.age)
        if method == "katch":
            return katch_bmr(lbm) if lbm is not None else None
        if method == "cunningham":
            return cunningham_bmr(lbm) if lbm is not None else None
        raise DomainError(f"unknown method: {method}")

    requested = ALL_METHODS if inp.methods == "all" else inp.methods
    explicit = inp.methods != "all"

    results: list[MethodResult] = []
    skipped: list[SkippedMethod] = []
    for m in requested:
        if m not in ALL_METHODS:
            raise DomainError(f"unknown method: {m}")
        bmr = bmr_for(m)
        if bmr is None:
            reason = f"{m}: requires body_fat or lean_mass"
            if explicit:
                raise DomainError(reason)
            skipped.append(SkippedMethod(method=m, reason=reason))
            continue
        results.append(MethodResult(
            method=m, value=round(bmr * mult, 1), unit="kcal/day",
            detail={"bmr": round(bmr, 1), "multiplier": mult},
        ))

    c = compute_consensus([r.value for r in results])
    return TdeeOutput(
        results=results,
        consensus=Consensus(**c) if c else None,
        skipped=skipped,
    )


TOOL = Tool(
    id="tdee",
    name="Total Daily Energy Expenditure",
    description=("Estimate BMR and TDEE via Mifflin-St Jeor, Harris-Benedict, "
                 "Katch-McArdle, and Cunningham. Provide body_fat or lean_mass to "
                 "unlock the LBM-based methods."),
    category="energy",
    tags=["tdee", "bmr", "calories", "maintenance"],
    methods=ALL_METHODS,
    input_model=TdeeInput,
    output_model=TdeeOutput,
    compute=compute,
    examples=[Example(
        input={"sex": "male", "age": 30, "height": {"value": 180, "unit": "cm"},
               "weight": {"value": 80, "unit": "kg"}, "activity": "moderate"},
        output={"consensus": {"n": 2}},
    )],
)
register(TOOL)
