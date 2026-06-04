---
title: Body fat
description: Estimate body-fat % via circumference, skinfold, and BMI methods.
---

**Tool id:** `body-fat` · **Methods:** navy, jackson-pollock-3, deurenberg

Estimate body-fat percentage from body measurements; reach for it to track composition or
to unlock LBM-based TDEE methods.

## Input

| Field | Type | Notes |
|---|---|---|
| `sex` | `"male" \| "female"` | required |
| `age` | number \| null | years, 0–120 — needed for jackson-pollock-3 and deurenberg |
| `height` | `{ value, unit }` \| null | `cm` or `in` — needed for navy and deurenberg |
| `weight` | `{ value, unit }` \| null | `kg` or `lb` — needed for deurenberg |
| `neck` | `{ value, unit }` \| null | circumference — needed for navy |
| `waist` | `{ value, unit }` \| null | circumference — needed for navy |
| `hip` | `{ value, unit }` \| null | circumference — required for navy when `sex` is `"female"` |
| `skinfold_sum` | number \| null | mm, sum of 3 sites — needed for jackson-pollock-3 |
| `methods` | `string[] \| "all"` | defaults to `"all"` |

## Methods

- **navy** — US Navy circumference method (Hodgdon & Beckett). Uses neck/waist (plus hip
  for women).
- **jackson-pollock-3** — Jackson & Pollock (1978), 3-site skinfold.
- **deurenberg** — Deurenberg (1991), a BMI-based estimate.

> Each method needs different inputs (circumferences vs skinfolds vs weight+height+age).
> Any method whose required inputs are absent appears in `skipped`.

## Example

```ts
import { REGISTRY } from "@almostjacked/fitness-tools";
const bodyFat = REGISTRY.get("body-fat")!;
bodyFat.compute(bodyFat.input.parse({
  sex: "male",
  neck:   { value: 40, unit: "cm" },
  waist:  { value: 90, unit: "cm" },
  height: { value: 180, unit: "cm" },
}));
```

```ts
{
  results: [
    { method: "navy", value: 18.37, unit: "%", detail: null },
  ],
  consensus: { mean: 18.37, median: 18.37, min: 18.37, max: 18.37, n: 1 },
  skipped: [
    { method: "jackson-pollock-3", reason: "jackson-pollock-3: requires skinfold_sum and age" },
    { method: "deurenberg",        reason: "deurenberg: requires weight, height, age" },
  ],
}
```

## Call it another way

- **Over HTTP:** `POST /v1/tools/body-fat` — see the [HTTP API](/fitness-tools/api/).
- **From an agent:** the `body-fat` MCP tool — see the [MCP server](/fitness-tools/mcp/server/).
