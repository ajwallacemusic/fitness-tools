# @almostjacked/fitness-tools

**New here?** Start with the [getting-started tutorial](https://ajwallacemusic.github.io/fitness-tools/guides/getting-started/)
— zero to an understood result in one page. The reference below is the fast version.

Validated, self-describing fitness calculators for TypeScript — **runs natively in the
browser and on the server**. BMR/TDEE, body fat, 1RM, macros, activity multiplier,
powerlifting attempts, and natural muscular potential, each with multiple methods and a
consensus across them.

[![npm](https://img.shields.io/npm/v/@almostjacked/fitness-tools.svg)](https://www.npmjs.com/package/@almostjacked/fitness-tools)
[![CI](https://github.com/ajwallacemusic/fitness-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/ajwallacemusic/fitness-tools/actions/workflows/ci.yml)
· Types ✓ · 1 dependency (zod) · MIT

```bash
npm i @almostjacked/fitness-tools
```

## Quick start

```ts
import { REGISTRY } from "@almostjacked/fitness-tools";

const tdee = REGISTRY.get("tdee")!;
const out = tdee.compute(tdee.input.parse({
  sex: "male", age: 30,
  height: { value: 180, unit: "cm" },
  weight: { value: 80, unit: "kg" },
  activity: "moderate",
}));
// out.results   → [{ method: "mifflin", value: 2759, ... }, { method: "harris", ... }]
// out.consensus → { mean: 2816.05, median: 2816.05, min: 2759, max: 2873.1, n: 2 }
```

Prefer raw functions? They're exported too, fully tree-shakeable:

```ts
import { mifflinBmr, activityMultiplier } from "@almostjacked/fitness-tools";
mifflinBmr("male", 80, 180, 30) * activityMultiplier("moderate"); // 2759
```

## Validated & self-describing

Every tool carries a [Zod](https://zod.dev) schema, so a single definition gives you
**runtime validation**, **static types**, and a **JSON-Schema** description — for one small
dependency. TypeScript can't catch a negative age or a body-fat of 200% at an untrusted
boundary like a form; the schema can:

```ts
const r = tdee.input.safeParse({ sex: "male", age: -5, /* ... */ });
if (!r.success) {
  // r.error.issues → structured, per-field errors you can render in a form
}
```

The same schemas describe each tool (`tool.input` / `tool.output`), which is how the
companion HTTP server generates its catalog and OpenAPI spec — no hand-written docs.

## Runs in the browser, no build step

```html
<script type="module">
  import { mifflinBmr } from "https://esm.sh/@almostjacked/fitness-tools";
  console.log(mifflinBmr("female", 65, 168, 28));
</script>
```

The package is isomorphic — zero Node-only APIs — so the identical code runs in a browser,
an edge function, or Node.

## Tools

<!-- tools:start -->
| Tool | Methods | Description |
|---|---|---|
| `tdee` | mifflin, harris, katch, cunningham | Estimate BMR and TDEE via Mifflin-St Jeor, Harris-Benedict, Katch-McArdle, and Cunningham. Provide body_fat or lean_mass to unlock the LBM-based methods. |
| `body-fat` | navy, jackson-pollock-3, deurenberg | Estimate body-fat % via US Navy circumference, Jackson-Pollock 3-site skinfold, and Deurenberg (BMI-based) methods. |
| `one-rep-max` | epley, brzycki, lombardi, wathan, oconner, mayhew | Estimate 1RM from a submaximal set via Epley, Brzycki, Lombardi, Wathan, O'Conner, and Mayhew; returns a %1RM load chart. |
| `macros` | g-per-kg | Compute protein/fat/carb grams for a calorie target using the g-per-kg-bodyweight method, with goal-based protein defaults. |
| `activity-multiplier` | lookup, neat-eat | Estimate the TDEE activity multiplier via the classic lookup table or a NEAT+EAT model (occupation/steps for non-exercise, training volume for exercise). |
| `powerlifting-attempts` | standard | Deterministic opener/second/third attempts from an estimated 1RM, plus a warmup ramp and per-side plate loading. Tunable by aggressiveness and available plates. |
| `muscle-potential` | casey-butt, ffmi-cap, berkhan | Estimate drug-free maximum bodyweight at a target body-fat % via Casey Butt (wrist+ankle), the FFMI~25 natural cap, and Berkhan's max-contest-weight model. Men only in v1. |
| `ffmi` | standard | Compute the Fat-Free Mass Index (FFMI) and its height-adjusted form from weight and body fat (or lean mass), and flag whether it exceeds the ~25 natural ceiling. |
| `rsmi` | direct, wen-2011 | Estimate the appendicular skeletal muscle index (RSMI) from a DXA value (direct) and/or an anthropometric estimate (Wen 2011), and flag low muscle mass against EWGSOP2, AWGS, and Baumgartner sarcopenia cutoffs. |
<!-- tools:end -->

Each tool runs several methods and reports a `consensus` (mean/median/min/max/n) across
them; methods whose inputs are missing are listed in `skipped` (or raise in explicit mode).
Units are explicit everywhere (`{ value, unit }`).

## Need it over HTTP?

There's a reference HTTP server — [`@almostjacked/fitness-tools-api`](../../apps/api) — that re-exposes
these calculators over HTTP for clients that can't `npm install` a TS package (other
languages, curl, no-code tools). It's optional: if you're in JS/TS, use this package
directly. The server adds a network boundary, not capability.

## License

MIT — free, open-source, and usable in commercial products. See [LICENSE](../../LICENSE).
Built on published formulas (Mifflin-St Jeor, US Navy, Jackson-Pollock, Epley, Casey Butt,
etc.); contributions welcome.
