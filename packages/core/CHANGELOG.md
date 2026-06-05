# @almostjacked/fitness-tools

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
