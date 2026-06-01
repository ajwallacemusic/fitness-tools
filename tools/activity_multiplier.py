from typing import Literal
from pydantic import BaseModel, Field
from fitness_core.common import ActivityLevel, Intensity, Occupation, activity_multiplier
from fitness_core.units import Mass
from fitness_core.activity import eat_kcal_per_day, neat_from_steps, neat_from_occupation
from fitness_core.errors import DomainError
from fitness_core.stats import compute_consensus
from tools._models import MethodResult, SkippedMethod, Consensus, Example
from tools._dispatch import run_methods
from tools._registry import Tool, register

ALL_METHODS = ["lookup", "neat-eat"]

_REASONS = {
    "lookup": "lookup: requires activity_level",
    "neat-eat": ("neat-eat: requires bmr, weight, sessions_per_week, session_minutes, "
                 "intensity, and steps_per_day or occupation"),
}


class ActivityMultiplierInput(BaseModel):
    activity_level: ActivityLevel | None = None
    bmr: float | None = Field(default=None, gt=0)
    weight: Mass | None = None
    sessions_per_week: int | None = Field(default=None, ge=0, le=21)
    session_minutes: float | None = Field(default=None, gt=0, le=600)
    intensity: Intensity | None = None
    steps_per_day: int | None = Field(default=None, ge=0, le=100000)
    occupation: Occupation | None = None
    methods: list[str] | Literal["all"] = "all"


class ActivityMultiplierOutput(BaseModel):
    results: list[MethodResult]
    consensus: Consensus | None
    skipped: list[SkippedMethod]


def _neat_eat(inp: ActivityMultiplierInput):
    if (inp.bmr is None or inp.weight is None or inp.sessions_per_week is None
            or inp.session_minutes is None or inp.intensity is None):
        return None
    if inp.steps_per_day is None and inp.occupation is None:
        return None
    eat = eat_kcal_per_day(inp.sessions_per_week, inp.session_minutes,
                           inp.intensity, inp.weight.kg)
    if inp.steps_per_day is not None:
        neat = neat_from_steps(inp.steps_per_day, inp.weight.kg)
        neat_source = "steps"
    else:
        neat = neat_from_occupation(inp.occupation, inp.bmr)
        neat_source = "occupation"
    tdee = inp.bmr + neat + eat
    detail = {"neat_kcal": round(neat), "eat_kcal": round(eat),
              "tdee_kcal": round(tdee), "neat_source": neat_source}
    return tdee / inp.bmr, detail


def compute(inp: ActivityMultiplierInput) -> ActivityMultiplierOutput:
    def run(method: str):
        if method == "lookup":
            if inp.activity_level is None:
                return None
            return activity_multiplier(inp.activity_level), None
        if method == "neat-eat":
            return _neat_eat(inp)
        raise DomainError(f"unknown method: {method}")

    requested = ALL_METHODS if inp.methods == "all" else inp.methods
    explicit = inp.methods != "all"
    results, skipped = run_methods(
        requested, explicit, run, "x",
        reason_fn=lambda m: _REASONS.get(m, f"{m}: required inputs missing"), ndigits=3)
    c = compute_consensus([r.value for r in results])
    return ActivityMultiplierOutput(
        results=results, consensus=Consensus(**c) if c else None, skipped=skipped)


TOOL = Tool(
    id="activity-multiplier",
    name="Activity Multiplier",
    description=("Estimate the TDEE activity multiplier via the classic lookup table "
                 "or a NEAT+EAT model (occupation/steps for non-exercise, training "
                 "volume for exercise)."),
    category="energy",
    tags=["activity", "tdee", "neat", "eat"],
    methods=ALL_METHODS,
    input_model=ActivityMultiplierInput,
    output_model=ActivityMultiplierOutput,
    compute=compute,
    examples=[Example(
        input={"activity_level": "moderate"},
        output={"results": [{"method": "lookup", "unit": "x"}]},
    )],
)
register(TOOL)
