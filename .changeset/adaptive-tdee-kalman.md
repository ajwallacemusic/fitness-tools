---
"@almostjacked/fitness-tools": minor
"@almostjacked/fitness-tools-mcp": patch
---

Adaptive TDEE v2: default to a joint Kalman filter over true weight and TDEE.

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
