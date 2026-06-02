# @fitness-tools/api

A **reference HTTP server** over [`@fitness-tools/core`](../../packages/core). It does
nothing on its own — it only produces value once you **run or host it**. It re-exposes the
same calculators over HTTP (identical math, identical results) for clients that can't
`npm install` a TypeScript package: other languages, `curl`, no-code tools, a remote
frontend, an agent.

> **Writing JS/TS?** You almost certainly want the library —
> [`@fitness-tools/core`](../../packages/core) — instead. It runs in-process with no server,
> no network, and no hosting. Reach for this server only when you need the calculators over
> HTTP from a non-JS or remote client.

## Run it locally

```bash
pnpm install
pnpm -C packages/core build      # the server imports the core's built dist/
pnpm -C apps/api dev             # http://localhost:8080  (hot reload)
```

Or with Docker:

```bash
docker build -f apps/api/Dockerfile -t fitness-tools-api .
docker run --rm -p 8080:8080 fitness-tools-api
```

## Routes

| Method & path | Purpose |
|---|---|
| `GET /healthz` | Liveness probe → `{ "status": "ok" }` |
| `GET /v1/tools` | Machine-readable catalog (per-tool JSON Schema + examples) |
| `GET /v1/tools/{id}` | One tool's catalog entry |
| `POST /v1/tools/{id}` | Run a tool (validated input → results) |
| `GET /openapi.json` | OpenAPI 3.0.3 spec (generated from the registry) |
| `GET /docs` | Browsable API reference (Scalar) |

```bash
curl -s localhost:8080/v1/tools/tdee \
  -X POST -H 'content-type: application/json' \
  -d '{"sex":"male","age":30,"height":{"value":180,"unit":"cm"},"weight":{"value":80,"unit":"kg"},"activity":"moderate"}'
```

A run returns each method's result plus a consensus; methods whose inputs are missing
appear under `skipped` (here, the LBM-based methods without `body_fat`/`lean_mass`):

```json
{
  "results": [
    { "method": "mifflin", "value": 2759, "unit": "kcal/day", "detail": { "bmr": 1780, "multiplier": 1.55 } },
    { "method": "harris", "value": 2873.1, "unit": "kcal/day", "detail": { "bmr": 1853.6, "multiplier": 1.55 } }
  ],
  "consensus": { "mean": 2816.05, "median": 2816.05, "min": 2759, "max": 2873.1, "n": 2 },
  "skipped": [
    { "method": "katch", "reason": "katch: requires body_fat or lean_mass" },
    { "method": "cunningham", "reason": "cunningham: requires body_fat or lean_mass" }
  ]
}
```

Open **http://localhost:8080/docs** for the interactive reference.

## Errors

All errors share one envelope: `{ "error": { "type", "message", "details" } }`.

| Status | `error.type` | When |
|---|---|---|
| 422 | `validation_error` | Input failed Zod validation |
| 400 | `domain_error` | Inputs valid but impossible, or a required method's inputs are missing |
| 404 | `not_found` | Unknown tool id |
| 500 | `internal_error` | Unexpected |

## Deploy (GCP Cloud Run, scale-to-zero)

```bash
gcloud run deploy fitness-tools-api --source . --region us-central1 \
  --allow-unauthenticated --min-instances 0
```

## License

MIT — free, open-source, and usable in commercial products. See [LICENSE](../../LICENSE).
