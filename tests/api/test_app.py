import pytest
from fastapi.testclient import TestClient
from api.main import build_app

@pytest.fixture
def client():
    return TestClient(build_app())

def test_healthz(client):
    assert client.get("/healthz").json() == {"status": "ok"}

def test_catalog_lists_tdee(client):
    body = client.get("/v1/tools").json()
    ids = {t["id"] for t in body}
    assert "tdee" in ids
    tdee = next(t for t in body if t["id"] == "tdee")
    assert "input_schema" in tdee and "output_schema" in tdee
    assert tdee["methods"] == ["mifflin", "harris", "katch", "cunningham"]

def test_catalog_single_tool(client):
    assert client.get("/v1/tools/tdee").json()["id"] == "tdee"

def test_catalog_unknown_tool_404_envelope(client):
    r = client.get("/v1/tools/nope")
    assert r.status_code == 404
    assert r.json()["error"]["type"] == "not_found"

def test_run_tdee(client):
    r = client.post("/v1/tools/tdee", json={
        "sex": "male", "age": 30,
        "height": {"value": 180, "unit": "cm"},
        "weight": {"value": 80, "unit": "kg"},
        "activity": "moderate",
    })
    assert r.status_code == 200
    mifflin = next(x for x in r.json()["results"] if x["method"] == "mifflin")
    assert mifflin["value"] == pytest.approx(2759.0, abs=0.01)

def test_run_tdee_validation_error_envelope(client):
    r = client.post("/v1/tools/tdee", json={"sex": "male"})
    assert r.status_code == 422
    assert r.json()["error"]["type"] == "validation_error"

def test_run_tdee_domain_error_envelope(client):
    r = client.post("/v1/tools/tdee", json={
        "sex": "male", "age": 30,
        "height": {"value": 180, "unit": "cm"},
        "weight": {"value": 80, "unit": "kg"},
        "activity": "moderate", "methods": ["katch"],
    })
    assert r.status_code == 400
    assert r.json()["error"]["type"] == "domain_error"


def test_unhandled_exception_envelope():
    from fastapi import FastAPI
    from api.errors import install_error_handlers
    app = FastAPI()
    install_error_handlers(app)

    @app.get("/boom")
    def boom():
        raise RuntimeError("kaboom")

    c = TestClient(app, raise_server_exceptions=False)
    r = c.get("/boom")
    assert r.status_code == 500
    assert r.json()["error"]["type"] == "internal_error"


def test_tool_route_has_clean_operation_id(client):
    schema = client.get("/openapi.json").json()
    op = schema["paths"]["/v1/tools/tdee"]["post"]["operationId"]
    assert op == "run_tdee"


def test_catalog_route_has_clean_operation_id(client):
    schema = client.get("/openapi.json").json()
    assert schema["paths"]["/v1/tools"]["get"]["operationId"] == "list_tools"
