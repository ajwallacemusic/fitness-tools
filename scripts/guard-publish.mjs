// Refuse to publish a workspace package with anything other than pnpm.
//
// pnpm rewrites `workspace:*` dependency ranges to concrete versions at pack
// time; `npm publish` ships them verbatim. A package published that way installs
// fine inside the monorepo but breaks for everyone else with
// `npm ERR! Unsupported URL Type "workspace:"` (EUNSUPPORTEDPROTOCOL) — which is
// exactly how @almostjacked/fitness-tools-mcp@0.1.0 shipped broken.
//
// Wired in as `prepublishOnly`, which runs on publish only (not pack/install),
// so it gates real releases without touching local builds. The changesets
// release flow shells out to `pnpm publish`, so CI passes this guard.
const ua = process.env.npm_config_user_agent ?? "";

if (!ua.includes("pnpm")) {
  console.error(
    [
      "",
      "✗ Refusing to publish: workspace packages must be released with pnpm, not npm.",
      "",
      "  npm ships `workspace:*` dependency ranges verbatim, producing an artifact that",
      "  fails to install for consumers (EUNSUPPORTEDPROTOCOL). pnpm rewrites them to real",
      "  versions at pack time.",
      "",
      "  Release via the changesets flow (open a PR with a changeset) or `pnpm publish`.",
      "",
    ].join("\n"),
  );
  process.exit(1);
}
