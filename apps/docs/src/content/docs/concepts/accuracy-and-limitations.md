---
title: Accuracy & limitations
description: What these numbers can and can't tell you.
sidebar:
  order: 2
---

These calculators are honest about being **estimates**. Here's what that means in practice.

## A consensus is agreement, not truth

The `consensus` is how closely the published formulas agree with each other — not how close they
are to your real value. If four TDEE formulas cluster tightly, that's reassuring, but they can
all share the same bias. Treat the **range** (`min`–`max`) as the honest picture and the mean or
median as a working estimate, not a measurement.

## Some methods are rough by nature

- **Body fat** — the Navy (circumference) and Deurenberg (BMI-based) methods are population
  equations; expect a few points of error versus a DXA or hydrostatic measurement. Skinfold
  (Jackson-Pollock) needs careful caliper technique to be worth anything.
- **RSMI `wen-2011`** — estimates appendicular muscle from height/weight/age/sex. It's a
  screening estimate, materially less accurate than the `direct` DXA value. Prefer `direct` when
  you have a scan.
- **Muscular potential** — Casey Butt, the FFMI cap, and Berkhan are *models* of a natural
  ceiling, not guarantees; genetics vary widely around them.

## Known scope limits

- The **FFMI ≈ 25 natural ceiling** comes from a male reference population (Kouri 1995). The
  practical limit for women is lower (~22); the `above_natural_limit` flag uses the single 25
  threshold, so read it with that in mind.
- **`muscle-potential` is men-only in v1** — it raises on `sex: "female"`.
- Formulas are fit to **populations**. Individuals deviate. The further you are from a formula's
  reference population (age, training status, ethnicity), the looser the estimate.

## What the tools *do* guarantee

Determinism and validation. The same input always returns the same numbers, units are always
explicit (`{ value, unit }`), and invalid input is rejected at the boundary — so the errors that
remain are *measurement* and *model* error, not unit mix-ups or bad data. This is decision
support, not medical advice.
