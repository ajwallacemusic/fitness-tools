---
title: Macros
description: Split a calorie target into protein, fat, and carb grams.
---

**Tool id:** `macros` · **Methods:** g-per-kg

Turn a daily calorie target into protein/fat/carb grams; reach for it after you've set
calories from TDEE.

## Input

| Field | Type | Notes |
|---|---|---|
| `calories` | number | daily calorie target, > 0 |
| `weight` | `{ value, unit }` | `kg` or `lb` — your bodyweight |
| `goal` | `"cut" \| "maintain" \| "bulk"` | defaults to `"maintain"` |
| `protein_g_per_kg` | number \| null | 0–4 g/kg — overrides the goal default (cut: 2.2, maintain: 2.0, bulk: 1.8) |
| `fat_g_per_kg` | number \| null | 0–3 g/kg — overrides the default of 0.9 g/kg |
| `methods` | `string[] \| "all"` | defaults to `"all"` |

## Methods

- **g-per-kg** — Sets protein and fat targets in grams per kg of bodyweight (with
  goal-based protein defaults); carbohydrates fill the remaining calories.

## Example

```ts
import { REGISTRY } from "@almostjacked/fitness-tools";
const macros = REGISTRY.get("macros")!;
macros.compute(macros.input.parse({
  calories: 2500,
  weight: { value: 80, unit: "kg" },
  goal: "maintain",
}));
```

```ts
{
  results: [
    {
      method: "g-per-kg",
      value: 2500,
      unit: "kcal",
      detail: {
        protein_g: 160,
        fat_g: 72,
        carb_g: 303,
        calories: 2500,
      },
    },
  ],
  consensus: null,
}
```

> `macros` runs a single method, so there's nothing to average — `consensus` is `null`.
> Multi-method tools (like [`tdee`](/fitness-tools/tools/tdee/)) return a populated consensus.

## Call it another way

- **Over HTTP:** `POST /v1/tools/macros` — see the [HTTP API](/fitness-tools/api/).
- **From an agent:** the `macros` MCP tool — see the [MCP server](/fitness-tools/mcp/server/).
