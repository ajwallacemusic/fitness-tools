from pydantic import BaseModel, Field
from fitness_core.common import Aggressiveness
from fitness_core.units import Mass, MassUnit, LB_TO_KG
from fitness_core.plates import nearest_loadable, warmup_ramp
from tools._models import Example
from tools._registry import Tool, register

ATTEMPT_PCTS = {
    Aggressiveness.CONSERVATIVE: (0.88, 0.93, 0.98),
    Aggressiveness.STANDARD: (0.90, 0.95, 1.01),
    Aggressiveness.AGGRESSIVE: (0.91, 0.97, 1.03),
}
DEFAULT_PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25]
DEFAULT_PLATES_LB = [45, 35, 25, 10, 5, 2.5]


class PowerliftingAttemptsInput(BaseModel):
    one_rep_max: Mass
    bar_weight: Mass | None = None
    available_plates: list[float] | None = Field(
        default=None,
        description="Plate denominations per side, in the same unit as one_rep_max.")
    aggressiveness: Aggressiveness = Aggressiveness.STANDARD


class PlateLoad(BaseModel):
    weight: float
    plates_per_side: list[float]


class WarmupSet(BaseModel):
    weight: float
    reps: int
    plates_per_side: list[float]


class Attempts(BaseModel):
    opener: PlateLoad
    second: PlateLoad
    third: PlateLoad


class PowerliftingAttemptsOutput(BaseModel):
    attempts: Attempts
    warmups: list[WarmupSet]
    bar_weight: float
    unit: MassUnit
    aggressiveness: Aggressiveness


def _mass_in_unit(m: Mass, unit: MassUnit) -> float:
    if m.unit == unit:
        return m.value
    return m.kg if unit == MassUnit.KG else m.kg / LB_TO_KG


def compute(inp: PowerliftingAttemptsInput) -> PowerliftingAttemptsOutput:
    unit = inp.one_rep_max.unit
    orm = inp.one_rep_max.value
    bar = _mass_in_unit(inp.bar_weight, unit) if inp.bar_weight is not None else (
        20.0 if unit == MassUnit.KG else 45.0)
    plates = inp.available_plates if inp.available_plates is not None else (
        DEFAULT_PLATES_KG if unit == MassUnit.KG else DEFAULT_PLATES_LB)
    p_open, p_second, p_third = ATTEMPT_PCTS[inp.aggressiveness]

    def load(pct: float) -> PlateLoad:
        w, ps = nearest_loadable(orm * pct, bar, plates)
        return PlateLoad(weight=w, plates_per_side=ps)

    opener = load(p_open)
    attempts = Attempts(opener=opener, second=load(p_second), third=load(p_third))
    warmups = [WarmupSet(weight=w, reps=r, plates_per_side=ps)
               for (w, r, ps) in warmup_ramp(opener.weight, bar, plates)]
    return PowerliftingAttemptsOutput(
        attempts=attempts, warmups=warmups, bar_weight=bar,
        unit=unit, aggressiveness=inp.aggressiveness)


TOOL = Tool(
    id="powerlifting-attempts",
    name="Powerlifting Meet Attempts",
    description=("Deterministic opener/second/third attempts from an estimated 1RM, "
                 "plus a warmup ramp and per-side plate loading. Tunable by "
                 "aggressiveness and available plates."),
    category="strength",
    tags=["powerlifting", "meet", "attempts", "warmup", "plates"],
    methods=["standard"],
    input_model=PowerliftingAttemptsInput,
    output_model=PowerliftingAttemptsOutput,
    compute=compute,
    examples=[Example(
        input={"one_rep_max": {"value": 200, "unit": "kg"}},
        output={"attempts": {"opener": {"weight": 180}}},
    )],
)
register(TOOL)
