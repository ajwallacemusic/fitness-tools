// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

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
      sidebar: [{ label: "Guides", autogenerate: { directory: "guides" } }],
    }),
  ],
});
