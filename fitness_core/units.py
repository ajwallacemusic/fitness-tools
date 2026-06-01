"""Typed physical quantities with explicit units, converted to canonical metric.

Canonical units: mass -> kg, length -> cm (also exposes mm).
"""
from enum import Enum
from pydantic import BaseModel, Field

LB_TO_KG = 0.45359237
IN_TO_CM = 2.54


class MassUnit(str, Enum):
    KG = "kg"
    LB = "lb"


class LengthUnit(str, Enum):
    CM = "cm"
    IN = "in"
    MM = "mm"


class Mass(BaseModel):
    value: float = Field(gt=0)
    unit: MassUnit = MassUnit.KG

    @property
    def kg(self) -> float:
        return self.value * LB_TO_KG if self.unit == MassUnit.LB else self.value


class Length(BaseModel):
    value: float = Field(gt=0)
    unit: LengthUnit = LengthUnit.CM

    @property
    def cm(self) -> float:
        if self.unit == LengthUnit.IN:
            return self.value * IN_TO_CM
        if self.unit == LengthUnit.MM:
            return self.value / 10.0
        return self.value

    @property
    def mm(self) -> float:
        return self.cm * 10.0
