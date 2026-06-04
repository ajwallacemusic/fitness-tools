---
title: Using the calculators from an agent
description: Pick a tool, send valid input, and read the result — for LLM/agent clients.
---

If you're building an agent or LLM app, the fastest path is the **MCP server** — each
calculator becomes a tool. (Setup and client config: [MCP server](/fitness-tools/guides/mcp/).)
Prefer plain HTTP? Every tool is also a `POST /v1/tools/{id}` route on the
[HTTP API](/fitness-tools/api/). The math is identical across both.

## The tools

`tdee`, `body-fat`, `one-rep-max`, `macros`, `activity-multiplier`,
`powerlifting-attempts`, `muscle-potential`. Each tool's inputs, methods, and a worked
example live on its **[tool page](/fitness-tools/tools/tdee/)** — that's the source of
truth for what to send.

## Sending input

- **Units are explicit.** Height/weight are `{ "value": 180, "unit": "cm" }`, never a bare
  number. Accepted units: `cm`/`in` for length, `kg`/`lb` for mass.
- **Optional fields have defaults.** e.g. `tdee` runs all four formulas unless you pass
  `methods`. You usually only send the required fields.

## Reading the result

Every tool returns the same shape — explained in full under
[methods and consensus](/fitness-tools/guides/methods-and-consensus/):

- **`results[]`** — one `{ value, unit, detail }` per formula that ran.
- **`consensus`** — `{ mean, median, min, max, n }`. Use `mean`/`median` as the headline
  number, `min`/`max` as the honest range.
- **`skipped[]`** — formulas that couldn't run, each with a `reason` (usually a missing
  optional input). If a number you wanted is missing, check here first.

Over MCP you also get `structuredContent` (validated against the output schema) alongside a
JSON text fallback.

## When something is wrong

Invalid or impossible input does not crash the session — it comes back as a tool error
(`isError: true` over MCP; an `{ "error": { type, message, details } }` envelope over HTTP).
The `type` tells you which: `validation_error` (input failed the schema),
`domain_error` (valid but impossible, or a required method's inputs are missing),
`not_found` (unknown tool id).

## A chained workflow

Many real questions span tools. To set a cut for a lifter, chain them:

1. **`body-fat`** → estimate body-fat % from circumferences.
2. **`tdee`** → feed that `body_fat` in to unlock the lean-mass methods and get maintenance
   calories.
3. **`macros`** → take a calorie target below maintenance and split it into protein/fat/carbs.

Each step's output is plain JSON you carry into the next call.
