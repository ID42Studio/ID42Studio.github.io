// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import { previewBase, rewriteCssUrls } from "./scripts/preview-base.mjs";

const SITE = "https://id42studio.github.io";
const base = previewBase(process.env.SITE_BASE ?? "/");
const preview = base !== "/";

/** Root-absolute public files (fonts) are not rewritten by Vite's base. Prefix them for previews. */
/** @param {string} basePath */
function prefixPublicCss(basePath) {
  return {
    name: "prefix-public-css-urls",
    enforce: /** @type {"post"} */ ("post"),
    /**
     * @param {string} code
     * @param {string} id
     */
    transform(code, id) {
      if (basePath === "/" || typeof code !== "string") return null;
      const file = id.split("?")[0];
      if (!file.endsWith(".css")) return null;
      const next = rewriteCssUrls(code, basePath);
      return next === code ? null : next;
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: SITE,
  // Production is served at the domain root. PR previews set SITE_BASE to
  // /pr-preview/pr-<N>/ so assets, links and canonical URLs stay inside that directory.
  base,
  outDir: process.env.OUT_DIR ?? "dist",
  // The default locale is served at the root: `/` (pt-BR) and `/en/` (English).
  // GitHub Pages is static-only, so routing is resolved at build time.
  i18n: {
    defaultLocale: "pt-BR",
    locales: ["pt-BR", "en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  // Preview URLs must not appear in a sitemap. Production keeps the current sitemap.
  integrations: preview
    ? []
    : [
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
    plugins: [tailwindcss(), prefixPublicCss(base)],
  },
});
