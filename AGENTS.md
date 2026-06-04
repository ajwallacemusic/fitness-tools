# AGENTS.md

Guidance for AI agents (and humans) working **on** this repository. If you are an
agent **using** the calculators (calling the MCP/HTTP tools), see the
[consumer guide](https://ajwallacemusic.github.io/fitness-tools/guides/agents/) instead.

## What this repo is

A pnpm monorepo of deterministic fitness calculators. Three independently published
artifacts share one core:

- `packages/core` — `@almostjacked/fitness-tools`, the library. **This is the product.**
- `apps/api` — `@almostjacked/fitness-tools-api`, a reference HTTP server over the core.
- `apps/mcp` — `@almostjacked/fitness-tools-mcp`, an MCP stdio server over the core.
- `apps/docs` — the Astro/Starlight documentation site.

The API and MCP are thin protocol shells: **identical math, different transport.**

## Setup

```bash
corepack enable                 # pnpm version is pinned in package.json
pnpm install
pnpm -C packages/core build     # api/mcp import the core's built dist/
```

## Everyday commands

```bash
pnpm -r test                       # all suites (core + api + mcp)
pnpm -r typecheck                  # tsc --noEmit across packages
pnpm -C packages/core test:watch   # watch the calculators while editing
pnpm -C packages/core build        # emit dist/ + .d.ts
pnpm -C apps/api dev               # reference HTTP server on :8080
pnpm -C apps/mcp dev               # MCP stdio server (tsx watch)
pnpm -C apps/docs dev              # docs site
```

## Golden rules (do not violate)

- **Test-driven.** Write a failing test first, then the minimal code to pass it.
- **Calculators are pinned to published reference values.** Each formula is tested
  against a known number from its source. **Never edit a pinned expected value just to
  make a test pass.** If it's off, fix the formula, or adjust the *tolerance* to the
  source's stated accuracy and explain why in the PR.
- **Outputs are the public contract.** Changing what a calculator returns — even a
  rounding tweak that looks like a "fix" — is a **breaking change (major version)**.
  Downstream users depend on the exact numbers.
- **Never hand-edit the README tools table** between the `<!-- tools:start/end -->`
  markers. Regenerate it: `pnpm -C packages/core gen:tools` (a test fails if it drifts).
- **Every registered tool needs a per-tool docs page** under
  `apps/docs/src/content/docs/tools/`. A test fails if one is missing.
- **Keep `main` green.** CI runs build + typecheck + test on Node 18/20/22.

## Adding a calculator

1. Pure math in `packages/core/src/math/<name>.ts` + co-located `<name>.test.ts`
   pinning reference values from the formula's source.
2. A tool in `packages/core/src/tools/<id>.ts`: Zod input schema, output schema,
   `compute()`, and `examples`.
3. Register it in `packages/core/src/index.ts` — it then appears automatically in the
   API catalog, the OpenAPI spec, and `/docs`.
4. `pnpm -C packages/core gen:tools` to refresh the README table.
5. Add `apps/docs/src/content/docs/tools/<id>.md` (see a sibling page for the shape).

## Releasing

Changesets-based:

```bash
pnpm changeset            # describe the change + pick the semver bump
pnpm version-packages     # apply versions (usually done by CI)
pnpm release              # publish (usually done by CI)
```

## Conventions

- **Conventional commits**: `feat(scope):`, `fix(scope):`, `docs(scope):`,
  `test(scope):`, `ci(scope):` — match the existing git history.
- Branch off `main`; keep PRs focused; ensure `pnpm -r test` and `pnpm -r typecheck`
  pass locally before pushing.
- Units are explicit everywhere as `{ value, unit }` — never bare numbers for
  height/weight at a boundary.
