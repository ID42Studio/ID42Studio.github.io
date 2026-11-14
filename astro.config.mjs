// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

const SITE = "https://id42studio.github.io";

// https://astro.build/config
export default defineConfig({
  site: SITE,
  // The default locale is served at the root: `/` (pt-BR) and `/en/` (English).
  // GitHub Pages is static-only, so routing is resolved at build time.
  i18n: {
    defaultLocale: "pt-BR",
    locales: ["pt-BR", "en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      lastmod: new Date(),
      i18n: {
        defaultLocale: "pt-BR",
        locales: { "pt-BR": "pt-BR", en: "en" },
      },
      serialize(item) {
        const links = [...(item.links ?? [])];
        if (!links.some((link) => link.lang === "x-default")) {
          const fallback = links.find((link) => link.lang === "pt-BR")?.url ?? `${SITE}/`;
          links.push({ lang: "x-default", url: fallback });
        }
        return { ...item, links };
      },
    }),
  ],
  build: {
    // One page, one render path: inlining the stylesheet removes the two
    // render-blocking requests without meaningfully growing the document.
    inlineStylesheets: "always",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
