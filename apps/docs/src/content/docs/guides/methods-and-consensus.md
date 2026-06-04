---
title: Methods & consensus
description: Why each tool returns several results plus a consensus.
sidebar:
  order: 3
---

Each calculator runs **multiple published formulas** and reports a **consensus** across
them, rather than committing to one. A `tdee` call returns:

```ts
{
  results: [
    { method: "mifflin", value: 2759, unit: "kcal/day", detail: { … } },
    { method: "harris",  value: 2873.1, … },
  ],
  consensus: { mean: 2816.05, median: 2816.05, min: 2759, max: 2873.1, n: 2 },
  skipped: [
    { method: "katch", reason: "katch: requires body_fat or lean_mass" },
    { method: "cunningham", reason: "…" },
  ],
}
```

Methods whose inputs are missing appear in `skipped` (or throw in explicit mode). Provide
`body_fat` or `lean_mass` to unlock the lean-mass-based methods.
