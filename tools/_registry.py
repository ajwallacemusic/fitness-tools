from dataclasses import dataclass
from typing import Callable, Generic, TypeVar
from pydantic import BaseModel
from tools._models import Example

In = TypeVar("In", bound=BaseModel)
Out = TypeVar("Out", bound=BaseModel)


@dataclass
class Tool(Generic[In, Out]):
    id: str
    name: str
    description: str
    category: str
    tags: list[str]
    methods: list[str]
    input_model: type[In]
    output_model: type[Out]
    compute: Callable[[In], Out]
    examples: list[Example]


REGISTRY: dict[str, Tool] = {}


def register(tool: Tool) -> Tool:
    if tool.id in REGISTRY:
        raise ValueError(f"duplicate tool id: {tool.id}")
    REGISTRY[tool.id] = tool
    return tool
