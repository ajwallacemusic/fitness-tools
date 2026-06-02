# Fitness Tools

[![CI](https://github.com/ajwallacemusic/fitness-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/ajwallacemusic/fitness-tools/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

📖 **[Documentation](https://ajwallacemusic.github.io/fitness-tools/)** · [npm](https://www.npmjs.com/package/@almostjacked/fitness-tools)

Composable, deterministic fitness calculators — BMR/TDEE, body fat, 1RM, macros, activity
multiplier, powerlifting attempts, and natural muscular potential. Each calculator runs
several published formulas and reports a consensus across them.

This repo ships **three separate, independently-usable artifacts**:

- **[`@almostjacked/fitness-tools`](packages/core)** — the npm **library**. Validated,
  self-describing calculators that run natively in the browser and on the server. **This is
  the product.**
- **[`@almostjacked/fitness-tools-api`](apps/api)** — a **reference HTTP server** built on the library.
  It re-exposes the same calculators over HTTP (identical math, identical results) and is
  inert until you run or host it.
- **[`@almostjacked/fitness-tools-mcp`](apps/mcp)** — an **MCP stdio server** built on the library.
  It exposes the same calculators as MCP tools for agents/LLM clients (identical math), runnable
  with `npx @almostjacked/fitness-tools-mcp`.

## Which one do you want?

| You're… | Use | Why |
|---|---|---|
| Writing JS/TS (browser, Node, edge) | **`@almostjacked/fitness-tools`** (npm) | Runs in-process. Install, import, call. No server, no network. |
| Calling from another language / `curl` / a no-code tool | **`@almostjacked/fitness-tools-api`** (HTTP) | Same calculators over HTTP. You run/host it. |
| Building a remote frontend | **`@almostjacked/fitness-tools-api`** | Self-describing catalog + OpenAPI over the wire. |
| Wiring the calculators into an MCP client / agent | **`@almostjacked/fitness-tools-mcp`** | `npx` an MCP stdio server; one tool per calculator. |

> The API adds a network boundary, not capability. The package works the moment you install
> it; the server does nothing until it's running.

## Layout

```
packages/core   @almostjacked/fitness-tools — the library (the product)
apps/api        @almostjacked/fitness-tools-api  — a reference HTTP server over the library
apps/mcp        @almostjacked/fitness-tools-mcp  — an MCP stdio server over the library
```

## Develop

```bash
pnpm install
pnpm -r test                 # core + api + mcp test suites
pnpm -C packages/core build  # build the library
pnpm -C apps/api dev         # run the reference server on :8080
```

See each package's README — [library](packages/core/README.md) ·
[reference server](apps/api/README.md).

## License

**MIT** — free, open-source, and usable in commercial products. See [LICENSE](LICENSE).
Built on published formulas (Mifflin-St Jeor, US Navy, Jackson-Pollock, Epley, Casey Butt,
etc.); contributions welcome.
