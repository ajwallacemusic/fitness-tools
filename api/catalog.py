from fastapi import APIRouter, HTTPException
from tools._registry import Tool, REGISTRY


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

    @router.get("")
    def list_tools():
        return [_to_catalog(t) for t in REGISTRY.values()]

    @router.get("/{tool_id}")
    def get_tool(tool_id: str):
        tool = REGISTRY.get(tool_id)
        if tool is None:
            raise HTTPException(status_code=404, detail=f"unknown tool: {tool_id}")
        return _to_catalog(tool)

    return router
