# @almostjacked/fitness-tools

## 0.4.0

### Minor Changes

- bc11ce7: Adaptive TDEE v2: default to a joint Kalman filter over true weight and TDEE.

  `adaptive-tdee` now defaults to `methods: "kalman"` — a two-state Kalman filter (true body
  weight + TDEE) with a symmetric 7700 kcal/kg energy-density constant, robust intake
  conditioning (hard-reject at 3× current TDEE, flag-but-believe outliers above
  median+3×MAD, partial-log gating below 0.4× the trailing EWMA), and an RTS-smoothed history
  for the reported true-weight trend and rate — the current TDEE estimate itself stays causal.
  The response's `detail` payload adds a 95% CI on TDEE and true weight, weekly rate with CI,
  28-day TDEE change, and a `data_quality` block (`status`: `ok` / `low_confidence` / `paused`,
  logging rates, flagged intake days, `last_confident` snapshot).

  **BREAKING CHANGE** (`@almostjacked/fitness-tools`, minor per pre-1.0 semver — the maintainer
  may elevate this release to 1.0.0 instead):

  - Default `methods` changed from `"all"` to `"kalman"`. Pass `methods: "all"` to run
    `kalman` + `regression` + `endpoints` together, or `methods: ["regression","endpoints"]`
    to reproduce the old comparison-only default.
  - `entries[].weight` and `entries[].kcal` are now optional — each entry needs at least one
    of the two (previously both were required on every entry).
  - New optional `prior_tdee_kcal` input to seed the filter from an existing TDEE estimate
    (e.g. chained from the `tdee` tool).
  - Because the new default resolves to a single explicit method, a history with zero
    weigh-ins now throws (`kalman: requires at least one weigh-in entry`) instead of silently
    falling back to the window methods; pass `methods: "all"` for a graceful
    empty-results-with-`skipped` response instead.
  - Entry dates must now span at most 10 years (3660 days), earliest to latest; wider
    histories throw a `DomainError` (previously accepted, at pathological cost — an unbounded
    span expanded a per-day calendar large enough to exhaust a Workers isolate).

  `regression` and `endpoints` are unchanged and remain available as comparison methods.

  `@almostjacked/fitness-tools-mcp` bumps patch to re-export the updated core package; the MCP
  tool surface (schema, description) picks up the same input/output changes transitively. Note
  that this means the mcp package's patch bump also carries the same breaking tool-surface
  change through to MCP clients (a pre-1.0 semver judgment call — like the core package, this
  may be elevated to a minor/major release instead).

## 0.3.0

### Minor Changes

- 6e58eb2: Add adaptive-tdee calculator: measured TDEE from logged daily weight and calorie intake (energy balance, regression + endpoints methods with consensus).

## 0.2.1

### Patch Changes

- ef7290e: fix: `methods` now accepts a bare method name (e.g. `"epley"`, `"neat-eat"`) in
  addition to an array or `"all"`. LLM MCP clients routinely send the bare-string
  shape; the previous array-or-"all" union rejected it with a Zod validation
  error, causing failed tool calls. A single name behaves exactly like a
  one-element array (explicit mode: missing inputs raise instead of skipping).

## 0.2.0

### Minor Changes

- ee38e0d: Add FFMI and RSMI body-composition calculators.

  - `ffmi` — Fat-Free Mass Index: raw and height-adjusted FFMI from weight and body fat (or lean mass), with a natural-limit flag (compared against the height-normalized value).
  - `rsmi` — Relative Skeletal Muscle Index: from a DXA value (`direct`) and/or an anthropometric estimate (`wen-2011`), flagged against EWGSOP2, AWGS, and Baumgartner sarcopenia cutoffs.

  Additive only — no existing calculator outputs change. Both tools are exposed over the MCP server as well.

## 0.1.0

### Minor Changes

- e9b499d: Initial public release. Validated, self-describing fitness calculators — BMR/TDEE, body
  fat, 1RM, macros, activity multiplier, powerlifting attempts, and natural muscular
  potential — each running multiple published formulas with a consensus across them.
  Isomorphic (browser + server), one dependency (zod).
