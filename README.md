# Fitness Tools

Composable, self-describing, deterministic fitness calculators. The core math is
an isomorphic TypeScript package that runs **natively in the browser** and inside
the HTTP API — one source of truth.

## Packages
- `@fitness-tools/core` — pure calculators + tool registry (browser + server).
- `@fitness-tools/api` — Hono HTTP server over the core.

## Browser-native use
    import { REGISTRY, mifflinBmr } from "@fitness-tools/core";
    mifflinBmr("male", 80, 180, 30);            // direct formula
    const tdee = REGISTRY.get("tdee")!;
    tdee.compute(tdee.input.parse({ sex: "male", age: 30,
      height: { value: 180, unit: "cm" }, weight: { value: 80, unit: "kg" },
      activity: "moderate" }));

## API
- `GET /v1/tools` — catalog (JSON Schemas + examples)
- `GET /v1/tools/:id` — one tool
- `POST /v1/tools/:id` — run a tool

    pnpm install
    pnpm -C packages/core build
    pnpm -C apps/api dev      # http://localhost:8080

## Tools
- `tdee` — Mifflin / Harris / Katch / Cunningham
- `body-fat` — Navy / Jackson-Pollock 3-site / Deurenberg
- `one-rep-max` — Epley / Brzycki / Lombardi / Wathan / O'Conner / Mayhew
- `macros` — g-per-kg split
- `activity-multiplier` — lookup table / NEAT+EAT model
- `powerlifting-attempts` — attempts + warmup ramp + plate loads
- `muscle-potential` — Casey-Butt / FFMI-cap / Berkhan

## Deploy (GCP Cloud Run, scale-to-zero)
    docker build -f apps/api/Dockerfile -t fitness-tools-api .
    gcloud run deploy fitness-tools-api --source . --region us-central1 \
      --allow-unauthenticated --min-instances 0

## License
MIT — see [LICENSE](LICENSE). Built on published formulas (Mifflin-St Jeor, US Navy,
Jackson-Pollock, Epley, etc.); contributions welcome.
