---
title: Powerlifting attempts
description: Plan opener/second/third attempts, warm-ups, and plate loading from a 1RM.
---

**Tool id:** `powerlifting-attempts` · **Methods:** standard

Turn an estimated 1RM into a meet-day attempt plan; reach for it to pick openers and a
warm-up ramp.

## Input

| Field | Type | Notes |
|---|---|---|
| `one_rep_max` | `{ value, unit }` | `kg` or `lb` — your estimated max |
| `bar_weight` | `{ value, unit }` \| null | defaults to 20 kg / 45 lb |
| `available_plates` | number[] \| null | per-side plate sizes in the same unit — defaults to standard plate sets |
| `aggressiveness` | `"conservative" \| "standard" \| "aggressive"` | controls attempt percentages; defaults to `"standard"` |

**Attempt percentages by aggressiveness:**

| | Opener | Second | Third |
|---|---|---|---|
| conservative | 88% | 93% | 98% |
| standard | 90% | 95% | 101% |
| aggressive | 91% | 97% | 103% |

## Methods

- **standard** — Deterministic opener/second/third attempts derived from the estimated
  1RM at the percentages above, then snapped to the nearest loadable weight given the
  bar and available plates. Also produces a warm-up ramp from bar-only up to the opener
  weight, with per-side plate loading for every set.

## Example

```ts
import { REGISTRY } from "@almostjacked/fitness-tools";
const pl = REGISTRY.get("powerlifting-attempts")!;
pl.compute(pl.input.parse({
  one_rep_max: { value: 200, unit: "kg" },
}));
```

```ts
{
  attempts: {
    opener: { weight: 180,   plates_per_side: [25, 25, 25, 5] },
    second: { weight: 190,   plates_per_side: [25, 25, 25, 10] },
    third:  { weight: 202.5, plates_per_side: [25, 25, 25, 15, 1.25] },
  },
  warmups: [
    { weight: 20,    reps: 5, plates_per_side: [] },
    { weight: 72.5,  reps: 5, plates_per_side: [25, 1.25] },
    // …
    { weight: 167.5, reps: 1, plates_per_side: [25, 25, 20, 2.5, 1.25] },
  ],
  bar_weight: 20,
  unit: "kg",
  aggressiveness: "standard",
}
```

## Call it another way

- **Over HTTP:** `POST /v1/tools/powerlifting-attempts` — see the [HTTP API](/fitness-tools/api/).
- **From an agent:** the `powerlifting-attempts` MCP tool — see the [MCP server](/fitness-tools/guides/mcp/).
