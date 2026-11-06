# ID42 Studio — website

Static, bilingual (pt-BR / en) one-page site for **ID42 Studio**, built with
[Astro](https://astro.build) and Tailwind CSS v4, deployed to GitHub Pages at
<https://id42studio.github.io>.

No server, no runtime framework, no third-party requests: the whole page is
~130 KB on first load, including self-hosted variable fonts.

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
npm run verify   # asserts on dist/: SEO, assets, i18n parity, budgets
npm run ship     # check + build + verify (what CI runs)
npm run assets   # re-render og.png, og-en.png and the app icons
```

## Structure

```
src/
  components/
    Landing.astro          # page composition
    sections/              # Header, Hero, Marquee, Problem, Solutions,
                           # Process, UseCases, Cases, About, Labs, Discovery,
                           # Cta, Footer
    ui/                    # Anchor, Brand, Icon, LocaleSwitch, SectionHead
  data/site.ts             # canonical URL, email, LinkedIn, helpers
  i18n/                    # types + pt-BR / en copy + locale helpers
  layouts/Base.astro       # document shell, head, skip link
  lib/seo.ts               # canonical, hreflang, OG, JSON-LD graph
  pages/
    index.astro            # pt-BR at /
    en/index.astro         # English at /en/
    404.astro              # GitHub Pages 404
  scripts/site.ts          # progressive enhancement (no framework)
  styles/global.css        # tokens, layout primitives, motion
public/
  fonts/                   # latin variable woff2 (preloaded)
  og.png, og-en.png        # 1200x630 cards (source: scripts/og-card.html)
  icon-192.png, icon-512.png, apple-touch-icon.png, favicon.svg
  manifest.webmanifest, robots.txt, llms.txt, .nojekyll
scripts/
  verify-site.mjs          # post-build gate: 20 assertions on dist/
  render-assets.sh         # regenerates cards + icons (headless Chrome)
  og-card.html, icon-card.html
```

## Editing content

All visible copy lives in `src/i18n/pt-BR.ts` and `src/i18n/en.ts`, typed by
`src/i18n/types.ts`. Both files must satisfy the same `SiteContent` interface —
a missing translation is a type error, not a silent fallback.

Contact details (email, LinkedIn) are in `src/data/site.ts`. The canonical URL
lives in `astro.config.mjs` (`site`), used for canonical tags and the sitemap.

### Anchors

Each section keeps its Portuguese slug as the canonical id (`#solucoes`,
`#processo`, `#produtos`, `#estudio`, `#contato`). `<Anchor name="…" />` adds an
empty English alias (`#solutions`, `#work`, `#studio`…) so old shared links keep
working; `npm run verify` fails if a section id is missing, duplicated or if a
`#anchor` in either page points at nothing.

### Social cards and icons

`scripts/og-card.html` renders both social cards (pass `#en` for English) and
`scripts/icon-card.html` renders the app icons. Regenerate everything with:

```bash
npm run assets          # uses `google-chrome`; override with CHROME=/path/to/chrome
```

Output: `public/og.png`, `public/og-en.png`, `public/icon-192.png`,
`public/icon-512.png`, `public/apple-touch-icon.png`.

## Quality gate

`npm run verify` runs after `astro build` and fails the CI job when an invariant
breaks:

- both locales rendered, one `<h1>` each, correct `lang` and canonical
- title/description lengths inside search-safe ranges
- Open Graph, Twitter and hreflang sets complete; OG image exists on disk
- JSON-LD parses and carries Organization, WebSite and ItemList
- every section id present, no duplicate ids, every `#anchor` resolves
- every referenced asset exists in `dist/`; no external resource requests
- sitemap lists both URLs, `robots.txt` points at it
- page weight budgets (HTML gzipped, total CSS)
- `pt-BR` and `en` dictionaries have identical key shapes and no empty strings

## Deploying to GitHub Pages

The site is live at <https://id42studio.github.io> (pt-BR) and
<https://id42studio.github.io/en> (English).

- Repository: `ID42Studio/ID42Studio.github.io`
- Pages source: **Deploy from a branch** → `gh-pages` → `/ (root)`
- `.github/workflows/deploy.yml` runs on every push to `main`: it installs,
  type-checks, builds and force-pushes `dist/` to the `gh-pages` branch, which
  triggers the Pages build. `public/.nojekyll` keeps `_astro/` assets served.

Assets are referenced from the domain root, so no `base` is configured. If the
site ever moves to a project page (`/repo-name/`) or a custom domain, update
`site` (and add `base`) in `astro.config.mjs`.

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
