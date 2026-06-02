---
title: MCP server
description: Use the calculators as MCP tools from an agent or LLM client.
---

[`@almostjacked/fitness-tools-mcp`](https://www.npmjs.com/package/@almostjacked/fitness-tools-mcp)
is a [Model Context Protocol](https://modelcontextprotocol.io) stdio server. It exposes the
same calculators as the library and the HTTP API — identical math — as MCP tools, one tool
per calculator. No install required:

```bash
npx @almostjacked/fitness-tools-mcp
```

Works with any MCP-compatible client (Claude Code, Claude Desktop, Cursor, Windsurf, Zed,
Cline, Continue, and others).

## Add it to a client

### Claude Code

```bash
claude mcp add fitness-tools -- npx -y @almostjacked/fitness-tools-mcp
```

### Claude Desktop / generic client config

```json
{
  "mcpServers": {
    "fitness-tools": {
      "command": "npx",
      "args": ["-y", "@almostjacked/fitness-tools-mcp"]
    }
  }
}
```

## What the agent sees

Each calculator is a separate MCP tool (`tdee`, `body-fat`, `one-rep-max`, `macros`,
`activity-multiplier`, `powerlifting-attempts`, `muscle-potential`), with an input schema
generated from the same Zod definition that powers the library. Optional fields apply their
defaults — e.g. `tdee` runs all four formulas unless you pass `methods`.

A call returns both `structuredContent` (validated against the calculator's output schema)
and a JSON text fallback. So a `tdee` call with:

```json
{
  "sex": "male", "age": 30,
  "height": { "value": 180, "unit": "cm" },
  "weight": { "value": 80, "unit": "kg" },
  "activity": "moderate"
}
```

comes back with `results` (mifflin, harris, …) and a `consensus`, the same shape the
HTTP API and the library return.

Invalid input and domain errors (e.g. an unknown method) come back as tool errors
(`isError: true`) with a readable message — the server never crashes the session.

## Library vs. HTTP API vs. MCP

Same calculators, three protocols:

- **[`@almostjacked/fitness-tools`](/fitness-tools/guides/quick-start/)** — import and call in-process (browser or server).
- **`@almostjacked/fitness-tools-api`** — call over HTTP from any language or a no-code tool.
- **`@almostjacked/fitness-tools-mcp`** — wire the calculators into an agent or LLM client.
