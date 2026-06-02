# @almostjacked/fitness-tools-mcp

An [MCP](https://modelcontextprotocol.io) stdio server that exposes the
[`@almostjacked/fitness-tools`](../../packages/core) calculators as MCP tools —
one tool per calculator (TDEE, body fat, 1RM, macros, activity multiplier,
powerlifting attempts, muscle potential). Same math as the library and the
[HTTP API](../api); the only difference is the protocol.

Works with any MCP-compatible client (Claude Code, Claude Desktop, Cursor,
Windsurf, Zed, Cline, Continue, and others).

## Use it

No install required:

```bash
npx @almostjacked/fitness-tools-mcp
```

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

## Tools

Each tool returns both `structuredContent` (validated against the calculator's
output schema) and a JSON text fallback. Invalid input and domain errors come
back as tool errors (`isError: true`), not crashes.

## Develop

```bash
pnpm -C apps/mcp test       # vitest (in-memory client/server)
pnpm -C apps/mcp build      # emit dist/
pnpm -C apps/mcp dev        # tsx watch (stdio)
```
