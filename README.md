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

## Example
    curl -s -X POST localhost:8000/v1/tools/tdee \
      -H 'content-type: application/json' \
      -d '{"sex":"male","age":30,"height":{"value":180,"unit":"cm"},"weight":{"value":80,"unit":"kg"},"activity":"moderate"}'

## Tools (Phase 1)
- `tdee` — Mifflin / Harris / Katch / Cunningham
- `body-fat` — Navy / Jackson-Pollock 3-site / Deurenberg
- `one-rep-max` — Epley / Brzycki / Lombardi / Wathan / O'Conner / Mayhew
- `macros` — g-per-kg split

## Tools (Phase 2)
- `activity-multiplier` — lookup table / NEAT+EAT model, with consensus
- `powerlifting-attempts` — opener/second/third attempts + warmup ramp + per-side plate loads
- `muscle-potential` — Casey-Butt / FFMI-cap / Berkhan, with consensus

## Deploy (GCP Cloud Run, scale-to-zero)
    gcloud run deploy fitness-tools-api \
      --source . --region us-central1 \
      --allow-unauthenticated --min-instances 0

Tools are deterministic and stateless; natural-language input belongs in the
separate agent layer (sub-project 3).

## License
MIT — see [LICENSE](LICENSE). Built on published formulas (Mifflin-St Jeor, US Navy,
Jackson-Pollock, Epley, etc.); contributions welcome.
