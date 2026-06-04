---
title: One-rep max
description: Estimate 1RM from a submaximal set across six formulas, with a %1RM load chart.
---

**Tool id:** `one-rep-max` · **Methods:** epley, brzycki, lombardi, wathan, oconner, mayhew

Estimate your one-rep max from a set you actually did (reps at a weight); reach for it to
program percentages without testing a true max.

## Input

| Field | Type | Notes |
|---|---|---|
| `weight` | `{ value, unit }` | `kg` or `lb` — the weight used in the set |
| `reps` | integer | 1–20 |
| `methods` | `string[] \| "all"` | defaults to `"all"` |

## Methods

- **epley** — Epley (1985).
- **brzycki** — Brzycki (1993).
- **lombardi** — Lombardi.
- **wathan** — Wathan.
- **oconner** — O'Conner.
- **mayhew** — Mayhew et al.

The output also includes a `percent_table`: loads (in the same unit as your input) at
50%, 55%, …, 95%, 100% of the consensus mean. Use it to set up percentage-based
programming blocks without extra arithmetic.

## Example

```ts
import { REGISTRY } from "@almostjacked/fitness-tools";
const orm = REGISTRY.get("one-rep-max")!;
orm.compute(orm.input.parse({
  weight: { value: 100, unit: "kg" }, reps: 5,
}));
```

```ts
{
  results: [
    { method: "epley",    value: 116.7, unit: "kg", detail: null },
    { method: "brzycki",  value: 112.5, unit: "kg", detail: null },
    { method: "lombardi", value: 117.5, unit: "kg", detail: null },
    { method: "wathan",   value: 116.6, unit: "kg", detail: null },
    { method: "oconner",  value: 112.5, unit: "kg", detail: null },
    { method: "mayhew",   value: 119,   unit: "kg", detail: null },
  ],
  consensus: { mean: 115.8, median: 116.65, min: 112.5, max: 119, n: 6 },
  percent_table: [
    { percent: 50, load: 57.9  },
    { percent: 55, load: 63.7  },
    // …
    { percent: 95, load: 110   },
    { percent: 100, load: 115.8 },
  ],
}
```

## Call it another way

- **Over HTTP:** `POST /v1/tools/one-rep-max` — see the [HTTP API](/fitness-tools/api/).
- **From an agent:** the `one-rep-max` MCP tool — see the [MCP server](/fitness-tools/guides/mcp/).
