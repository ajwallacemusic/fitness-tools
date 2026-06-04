# CLAUDE.md

**Read [`AGENTS.md`](./AGENTS.md) first** — it is the canonical guide to this repo
(layout, setup, commands, the golden rules, and how to add a calculator). Everything
there applies to Claude Code.

## Claude-Code-specific notes

- This repo uses the **superpowers spec→plan→implement** workflow. Design specs live in
  `docs/superpowers/specs/` and implementation plans in `docs/superpowers/plans/`
  (both are gitignored — local working docs). Before non-trivial work, brainstorm a
  spec, then write a plan, then implement task-by-task.
- The two hardest-to-reverse rules are worth repeating: **never change a pinned
  reference value to make a test pass**, and **a changed calculator output is a major
  version bump** (outputs are the public contract).
