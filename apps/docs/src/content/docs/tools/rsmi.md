---
title: RSMI
description: Relative Skeletal Muscle Index with sarcopenia flags, from DXA or anthropometry.
---

**Tool id:** `rsmi` · **Methods:** direct, wen-2011

Computes the **Relative Skeletal Muscle Index** — appendicular muscle relative to height — and
flags low muscle mass against three sarcopenia standards. Reach for it to screen for sarcopenia.

## Input

| Field | Type | Notes |
|---|---|---|
| `sex` | `"male" \| "female"` | cutoffs and the estimate are sex-specific |
| `height` | `{ value, unit }` | `cm` or `in` |
| `weight` | `{ value, unit }` | `kg` or `lb` |
| `age` | number | years, 0–120 |
| `asm_kg` | number \| null | appendicular skeletal muscle mass from DXA |
| `methods` | `string[] \| "all"` | defaults to `"all"` |

## Methods

- **direct** — `asm_kg ÷ height(m)²`. Runs only when you provide a DXA `asm_kg`; otherwise it's
  skipped.
- **wen-2011** — always runs. Estimates appendicular muscle from height/weight/age/sex
  (Wen X, et al. *Asia Pac J Clin Nutr* 2011;20(4):551–556), then divides by height². It is an
  **anthropometric estimate** and less accurate than a DXA measurement.

Each result's `detail` flags the value against **EWGSOP2** (men <7.0, women <5.5), **AWGS 2019**
(men <7.0, women <5.4), and **Baumgartner 1998** (men <7.26, women <5.45) — all kg/m².

## Example

Without a DXA value, only the estimate runs:

```ts
import { REGISTRY } from "@almostjacked/fitness-tools";
const rsmi = REGISTRY.get("rsmi")!;
rsmi.compute(rsmi.input.parse({
  sex: "male",
  height: { value: 180, unit: "cm" },
  weight: { value: 80, unit: "kg" },
  age: 30,
}));
```

```ts
{
  results: [
    {
      method: "wen-2011",
      value: 8.27,
      unit: "kg/m²",
      detail: { asm_kg: 26.8, below_ewgsop2: false, below_awgs: false, below_baumgartner: false },
    },
  ],
  consensus: { mean: 8.27, median: 8.27, min: 8.27, max: 8.27, n: 1 },
  skipped: [{ method: "direct", reason: "direct: requires asm_kg" }],
}
```

Pass `asm_kg` from a DXA scan to add the `direct` method and a consensus across both.

## Call it another way

- **Over HTTP:** `POST /v1/tools/rsmi` — see the [HTTP API](/fitness-tools/api/).
- **From an agent:** the `rsmi` MCP tool — see the [MCP server](/fitness-tools/mcp/server/).
