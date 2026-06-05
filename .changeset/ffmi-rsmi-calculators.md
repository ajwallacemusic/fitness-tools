---
"@almostjacked/fitness-tools": minor
"@almostjacked/fitness-tools-mcp": minor
---

Add FFMI and RSMI body-composition calculators.

- `ffmi` — Fat-Free Mass Index: raw and height-adjusted FFMI from weight and body fat (or lean mass), with a natural-limit flag (compared against the height-normalized value).
- `rsmi` — Relative Skeletal Muscle Index: from a DXA value (`direct`) and/or an anthropometric estimate (`wen-2011`), flagged against EWGSOP2, AWGS, and Baumgartner sarcopenia cutoffs.

Additive only — no existing calculator outputs change. Both tools are exposed over the MCP server as well.
