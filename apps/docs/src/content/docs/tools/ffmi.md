---
title: FFMI
description: Compute FFMI and its height-adjusted form, and flag whether it exceeds the natural ceiling.
---

**Tool id:** `ffmi` · **Methods:** standard

Compute the Fat-Free Mass Index (FFMI) and its height-adjusted form from weight and
body fat percentage (or lean mass directly), and flag whether the result exceeds the
~25 natural ceiling (Kouri et al. 1995).

## Input

| Field | Type | Notes |
|---|---|---|
| `height` | `{ value, unit }` | `cm` or `in` — required |
| `weight` | `{ value, unit }` | `kg` or `lb` — required |
| `body_fat` | number \| null | body-fat %, 2–70; required if `lean_mass` is absent |
| `lean_mass` | `{ value, unit }` \| null | fat-free mass — alternative to `body_fat`; if both are given, `lean_mass` wins |
| `methods` | `string[] \| "all"` | defaults to `"all"` |

## Methods

- **standard** — FFMI = fat-free mass (kg) ÷ height (m)². The **adjusted** value normalizes to a
  1.8 m reference: `FFMI + 6.1 × (1.8 − height_m)` (Kouri et al. 1995). `above_natural_limit` is
  true when the **adjusted** FFMI exceeds 25 (the ceiling is defined on the height-normalized value).

> The ~25 ceiling comes from a **male** reference population; the practical natural limit for
> women is lower (~22). The flag uses the single 25 threshold — read it with that in mind.

## Example

```ts
import { REGISTRY } from "@almostjacked/fitness-tools";
const ffmi = REGISTRY.get("ffmi")!;
ffmi.compute(ffmi.input.parse({
  height: { value: 170, unit: "cm" },
  weight: { value: 80, unit: "kg" },
  body_fat: 12,
}));
```

```ts
{
  results: [
    {
      method: "standard",
      value: 24.36,
      unit: "kg/m²",
      detail: {
        ffm_kg: 70.4,
        ffmi_adjusted: 24.97,
        above_natural_limit: false,
      },
    },
  ],
  consensus: null,
}
```

## Call it another way

- **Over HTTP:** `POST /v1/tools/ffmi` — see the [HTTP API](/fitness-tools/api/).
- **From an agent:** the `ffmi` MCP tool — see the [MCP server](/fitness-tools/mcp/server/).
