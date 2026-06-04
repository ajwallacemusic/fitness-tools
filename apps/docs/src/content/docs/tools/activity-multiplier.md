---
title: Activity multiplier
description: Estimate the TDEE activity multiplier via a lookup table or a NEAT+EAT model.
---

**Tool id:** `activity-multiplier` · **Methods:** lookup, neat-eat

Produce the activity multiplier that TDEE needs; reach for it when the coarse activity
levels don't fit and you want to model non-exercise vs exercise activity separately.

## Input

| Field | Type | Notes |
|---|---|---|
| `activity_level` | level \| null | `"sedentary"`, `"light"`, `"moderate"`, `"active"`, `"very_active"` — needed for lookup |
| `bmr` | number \| null | kcal/day — needed for neat-eat |
| `weight` | `{ value, unit }` \| null | `kg` or `lb` — needed for neat-eat |
| `sessions_per_week` | integer \| null | 0–21 — needed for neat-eat |
| `session_minutes` | number \| null | 1–600 — needed for neat-eat |
| `intensity` | level \| null | `"low"`, `"moderate"`, `"high"`, `"very_high"` — needed for neat-eat |
| `steps_per_day` | integer \| null | 0–100000 — one of `steps_per_day` or `occupation` required for neat-eat |
| `occupation` | level \| null | `"sedentary"`, `"light"`, `"moderate"`, `"heavy"` — alternative to `steps_per_day` |
| `methods` | `string[] \| "all"` | defaults to `"all"` |

## Methods

- **lookup** — The classic activity-factor table (sedentary → very active). Fast; requires
  only `activity_level`.
- **neat-eat** — Models non-exercise activity (NEAT, from occupation or daily steps) plus
  exercise activity (EAT, from training volume and intensity) separately. The resulting
  multiplier is `(bmr + neat + eat) / bmr`.

> The multiplier returned by this tool feeds directly into the `activity` field of the
> `tdee` tool.

## Example

```ts
import { REGISTRY } from "@almostjacked/fitness-tools";
const am = REGISTRY.get("activity-multiplier")!;
am.compute(am.input.parse({
  activity_level: "moderate",
}));
```

```ts
{
  results: [
    { method: "lookup", value: 1.55, unit: "x", detail: null },
  ],
  consensus: { mean: 1.55, median: 1.55, min: 1.55, max: 1.55, n: 1 },
  skipped: [
    {
      method: "neat-eat",
      reason: "neat-eat: requires bmr, weight, sessions_per_week, session_minutes, intensity, and steps_per_day or occupation",
    },
  ],
}
```

## Call it another way

- **Over HTTP:** `POST /v1/tools/activity-multiplier` — see the [HTTP API](/fitness-tools/api/).
- **From an agent:** the `activity-multiplier` MCP tool — see the [MCP server](/fitness-tools/mcp/server/).
