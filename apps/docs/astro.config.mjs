// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
// starlight-openapi pinned <0.23: 0.23+ requires Starlight >=0.38 / Astro 6 (we're on Starlight 0.34 / Astro 5).
import starlightOpenAPI, { openAPISidebarGroups } from "starlight-openapi";
// starlight-typedoc pinned 0.21.x: 0.22+ requires Starlight >=0.39 (we're on Starlight 0.34 / Astro 5).
import starlightTypeDoc, { typeDocSidebarGroup } from "starlight-typedoc";

export default defineConfig({
  site: "https://ajwallacemusic.github.io",
  base: "/fitness-tools",
  integrations: [
    starlight({
      title: "Fitness Tools",
      social: [
        { icon: "github", label: "GitHub", href: "https://github.com/ajwallacemusic/fitness-tools" },
      ],
      editLink: {
        baseUrl: "https://github.com/ajwallacemusic/fitness-tools/edit/main/apps/docs/",
      },
      plugins: [
        starlightOpenAPI([
          { base: "api", label: "HTTP API", schema: "./src/openapi.json" },
        ]),
        starlightTypeDoc({
          entryPoints: ["../../packages/core/src/index.ts"],
          tsconfig: "../../packages/core/tsconfig.json",
          output: "reference",
          sidebar: { label: "API Reference" },
        }),
      ],
      sidebar: [
        { label: "Guides", autogenerate: { directory: "guides" } },
        { label: "Tools", autogenerate: { directory: "tools" } },
        { label: "MCP", autogenerate: { directory: "mcp" } },
        typeDocSidebarGroup,
        ...openAPISidebarGroups,
      ],
    }),
  ],
});
