import pytest
from fastapi.testclient import TestClient
from api.main import build_app
import tools  # noqa: F401
from tools._registry import REGISTRY

client = TestClient(build_app())

def test_registry_not_empty():
    assert len(REGISTRY) >= 1

@pytest.mark.parametrize("tool_id", list(REGISTRY.keys()))
def test_tool_in_catalog(tool_id):
    ids = {t["id"] for t in client.get("/v1/tools").json()}
    assert tool_id in ids

@pytest.mark.parametrize("tool_id", list(REGISTRY.keys()))
def test_tool_schemas_valid(tool_id):
    tool = REGISTRY[tool_id]
    assert tool.input_model.model_json_schema()["type"] == "object"
    assert tool.output_model.model_json_schema()["type"] == "object"

@pytest.mark.parametrize("tool_id", list(REGISTRY.keys()))
def test_example_input_runs(tool_id):
    tool = REGISTRY[tool_id]
    assert tool.examples, f"{tool_id} has no examples"
    for ex in tool.examples:
        r = client.post(f"/v1/tools/{tool_id}", json=ex.input)
        assert r.status_code == 200, r.text
        # validate the response parses as the declared output model
        tool.output_model.model_validate(r.json())
