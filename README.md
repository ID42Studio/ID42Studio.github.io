# ID42 Studio — website

Static, bilingual (pt-BR / en) one-page site for **ID42 Studio**, built with
[Astro](https://astro.build) and Tailwind CSS v4, deployed to GitHub Pages at
<https://id42studio.github.io>.

No server, no runtime framework, no third-party requests: the whole page is
~140 KB on first load, including self-hosted variable fonts.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Astro 7 (static output) |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` + design tokens in `src/styles/global.css` |
| Fonts | Self-hosted `@fontsource-variable` subsets (Bricolage Grotesque, Inter, JetBrains Mono) |
| Copy / i18n | Typed dictionaries in `src/i18n/` (`pt-BR.ts`, `en.ts`) |
| SEO | Canonical + hreflang, Open Graph, JSON-LD, `@astrojs/sitemap`, `robots.txt` |
| Deploy | GitHub Actions → GitHub Pages (`actions/deploy-pages`) |

## Commands

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
npm run preview  # serve dist/ locally
npm run check    # astro check (types + template diagnostics)
```

## Structure

```
src/
  components/
    Landing.astro          # page composition
    sections/              # Header, Hero, Marquee, Problem, Solutions,
                           # Process, UseCases, Cases, About, Cta, Footer
    ui/                    # Brand, Icon, LocaleSwitch, SectionHead
  data/site.ts             # canonical URL, email, LinkedIn, helpers
  i18n/                    # types + pt-BR / en copy + locale helpers
  layouts/Base.astro       # <head>, SEO, JSON-LD, fonts, skip link
  pages/
    index.astro            # pt-BR at /
    en/index.astro         # English at /en/
    404.astro              # GitHub Pages 404
  scripts/site.ts          # progressive enhancement (no framework)
  styles/global.css        # tokens, layout primitives, motion
public/
  fonts/                   # latin variable woff2 (preloaded)
  og.png                   # 1200x630 social card (source: scripts/og-card.html)
  favicon.svg, apple-touch-icon.png, robots.txt, .nojekyll
```

## Editing content

All visible copy lives in `src/i18n/pt-BR.ts` and `src/i18n/en.ts`, typed by
`src/i18n/types.ts`. Both files must satisfy the same `SiteContent` interface —
a missing translation is a type error, not a silent fallback.

Contact details (email, LinkedIn) are in `src/data/site.ts`. The canonical URL
lives in `astro.config.mjs` (`site`), used for canonical tags and the sitemap.

### Social card

`scripts/og-card.html` is the source artwork for `public/og.png`. It is rendered
with headless Chrome at 1200×630:

```bash
google-chrome --headless --screenshot=public/og.png \
  --window-size=1200,630 scripts/og-card.html
```

## Deploying to GitHub Pages

1. Create the repository `ID42Studio/ID42Studio.github.io` (public).
2. Push this project to `main`.
3. In **Settings → Pages**, set **Source** to *GitHub Actions*.
4. The `deploy` workflow builds and publishes on every push to `main`.

The site is served from the domain root, so no `base` path is configured. If it
moves to a project page (`/repo-name/`) or a custom domain, update `site` in
`astro.config.mjs` and add a `base` value.

## Motion and accessibility

- Animations are CSS-first and respect `prefers-reduced-motion`.
- Progressive enhancement only: with JavaScript disabled the page is fully
  readable; the hero trace simply stays on its first step.
- Skip link, labelled nav/menu, `aria-current` on the language switch, visible
  focus rings, and semantic headings throughout.
- The decorative hero trace is `aria-hidden` and mirrored by a screen-reader
  description.

## License

Proprietary — © ID42 Studio. All rights reserved.
