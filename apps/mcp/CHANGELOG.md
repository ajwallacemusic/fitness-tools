# @almostjacked/fitness-tools-mcp

## 0.1.1

### Patch Changes

- 0414680: Fix the broken 0.1.0 release. That version was published with `npm publish`, which
  ships `workspace:*` dependency ranges verbatim, so `npx @almostjacked/fitness-tools-mcp`
  failed with `Unsupported URL Type "workspace:"` (EUNSUPPORTEDPROTOCOL) and the MCP
  server never started. Republishing through the pnpm/changesets pipeline resolves the
  `@almostjacked/fitness-tools` dependency to a concrete version. A `prepublishOnly`
  guard now blocks accidental `npm publish` of workspace packages to prevent a recurrence.

## 0.1.0

### Minor Changes

- e605961: Add `@almostjacked/fitness-tools-mcp`: an MCP stdio server exposing the fitness
  calculators as MCP tools (one per calculator), with structured output and a JSON
  text fallback. Runnable via `npx @almostjacked/fitness-tools-mcp`.
