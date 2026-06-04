---
title: Quick start
description: Install and run a calculator in 30 seconds.
sidebar:
  order: 2
---

```bash
npm i @almostjacked/fitness-tools
```

Use the registry (validated input → results + consensus):

```ts
import { REGISTRY } from "@almostjacked/fitness-tools";

const tdee = REGISTRY.get("tdee")!;
const out = tdee.compute(tdee.input.parse({
  sex: "male", age: 30,
  height: { value: 180, unit: "cm" },
  weight: { value: 80, unit: "kg" },
  activity: "moderate",
}));
// out.results   → mifflin 2759, harris 2873.1, …
// out.consensus → { mean: 2816.05, … }
```

Or call a formula directly (tree-shakeable, no validation):

```ts
import { mifflinBmr, activityMultiplier } from "@almostjacked/fitness-tools";
mifflinBmr("male", 80, 180, 30) * activityMultiplier("moderate"); // 2759
```
