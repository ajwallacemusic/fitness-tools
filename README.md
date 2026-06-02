# Fitness Tools

[![CI](https://github.com/ajwallacemusic/fitness-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/ajwallacemusic/fitness-tools/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Composable, deterministic fitness calculators — BMR/TDEE, body fat, 1RM, macros, activity
multiplier, powerlifting attempts, and natural muscular potential. Each calculator runs
several published formulas and reports a consensus across them.

This repo ships **two separate, independently-usable artifacts**:

- **[`@fitness-tools/core`](packages/core)** — the npm **library**. Validated,
  self-describing calculators that run natively in the browser and on the server. **This is
  the product.**
- **[`@fitness-tools/api`](apps/api)** — a **reference HTTP server** built on the library.
  It re-exposes the same calculators over HTTP (identical math, identical results) and is
  inert until you run or host it.

## Which one do you want?

| You're… | Use | Why |
|---|---|---|
| Writing JS/TS (browser, Node, edge) | **`@fitness-tools/core`** (npm) | Runs in-process. Install, import, call. No server, no network. |
| Calling from another language / `curl` / a no-code tool | **`@fitness-tools/api`** (HTTP) | Same calculators over HTTP. You run/host it. |
| Building a remote frontend or an agent/LLM tool | **`@fitness-tools/api`** | Self-describing catalog + OpenAPI over the wire. |

> The API adds a network boundary, not capability. The package works the moment you install
> it; the server does nothing until it's running.

## Layout

```
packages/core   @fitness-tools/core — the library (the product)
apps/api        @fitness-tools/api  — a reference HTTP server over the library
```

## Develop

```bash
pnpm install
pnpm -r test                 # core + api test suites
pnpm -C packages/core build  # build the library
pnpm -C apps/api dev         # run the reference server on :8080
```

See each package's README — [library](packages/core/README.md) ·
[reference server](apps/api/README.md).

## License

**MIT** — free, open-source, and usable in commercial products. See [LICENSE](LICENSE).
Built on published formulas (Mifflin-St Jeor, US Navy, Jackson-Pollock, Epley, Casey Butt,
etc.); contributions welcome.
