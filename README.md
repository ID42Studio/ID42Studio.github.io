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
| Fonts | Self-hosted `@fontsource-variable` subsets (Instrument Sans, Manrope, Geist Mono) |
| Copy / i18n | Typed dictionaries in `src/i18n/` (`pt-BR.ts`, `en.ts`) |
| Hero | Hand-written WebGL shader (`src/scripts/hero-gl.ts`) + interactive execution console |
| SEO | Canonical + hreflang, Open Graph, JSON-LD, `@astrojs/sitemap`, `robots.txt` |
| Deploy | GitHub Actions → GitHub Pages (`gh-pages` branch) |

## Commands

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
npm run preview  # serve dist/ locally
npm run check    # astro check (types + template diagnostics)
npm run verify   # asserts on dist/: SEO, assets, i18n parity, budgets
npm run test:e2e # Playwright: playground re-render keeps styled structure
npm run ship     # check + build + verify + e2e
npm run assets   # re-render og.png, og-en.png and the app icons
```

## Structure

```
src/
  components/
    Landing.astro          # page composition
    sections/              # Header, Hero, AgentConsole, Marquee, Problem,
                           # Deliver, Cases, Solutions, Process, UseCases,
                           # About, Saaw, Labs, Cta, Footer
    ui/                    # Anchor, Brand, Icon, LocaleSwitch, SectionHead
  data/site.ts             # canonical URL, email, logo, optional LinkedIn
  i18n/                    # types + pt-BR / en copy + locale helpers
  layouts/Base.astro       # document shell, head, skip link
  lib/seo.ts               # canonical, hreflang, OG, JSON-LD graph
  lib/playground-data.ts   # bilingual cue lexicons + flow templates
  lib/exemplars.ts         # 36 process descriptions used as the retrieval corpus
  lib/embed.ts             # char n-gram TF-IDF vectors + cosine similarity
  lib/classify.ts          # hybrid classifier (lexicon + retrieval)
  pages/
    index.astro            # pt-BR at /
    en/index.astro         # English at /en/
    404.astro              # bilingual GitHub Pages 404 (single 404.html)
  scripts/site.ts          # progressive enhancement (no framework)
  scripts/hero-gl.ts       # hand-written WebGL signal field for the hero
  styles/global.css        # tokens, layout primitives, motion
public/
  fonts/                   # latin variable woff2 (preloaded)
  og.png, og-en.png        # 1200x630 cards (source: scripts/og-card.html)
  icon-192.png, icon-512.png, apple-touch-icon.png, favicon.svg
  manifest.webmanifest, robots.txt, llms.txt, .nojekyll
scripts/
  verify-site.mjs          # post-build gate on dist/
  render-assets.sh         # regenerates cards + icons (headless Chrome)
  og-card.html, icon-card.html
```

## Editing content

All visible copy lives in `src/i18n/pt-BR.ts` and `src/i18n/en.ts`, typed by
`src/i18n/types.ts`. Both files must satisfy the same `SiteContent` interface —
a missing translation is a type error, not a silent fallback.

Contact details live in `src/data/site.ts`: the email, the logo path, and
LinkedIn. LinkedIn stays off while `site.linkedin.published` is false (the
company page does not exist yet). Set that flag to true to restore the CTA,
the footer link and `sameAs`, and add the URL back to `public/llms.txt`.
The canonical URL lives in `astro.config.mjs` (`site`), used for canonical
tags and the sitemap.

### Page order

Hero, challenges, what we deliver, products, capabilities, the playground,
how we work, applications, the studio, the Software as a Work thesis, then
Labs. Section numbers in the copy follow that order, 01 to 10.

### Anchors

Each section keeps its Portuguese slug as the canonical id (`#entrega`,
`#solucoes`, `#saaw`, `#processo`, `#produtos`, `#estudio`, `#contato`).
`<Anchor name="…" />` adds an empty English alias (`#deliver`, `#solutions`,
`#work`, `#process`, `#studio`, `#contact`, and `#discovery` on the delivery
section). The English page navigates with those aliases; the Portuguese page
keeps the Portuguese ids. `npm run verify` fails if a section id is missing,
duplicated or out of order, if a `#anchor` points at nothing, or if either
locale's navigation uses the other locale's slugs.

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
- Open Graph, Twitter and hreflang sets complete, including `og:locale:alternate`; OG image exists on disk
- JSON-LD parses and carries Organization, ProfessionalService (with `logo`), WebSite and ItemList; `sameAs` lists LinkedIn only when that profile is published
- every section id present, in page order, numbered 01–10, with no duplicate ids, and every `#anchor` resolves
- each locale's navigation uses that locale's anchors
- every referenced asset exists in `dist/`; no external resource requests
- the 404 is `noindex` and contains both languages
- sitemap lists both URLs with `lastmod` and an `x-default` alternate for the default locale; `robots.txt` points at it
- LinkedIn is absent from the built pages while `site.linkedin.published` is false
- page weight budgets (HTML gzipped, total CSS)
- `pt-BR` and `en` dictionaries have identical key shapes and no empty strings
- the classifier passes 8 bilingual cases plus a noise case, and every one of the
  36 corpus exemplars classifies to its own label

`npm run test:e2e` then boots `dist/` under Playwright, types a new process into
the playground, and asserts step badges / neighbour columns / signal chips keep
their styled structure after the client re-render.

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
  readable and the console renders in its finished state.
- The WebGL hero field is decorative (`aria-hidden`) and disappears entirely
  without a hardware-accelerated context — the CSS aurora is the fallback.
- The execution console is real UI: labelled buttons, `aria-pressed` on the
  model switcher, `aria-current="step"` while running, and a polite live region
  announcing each stage and the outcome.
- Skip link, labelled nav/menu, `aria-current` on the language switch, visible
  focus rings, and semantic headings throughout.

## License

Proprietary — © ID42 Studio. All rights reserved.
