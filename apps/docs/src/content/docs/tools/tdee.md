---
title: TDEE
description: Estimate BMR and total daily energy expenditure across four formulas.
---

**Tool id:** `tdee` · **Methods:** mifflin, harris, katch, cunningham

Estimates **Basal Metabolic Rate** and **Total Daily Energy Expenditure** (calories burned
per day) by running four published formulas and reporting the consensus. Reach for it to set
a calorie target for cutting, maintaining, or bulking.

## Input

| Field | Type | Notes |
|---|---|---|
| `sex` | `"male" \| "female"` | required |
| `age` | number | years, 0–120 |
| `height` | `{ value, unit }` | `cm` or `in` |
| `weight` | `{ value, unit }` | `kg` or `lb` |
| `activity` | level or number | `"sedentary" … "very_active"`, or a raw multiplier |
| `body_fat` | number \| null | % — unlocks the LBM-based methods |
| `lean_mass` | `{ value, unit }` \| null | alternative to `body_fat` |
| `methods` | `string[] \| "all"` | defaults to `"all"` |

## Methods

- **mifflin** — Mifflin-St Jeor (1990). The modern default; most accurate for the general
  population.
- **harris** — Harris-Benedict (1919, Roza-Shizgal 1984 revision). The classic.
- **katch** — Katch-McArdle. BMR from **lean body mass**; needs `body_fat` or `lean_mass`.
- **cunningham** — Cunningham (1980). Also LBM-based; popular for lean/athletic populations.

> The two LBM-based methods are **skipped** unless you supply `body_fat` or `lean_mass`.

## Example

```ts
import { REGISTRY } from "@almostjacked/fitness-tools";
const tdee = REGISTRY.get("tdee")!;
tdee.compute(tdee.input.parse({
  sex: "male", age: 30,
  height: { value: 180, unit: "cm" },
  weight: { value: 80, unit: "kg" },
  activity: "moderate",
}));
```

```ts
{
  results: [
    { method: "mifflin", value: 2759,   unit: "kcal/day", detail: { bmr: 1780,   multiplier: 1.55 } },
    { method: "harris",  value: 2873.1, unit: "kcal/day", detail: { bmr: 1853.6, multiplier: 1.55 } },
  ],
  consensus: { mean: 2816.05, median: 2816.05, min: 2759, max: 2873.1, n: 2 },
  skipped: [
    { method: "katch",      reason: "katch: requires body_fat or lean_mass" },
    { method: "cunningham", reason: "cunningham: requires body_fat or lean_mass" },
  ],
}
```

## Call it another way

- **Over HTTP:** `POST /v1/tools/tdee` — see the [HTTP API](/fitness-tools/api/).
- **From an agent:** the `tdee` MCP tool — see the [MCP server](/fitness-tools/mcp/server/).
