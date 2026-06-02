---
"@almostjacked/fitness-tools-mcp": patch
---

Fix the broken 0.1.0 release. That version was published with `npm publish`, which
ships `workspace:*` dependency ranges verbatim, so `npx @almostjacked/fitness-tools-mcp`
failed with `Unsupported URL Type "workspace:"` (EUNSUPPORTEDPROTOCOL) and the MCP
server never started. Republishing through the pnpm/changesets pipeline resolves the
`@almostjacked/fitness-tools` dependency to a concrete version. A `prepublishOnly`
guard now blocks accidental `npm publish` of workspace packages to prevent a recurrence.
