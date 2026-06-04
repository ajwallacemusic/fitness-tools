---
title: Getting started
description: From zero to a result you understand, in one page.
---

**Fitness Tools** is a set of deterministic fitness calculators — TDEE, body fat, one-rep
max, macros, and more. Each calculator runs several *published* formulas and reports a
**consensus** across them, so you get a defensible range instead of one black-box number.
It's a plain TypeScript library: install it, call it, done. No server, no network, no API key.

## 1. Install

```bash
npm i @almostjacked/fitness-tools
```

## 2. Run your first calculation

Every calculator is reached through the `REGISTRY`. Here's TDEE (daily calories burned):

```ts
import { REGISTRY } from "@almostjacked/fitness-tools";

const tdee = REGISTRY.get("tdee")!;

const out = tdee.compute(
  tdee.input.parse({
    sex: "male",
    age: 30,
    height: { value: 180, unit: "cm" },
    weight: { value: 80, unit: "kg" },
    activity: "moderate",
  }),
);

console.log(out);
```

## 3. Read the result

You get back three things:

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

- **`results`** — one entry per formula that ran. Each is a `{ value, unit }` plus a
  `detail` showing the intermediate numbers.
- **`consensus`** — the agreement across those formulas: `mean`, `median`, `min`, `max`,
  and `n` (how many ran). Use `mean` or `median` as your headline number and `min`/`max`
  as the honest range.
- **`skipped`** — formulas that *couldn't* run and why. Here, two methods need body-fat or
  lean-mass to estimate lean body mass; provide `body_fat` and they'll join the consensus.

Notice that **units are always explicit** (`{ value: 180, unit: "cm" }`). The library
never guesses whether you meant cm or inches.

## 4. Prefer a single function?

The formulas are also exported directly — fully tree-shakeable, no validation:

```ts
import { mifflinBmr, activityMultiplier } from "@almostjacked/fitness-tools";

mifflinBmr("male", 80, 180, 30) * activityMultiplier("moderate"); // 2759
```

## What next

- Browse what each calculator does on the **[Tools](/fitness-tools/tools/tdee/)** pages.
- Understand **[methods and consensus](/fitness-tools/guides/methods-and-consensus/)** in depth.
- Validate untrusted input (forms, APIs): **[Validation](/fitness-tools/guides/validation/)**.
- Calling from another language or an agent? See the **[HTTP API](/fitness-tools/api/)** and
  **[MCP server](/fitness-tools/guides/mcp/)**.
