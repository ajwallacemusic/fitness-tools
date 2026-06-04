---
title: Muscle potential
description: Estimate drug-free maximum bodyweight at a target body-fat %.
---

**Tool id:** `muscle-potential` · **Methods:** casey-butt, ffmi-cap, berkhan

> **Men only in v1.** Passing `sex: "female"` throws a `DomainError`. Female models are
> planned for a future release.

Estimate a realistic natural muscular ceiling; reach for it for a grounded long-term
bodyweight target.

## Input

| Field | Type | Notes |
|---|---|---|
| `sex` | `"male" \| "female"` | required — only `"male"` is supported in v1 |
| `height` | `{ value, unit }` | `cm` or `in` — required |
| `wrist` | `{ value, unit }` \| null | circumference — needed for casey-butt |
| `ankle` | `{ value, unit }` \| null | circumference — needed for casey-butt |
| `target_body_fat_pct` | number | 3–40 %, defaults to 10 |
| `methods` | `string[] \| "all"` | defaults to `"all"` |

## Methods

- **casey-butt** — Casey Butt's model: drug-free maximum bodyweight derived from wrist and
  ankle circumferences. Requires `wrist` and `ankle`; skipped if absent.
- **ffmi-cap** — The FFMI ≈ 25 natural ceiling, back-calculated to bodyweight at the
  target body-fat %. Requires only `height`.
- **berkhan** — Martin Berkhan's max-contest-weight rule of thumb. Requires only `height`.

## Example

```ts
import { REGISTRY } from "@almostjacked/fitness-tools";
const mp = REGISTRY.get("muscle-potential")!;
mp.compute(mp.input.parse({
  sex: "male",
  height: { value: 180, unit: "cm" },
}));
```

```ts
{
  results: [
    {
      method: "ffmi-cap",
      value: 90,
      unit: "kg",
      detail: { max_ffm_kg: 81, target_bf_pct: 10 },
    },
    {
      method: "berkhan",
      value: 84,
      unit: "kg",
      detail: { max_ffm_kg: 75.6, target_bf_pct: 10 },
    },
  ],
  consensus: { mean: 87, median: 87, min: 84, max: 90, n: 2 },
  skipped: [
    { method: "casey-butt", reason: "casey-butt: requires wrist and ankle" },
  ],
}
```

## Call it another way

- **Over HTTP:** `POST /v1/tools/muscle-potential` — see the [HTTP API](/fitness-tools/api/).
- **From an agent:** the `muscle-potential` MCP tool — see the [MCP server](/fitness-tools/mcp/server/).
