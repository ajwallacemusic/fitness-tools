from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from tools._registry import Tool, REGISTRY


class CatalogEntry(BaseModel):
    id: str
    name: str
    description: str
    category: str
    tags: list[str]
    methods: list[str]
    input_schema: dict
    output_schema: dict
    examples: list[dict]


def _to_catalog(tool: Tool) -> dict:
    return {
        "id": tool.id,
        "name": tool.name,
        "description": tool.description,
        "category": tool.category,
        "tags": tool.tags,
        "methods": tool.methods,
        "input_schema": tool.input_model.model_json_schema(),
        "output_schema": tool.output_model.model_json_schema(),
        "examples": [e.model_dump() for e in tool.examples],
    }


def build_catalog_router() -> APIRouter:
    router = APIRouter(prefix="/v1/tools", tags=["catalog"])

    @router.get("", response_model=list[CatalogEntry], operation_id="list_tools",
                summary="List all tools")
    def list_tools():
        return [_to_catalog(t) for t in REGISTRY.values()]

    @router.get("/{tool_id}", response_model=CatalogEntry, operation_id="get_tool",
                summary="Get one tool")
    def get_tool(tool_id: str):
        tool = REGISTRY.get(tool_id)
        if tool is None:
            raise HTTPException(status_code=404, detail=f"unknown tool: {tool_id}")
        return _to_catalog(tool)

    return router
