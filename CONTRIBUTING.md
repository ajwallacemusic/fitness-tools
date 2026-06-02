# Contributing

Thanks for your interest in improving Fitness Tools! This is a small, test-driven
codebase and contributions are welcome.

## Prerequisites

- **Node.js ≥ 18**
- **pnpm** — enable via Corepack: `corepack enable` (the repo pins the version in
  `package.json` → `packageManager`).

## Setup

```bash
git clone https://github.com/ajwallacemusic/fitness-tools.git
cd fitness-tools
pnpm install
pnpm -C packages/core build   # the API imports the core's built dist/
```

## Everyday commands

```bash
pnpm -r test                    # run all tests (core + api)
pnpm -C packages/core test:watch  # watch the calculators while you edit
pnpm -r typecheck               # tsc --noEmit across packages
pnpm -C packages/core build     # emit dist/ + .d.ts
```

## Layout

```
packages/core   @fitness-tools/core — the library (the product)
apps/api        @fitness-tools/api  — a reference HTTP server over the library
```

## How we work

- **Test-driven.** Write a failing test first, then the minimal code to pass it.
- **Calculators are pinned to published reference values.** Each formula is tested
  against a known reference number from its source (Mifflin-St Jeor, US Navy,
  Jackson-Pollock, Epley, Casey Butt, …). **Do not change a pinned expected value just
  to make a test pass** — if it's off, fix the formula, or adjust the *tolerance* to match
  the source's stated accuracy and explain why in the PR.
- **Keep `main` green.** CI runs build + typecheck + test on Node 18/20/22.

## Adding a calculator

1. Add the pure math in `packages/core/src/math/<name>.ts` with a co-located
   `<name>.test.ts` pinning reference values.
2. Add a tool in `packages/core/src/tools/<id>.ts`: a Zod input schema, an output schema,
   a `compute()` that uses the math, examples, and a `tool` object.
3. Register it in `packages/core/src/index.ts`. It then appears automatically in the API
   catalog, the OpenAPI spec, and `/docs` — no extra wiring.
4. Regenerate the README tools table: `pnpm -C packages/core gen:tools`. **Don't hand-edit
   the table between the `<!-- tools:start/end -->` markers** — a test fails if it drifts.

## Pull requests

- Branch off `main`; keep changes focused.
- Make sure `pnpm -r test` and `pnpm -r typecheck` pass locally before pushing.
- Describe what changed and why; link any related issue.

## A note on versioning

Formula **outputs are part of the public contract**. Changing what a calculator returns is
a breaking change (major version), even if the code looks like a "fix" — downstream users
may depend on the exact numbers.

## License

By contributing you agree that your contributions are licensed under the [MIT License](LICENSE).
