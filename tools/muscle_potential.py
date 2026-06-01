from typing import Literal
from pydantic import BaseModel, Field
from fitness_core.common import Sex
from fitness_core.units import Length
from fitness_core.potential import (
    casey_butt_ffm_kg, ffmi_cap_ffm_kg, berkhan_ffm_kg, weight_at_bf,
)
from fitness_core.errors import DomainError
from fitness_core.stats import compute_consensus
from tools._models import MethodResult, SkippedMethod, Consensus, Example
from tools._dispatch import run_methods
from tools._registry import Tool, register

ALL_METHODS = ["casey-butt", "ffmi-cap", "berkhan"]
_REASONS = {
    "casey-butt": "casey-butt: requires wrist and ankle",
    "ffmi-cap": "ffmi-cap: requires height",
    "berkhan": "berkhan: requires height",
}


class MusclePotentialInput(BaseModel):
    sex: Sex
    height: Length
    wrist: Length | None = None
    ankle: Length | None = None
    target_body_fat_pct: float = Field(default=10, ge=3, le=40)
    methods: list[str] | Literal["all"] = "all"


class MusclePotentialOutput(BaseModel):
    results: list[MethodResult]
    consensus: Consensus | None
    skipped: list[SkippedMethod]


def compute(inp: MusclePotentialInput) -> MusclePotentialOutput:
    if inp.sex != Sex.MALE:
        raise DomainError("muscle-potential formulas are validated for men only in v1")
    bf = inp.target_body_fat_pct

    def run(method: str):
        if method == "casey-butt":
            if inp.wrist is None or inp.ankle is None:
                return None
            ffm = casey_butt_ffm_kg(inp.height.cm, inp.wrist.cm, inp.ankle.cm, bf)
        elif method == "ffmi-cap":
            ffm = ffmi_cap_ffm_kg(inp.height.cm)
        elif method == "berkhan":
            ffm = berkhan_ffm_kg(inp.height.cm)
        else:
            raise DomainError(f"unknown method: {method}")
        return weight_at_bf(ffm, bf), {"max_ffm_kg": round(ffm, 1), "target_bf_pct": bf}

    requested = ALL_METHODS if inp.methods == "all" else inp.methods
    explicit = inp.methods != "all"
    results, skipped = run_methods(
        requested, explicit, run, "kg",
        reason_fn=lambda m: _REASONS.get(m, f"{m}: required inputs missing"), ndigits=1)
    c = compute_consensus([r.value for r in results])
    return MusclePotentialOutput(
        results=results, consensus=Consensus(**c) if c else None, skipped=skipped)


TOOL = Tool(
    id="muscle-potential",
    name="Maximum Muscular Potential",
    description=("Estimate drug-free maximum bodyweight at a target body-fat % via "
                 "Casey Butt (wrist+ankle), the FFMI~25 natural cap, and Berkhan's "
                 "max-contest-weight model. Men only in v1."),
    category="composition",
    tags=["muscle", "potential", "ffmi", "natural"],
    methods=ALL_METHODS,
    input_model=MusclePotentialInput,
    output_model=MusclePotentialOutput,
    compute=compute,
    examples=[Example(
        input={"sex": "male", "height": {"value": 180, "unit": "cm"}},
        output={"results": [{"method": "ffmi-cap", "unit": "kg"}]},
    )],
)
register(TOOL)
