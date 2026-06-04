---
title: Methods & consensus
description: Why each tool returns several results plus a consensus.
sidebar:
  order: 1
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

## Why a consensus instead of one number

Experts don't agree on a single formula for most of these metrics — Mifflin-St Jeor and
Harris-Benedict will hand you different BMRs from the same inputs, and both are "correct." Rather
than pick a winner and hide the disagreement, each tool runs every applicable formula and reports
the spread. The **mean/median** is a reasonable working number; the **min–max range** is the
honest uncertainty. When the methods cluster tightly you can trust the estimate more; when they
spread out, that's a signal to be cautious.

`skipped` is part of the same honesty: a method whose inputs are missing is *listed with the
reason*, never silently dropped or guessed. Everything is deterministic — same input, same
numbers, every time — so the consensus reflects formula disagreement, nothing else.

For how far to trust these numbers, see
[accuracy & limitations](/fitness-tools/concepts/accuracy-and-limitations/).
