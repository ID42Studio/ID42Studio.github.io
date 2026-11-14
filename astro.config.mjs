// @ts-check
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import { previewBase, rewriteCssUrls } from "./scripts/preview-base.mjs";
import { site } from "./src/data/site.ts";

const llmsTemplate = fileURLToPath(new URL("./public/llms.txt", import.meta.url));

/** `public/llms.txt` keeps a placeholder so the address lives only in `site.email`. */
/** @param {string} text */
function stampLlms(text) {
  return text.replaceAll("{{email}}", site.email);
}

/** @param {string | undefined} url */
function isLlmsRequest(url) {
  const path = url?.split("?")[0] ?? "";
  return path === "/llms.txt" || path.endsWith("/llms.txt");
}

/** @returns {import("astro").AstroIntegration} */
function contactEmail() {
  return {
    name: "contact-email",
    hooks: {
      "astro:config:setup": ({ updateConfig }) => {
        updateConfig({
          vite: {
            plugins: [
              {
                name: "contact-email-dev",
                configureServer(server) {
                  server.middlewares.use((req, res, next) => {
                    if (!isLlmsRequest(req.url)) return next();
                    res.setHeader("Content-Type", "text/plain; charset=utf-8");
                    res.end(stampLlms(readFileSync(llmsTemplate, "utf8")));
                  });
                },
              },
            ],
          },
        });
      },
      "astro:build:done": ({ dir }) => {
        const target = fileURLToPath(new URL("llms.txt", dir));
        writeFileSync(target, stampLlms(readFileSync(llmsTemplate, "utf8")));
      },
    },
  };
}

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

/** @type {import("astro").AstroIntegration} */
const sitemapIntegration = sitemap({
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
});

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
  // The contact integration stamps llms.txt in both builds.
  integrations: preview ? [contactEmail()] : [contactEmail(), sitemapIntegration],
  build: {
    // One page, one render path: inlining the stylesheet removes the two
    // render-blocking requests without meaningfully growing the document.
    inlineStylesheets: "always",
  },
  vite: {
    plugins: [tailwindcss(), prefixPublicCss(base)],
  },
});
