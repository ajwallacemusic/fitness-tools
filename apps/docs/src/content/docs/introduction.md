---
title: Introduction
description: What Fitness Tools is, and why it works the way it does.
---

**Fitness Tools** is a set of deterministic fitness calculators — TDEE, body fat, one-rep max,
macros, activity multiplier, powerlifting attempts, muscular potential, FFMI, and RSMI.

## Why it exists

Most fitness calculators give you one number from one formula and hide the math. But experts
don't agree on a single formula — there are several published equations for most of these
metrics, and they disagree. Fitness Tools runs **all the applicable published formulas** and
reports a **consensus** (mean, median, and the min–max range) across them. You get a defensible
*range* and can see every method that produced it, instead of trusting one black box.

Two more things follow from that stance:

- **Validated input.** Every tool carries a [Zod](https://zod.dev) schema, so bad input
  (a negative age, an impossible body-fat) is caught at the boundary with structured, per-field
  errors — the same schema also generates the API docs.
- **Runs anywhere.** The library is isomorphic — no Node-only APIs — so the identical code runs
  in a browser, an edge function, or a server, with one small dependency.

## One core, three protocols

The calculators live in one library; everything else is the same math behind a different
transport:

- **`@almostjacked/fitness-tools`** — the npm **library**. The product. Install, import, call.
- **`@almostjacked/fitness-tools-api`** — a reference **HTTP server** over the library, for
  non-JS or remote callers.
- **`@almostjacked/fitness-tools-mcp`** — an **MCP server** over the library, for agents and
  LLM clients.

Same inputs, same outputs, same consensus — the only difference is how you call it.

## Where to next

- New here? **[Get started](/fitness-tools/start-here/getting-started/)** — install and run your
  first calculation, then **[plan a cut](/fitness-tools/start-here/plan-a-cut/)** end-to-end.
- Browse what each calculator does in **[Tools](/fitness-tools/tools/tdee/)**.
- Understand the design in **[Concepts](/fitness-tools/concepts/methods-and-consensus/)**.
