# Fitness Tools API

Composable, self-describing, deterministic fitness calculators over HTTP.

## Run locally
    uv sync
    uv run uvicorn api.main:app --reload --port 8000
    open http://localhost:8000/docs

## Discover tools
- `GET /v1/tools` — machine-readable catalog (schemas + examples)
- `GET /v1/tools/{id}` — one tool
- `POST /v1/tools/{id}` — run a tool

## Tools (Phase 1)
- `tdee` — Mifflin / Harris / Katch / Cunningham
- `body-fat` — Navy / Jackson-Pollock 3-site / Deurenberg
- `one-rep-max` — Epley / Brzycki / Lombardi / Wathan / O'Conner / Mayhew
- `macros` — g-per-kg split

## Deploy (GCP Cloud Run, scale-to-zero)
    gcloud run deploy fitness-tools-api \
      --source . --region us-central1 \
      --allow-unauthenticated --min-instances 0

Tools are deterministic and stateless; natural-language input belongs in the
separate agent layer (sub-project 3).

## License
MIT — see [LICENSE](LICENSE). Built on published formulas (Mifflin-St Jeor, US Navy,
Jackson-Pollock, Epley, etc.); contributions welcome.
