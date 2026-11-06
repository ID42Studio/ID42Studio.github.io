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
      i18n: {
        defaultLocale: "pt-BR",
        locales: { "pt-BR": "pt-BR", en: "en" },
      },
    }),
  ],
  build: {
    inlineStylesheets: "auto",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
