from typing import Literal
from pydantic import BaseModel, Field
from fitness_core.units import Mass
from fitness_core.strength import one_rep_max, percent_table, ORM_METHODS
from fitness_core.errors import DomainError
from fitness_core.stats import compute_consensus
from tools._models import MethodResult, Consensus, Example
from tools._dispatch import run_methods
from tools._registry import Tool, register


class OneRepMaxInput(BaseModel):
    weight: Mass
    reps: int = Field(gt=0, le=20)
    methods: list[str] | Literal["all"] = "all"


class OneRepMaxOutput(BaseModel):
    results: list[MethodResult]
    consensus: Consensus | None
    percent_table: list[dict]


def compute(inp: OneRepMaxInput) -> OneRepMaxOutput:
    w = inp.weight.value      # report in the unit the user supplied
    unit = inp.weight.unit.value

    def run(method: str):
        if method not in ORM_METHODS:
            raise DomainError(f"unknown method: {method}")
        return one_rep_max(method, w, inp.reps), None

    requested = ORM_METHODS if inp.methods == "all" else inp.methods
    explicit = inp.methods != "all"
    results, _ = run_methods(requested, explicit, run, unit, ndigits=1)
    c = compute_consensus([r.value for r in results])
    table = percent_table(c["mean"]) if c else []
    return OneRepMaxOutput(
        results=results,
        consensus=Consensus(**c) if c else None,
        percent_table=table,
    )


TOOL = Tool(
    id="one-rep-max",
    name="One-Rep Max",
    description=("Estimate 1RM from a submaximal set via Epley, Brzycki, Lombardi, "
                 "Wathan, O'Conner, and Mayhew; returns a %1RM load chart."),
    category="strength",
    tags=["1rm", "strength", "powerlifting"],
    methods=ORM_METHODS,
    input_model=OneRepMaxInput,
    output_model=OneRepMaxOutput,
    compute=compute,
    examples=[Example(
        input={"weight": {"value": 100, "unit": "kg"}, "reps": 5},
        output={"results": [{"method": "epley", "unit": "kg"}]},
    )],
)
register(TOOL)
