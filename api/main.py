from fastapi import FastAPI
import tools  # noqa: F401  triggers tool self-registration
from tools._registry import REGISTRY, Tool
from api.errors import install_error_handlers
from api.catalog import build_catalog_router


def _add_tool_route(app: FastAPI, tool: Tool) -> None:
    def make_endpoint(t: Tool):
        async def endpoint(payload: t.input_model):  # type: ignore[name-defined]
            return t.compute(payload)
        endpoint.__annotations__ = {"payload": t.input_model, "return": t.output_model}
        return endpoint

    app.add_api_route(
        f"/v1/tools/{tool.id}",
        make_endpoint(tool),
        methods=["POST"],
        response_model=tool.output_model,
        name=tool.id,
        operation_id=f"run_{tool.id.replace('-', '_')}",
        summary=tool.name,
        description=tool.description,
        tags=[tool.category],
    )


def build_app() -> FastAPI:
    app = FastAPI(title="Fitness Tools API", version="0.1.0")
    install_error_handlers(app)

    @app.get("/healthz", tags=["meta"])
    def healthz():
        return {"status": "ok"}

    # catalog routes first, then a POST route per registered tool
    app.include_router(build_catalog_router())
    for tool in REGISTRY.values():
        _add_tool_route(app, tool)
    return app


app = build_app()
