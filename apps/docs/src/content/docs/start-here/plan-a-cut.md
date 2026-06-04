---
title: Plan a cut
description: Chain three calculators — body fat, TDEE, macros — into a cutting plan.
sidebar:
  order: 2
---

Real questions span several calculators. This walks one person through a cutting plan end to end:
estimate body fat, use it to get maintenance calories, then turn a deficit into macros. Meet
**Sam**: male, 32, 180 cm, 85 kg, trains a few times a week (moderate activity), tape measure in
hand (neck 40 cm, waist 92 cm).

## 1. Estimate body fat

```ts
import { REGISTRY } from "@almostjacked/fitness-tools";

const bodyFat = REGISTRY.get("body-fat")!;
const bf = bodyFat.compute(bodyFat.input.parse({
  sex: "male", age: 32,
  height: { value: 180, unit: "cm" },
  weight: { value: 85, unit: "kg" },
  neck:   { value: 40,  unit: "cm" },
  waist:  { value: 92,  unit: "cm" },
}));
// bf.results   → navy 19.81 %, deurenberg 22.64 %
// bf.consensus → { mean: 21.225, min: 19.81, max: 22.64, n: 2 }
// bf.skipped   → jackson-pollock-3 (needs skinfold_sum)
```

Two methods ran and agree within a few points; the skinfold method sat out because Sam has no
caliper reading. We'll carry the consensus, **≈ 21 %**, forward.

## 2. Get maintenance calories

Feeding `body_fat` into `tdee` unlocks the lean-mass-based methods (Katch, Cunningham), so all
four formulas run:

```ts
const tdee = REGISTRY.get("tdee")!;
const t = tdee.compute(tdee.input.parse({
  sex: "male", age: 32,
  height: { value: 180, unit: "cm" },
  weight: { value: 85, unit: "kg" },
  activity: "moderate",
  body_fat: 21.2,
}));
// t.results   → mifflin 2821, harris 2959.4, katch 2816, cunningham 3059 kcal/day
// t.consensus → { mean: 2913.85, median: 2890.2, min: 2816, max: 3059, n: 4 }
```

Maintenance is roughly **2914 kcal/day** (the mean). The ~240 kcal spread between formulas is
exactly the kind of uncertainty the consensus makes visible.

## 3. Turn a deficit into macros

A ~500 kcal/day deficit targets about a pound a week. That's **2914 − 500 = 2414 kcal**. Hand
that to `macros` with a cutting goal (it defaults protein high to protect muscle in a deficit):

```ts
const macros = REGISTRY.get("macros")!;
const m = macros.compute(macros.input.parse({
  calories: 2414,
  weight: { value: 85, unit: "kg" },
  goal: "cut",
}));
// m.results[0].detail → { protein_g: 187, fat_g: 76.5, carb_g: 244.4, calories: 2414 }
```

Sam's cutting day: **2414 kcal — 187 g protein, 77 g fat, 244 g carbs.**

## What you just did

You chained three tools, carrying each output into the next as plain data: a body-fat estimate
unlocked better TDEE methods, and the TDEE consensus set the calorie budget the macros split. The
same chain works over [HTTP](/fitness-tools/api/) or from an [agent](/fitness-tools/mcp/agents/).

Before acting on the numbers, read [accuracy & limitations](/fitness-tools/concepts/accuracy-and-limitations/)
— these are estimates, and the range matters as much as the mean.
