# ID42 Studio — design system

Dark, display-led, editorial. Near-black canvas, one signature gradient
(violet → blue → cyan), technical mono labels and very few decorative elements.
The page should read as an engineering studio, not an agency.

## Principles

1. **Type carries the design.** Huge display headings, tight tracking, short
   lines. No stock photography, no icon soup.
2. **One gradient family.** Blue `#5B7CFF`, violet `#A78BFA`, cyan `#3DE1FF`.
   Any other color must be justified.
3. **Hairlines over shadows.** Structure comes from 1px borders and spacing,
   not from cards floating in space.
4. **Motion explains state.** Reveals, the execution trace, the marquee. Motion
   never blocks reading and is disabled under `prefers-reduced-motion`.

## Tokens

Defined in `src/styles/global.css` under `@theme`.

| Token | Value | Use |
| --- | --- | --- |
| `--color-bg` | `#050507` | Page canvas |
| `--color-surface` | `#0d0d13` | Panels, trace background |
| `--color-surface-2` | `#121219` | Raised rows |
| `--color-line` | `#1c1c25` | Hairline borders, dividers |
| `--color-line-strong` | `#2a2a37` | Hover borders, chips |
| `--color-fg` | `#f4f4f6` | Primary text |
| `--color-muted` | `#9b9baa` | Body copy on dark |
| `--color-subtle` | `#6c6c7c` | Labels, metadata (decorative only) |
| `--color-blue` | `#5b7cff` | Primary accent, links, active states |
| `--color-violet` | `#a78bfa` | Gradient midpoint |
| `--color-cyan` | `#3de1ff` | Live status, focus ring, checks |

Radii: `8 / 12 / 16 / 24 / 32px` (`--radius-xs…xl`). Buttons are fully rounded
(999px); cards use `--radius-lg`.

## Typography

| Role | Family | Notes |
| --- | --- | --- |
| Display | Instrument Sans 500–650 | Fluid `clamp()` up to ~6.5rem, tracking `-0.06em`, line-height `0.92` |
| Body | Manrope 400–600 | 16px base, 1.65–1.7 line-height, max ~52–68ch, `text-wrap: pretty` |
| Labels | Geist Mono 400–500 | 11px, uppercase, tracking `0.14–0.2em` |

### Why this pairing

Bricolage Grotesque + Inter read as a common “startup landing” stack: display
was quirky at mid sizes and Inter is ubiquitous enough to feel generic next to
a technical studio brand. The replacement system is deliberately quieter and
more engineered:

- **Instrument Sans** (OFL, Instrument Foundry) — a refined geometric grotesk
  with optical tightness at large sizes, strong Portuguese diacritics, and
  enough character to carry the hero without competing with the brand mark.
- **Manrope** (OFL) — a highly legible geometric text face with open counters
  and even color; pairs with Instrument Sans through shared geometry while
  staying softer for long Portuguese paragraphs.
- **Geist Mono** (OFL, Vercel) — a contemporary mono for technical labels,
  console chrome and metadata; clearer at 11px than the previous JetBrains cut
  we shipped.

All three are variable `woff2` latin subsets under SIL OFL 1.1, self-hosted in
`public/fonts` (no CDN). Display + body are preloaded; mono rides the critical
path only when first used. `font-display: swap` plus metric-matched Arial
fallbacks (`size-adjust` / ascent / descent overrides) keep FOUT from shifting
layout. Display type stays at ≥1.45rem — below that Manrope takes over.

### Type scale

| Token | Size | Weight | Tracking | Line-height |
| --- | --- | --- | --- | --- |
| `.display-1` | `clamp(2.65rem, 7.2vw, 6.5rem)` | 550 | `-0.06em` | 0.92 |
| `.display-2` | `clamp(2rem, 4.6vw, 3.65rem)` | 550 | `-0.05em` | 1.0 |
| `.display-3` | `clamp(1.45rem, 2.3vw, 1.95rem)` | 550 | `-0.035em` | 1.1 |
| `.lead` | `clamp(1.05rem, 1.35vw, 1.2rem)` | 400 | `-0.012em` | 1.7 |
| Body | `1rem` | 400 | `-0.011em` | 1.65 |
| `.mono-label` | `0.6875rem` | 500 | `0.14em` | — |

`font-feature-settings: "ss01"` (and `"ss02"` on display) sharpen Instrument
Sans alternates; body uses `ss01` + `cv11` where available.

## Layout

- Content width: **1180px**, gutters `clamp(1.25rem, 4.2vw, 2.75rem)`.
- Section rhythm: `clamp(4.75rem, 9.5vw, 9rem)` block padding, hairline top
  border between sections.
- Section heads: mono eyebrow with a numeric index (`01`, `02`, …), display
  title (max 22ch), muted lead paragraph (max 52ch).
- Breakpoints: 640, 768, 900 (about), 1024 (nav + hero split), 1280.

## Components

| Pattern | Class | Notes |
| --- | --- | --- |
| Primary action | `.btn.btn--primary` | White fill, dark text; hover lifts and glows blue |
| Secondary action | `.btn.btn--ghost` | Hairline border, translucent fill |
| Panel | `.card` | Border + gradient fill; gradient border on hover |
| Pill / tag | `.pill` | Mono 11px, hairline border |
| Section label | `.eyebrow` | Mono, index in blue, leading rule |
| Live dot | `.dot-live` | Cyan, ping animation |
| Hero trace | `.trace` | Agent run illustration; steps cycle via JS |
| Product card | `.case-card` | Accent via `--case`, monogram, link at the bottom |

## Accessibility

- Body copy (`--color-muted` on `--color-bg`) is 7.4:1 — WCAG AAA for normal text.
  Headings are above 15:1. `--color-subtle` (5.1:1) is used only for short
  metadata, never for running text.
- Focus ring: 2px cyan with 3px offset, visible on every interactive element.
- The mobile menu is a labelled dialog: focus moves in, is trapped, background
  regions are `inert`, and focus returns to the toggle on close.
- The hero trace is decorative (`aria-hidden`) with an equivalent screen-reader
  description; the page is fully readable without JavaScript.

## Preferences

| Preference | Behaviour |
| --- | --- |
| `prefers-reduced-motion` | All animation and smooth scrolling disabled; reveals render immediately |
| `prefers-contrast: more` | Muted/subtle text and hairlines are promoted; gradient text falls back to solid |
| `forced-colors: active` | Borders use system colors; gradient text becomes `CanvasText` |
| Print | Chrome/nav/motion dropped, white background, black text, underlined links |

Numbers and metadata use `font-variant-numeric: tabular-nums` so counters and
labels never shift while the console advances.

## Hero field and execution console

The hero has two custom pieces, both dependency-free:

- **Signal field** — `src/scripts/hero-gl.ts` compiles a hand-written GLSL
  fragment shader (domain-warped fbm) into a fullscreen triangle, rendered at a
  fixed ~460k fragment budget and paused when the canvas leaves the viewport or
  the tab is hidden. It reacts to the pointer and to hero scroll.
- **Execution console** — `components/sections/AgentConsole.astro` is a working
  demo: three delivery models (Build / Operate / Outcome), each with five stages
  and an outcome. It runs itself once after load, can be replayed, and is fully
  operable by keyboard.

Both degrade on purpose: without WebGL, on a software rasteriser
(SwiftShader/llvmpipe/headless), when a single frame costs more than ~45 ms, or
under `prefers-reduced-motion`, the field is dropped and the CSS aurora stays.
Append `?gl=force` to bypass the performance guards when inspecting the shader.


## Playground engine

The playground is a hybrid scorer, entirely local:

1. **Lexicon** — bilingual cue lists (model + domain), stem tolerant, accent
   insensitive. High precision, explains itself with the matched terms.
2. **Vector retrieval** — character 3–4-grams per word, TF-IDF, cosine
   similarity against a corpus of 36 hand-written process descriptions
   (`src/lib/exemplars.ts`). High recall: it tolerates paraphrase and phrasing
   it has never seen as a cue.
3. **Combination** — 58% vectors / 42% lexicon when both fire; the winner is
   shown with a confidence that blends separation (top vs. runner-up) with
   evidence mass, plus the three closest examples and their similarity.

### Why not a neural embedding model

| Candidate | Size | Problem |
| --- | --- | --- |
| `all-MiniLM-L6-v2` (q8) | ~23 MB | English only — fails on the primary locale |
| `paraphrase-multilingual-MiniLM` (q8) | ~120 MB | 250k-token vocabulary dominates the file |
| `multilingual-e5-small` (q8) | ~118 MB | same vocabulary cost |

A multilingual encoder cannot shrink below ~60 MB because of its vocabulary, and
60–120 MB is two orders of magnitude above the whole page (169 KB). Shipping an
English-only model behind a "multilingual" site would be worse than shipping
none: it would classify Portuguese text at random.

The vector space above is the largest capability that fits the page's own
performance thesis. If a real multilingual encoder is ever wanted, it belongs
behind an explicit, metered download — not in the default path.

## Performance budget

Measured on the deployed site (Lighthouse, mobile emulation):

| Metric | Value |
| --- | --- |
| Performance / Accessibility / Best practices / SEO | 99 / 100 / 100 / 100 |
| FCP · LCP · CLS · TBT | 1.4 s · 1.4 s · 0 · 60 ms |
| Transferred on first load | ~110 KB (fonts are ~78 KB of it) |
| Requests | document + 3 font files + 2 small modules |

Rules that keep it there:

- No JavaScript framework. `src/scripts/site.ts` and `hero-gl.ts` are the only
  JS; the shader boots from an idle slot after `load` so it never competes with
  the first paint.
- CSS is inlined at build time (`inlineStylesheets: "always"`) — one request,
  no render-blocking stylesheet.
- The scroll handler never reads layout: the scroll range is measured once and
  refreshed on `load`/`resize`.
- Fonts are latin-only variable woff2 files, self-hosted and preloaded.
- Playground client updates clone Astro `<template>` nodes (global `.pg-*`
  styles) so re-renders never lose structure or styling.
- `npm run verify` fails the build over 28 KB HTML (gzip) or 80 KB of CSS.
- `npm run test:e2e` runs a Playwright check that types into the playground and
  asserts step badges, neighbour columns and signal chips stay styled.

## Assets

`public/` ships the two social cards (`og.png`, `og-en.png`), the app icon set
(`icon-192`, `icon-512`, `apple-touch-icon`), `favicon.svg`, `manifest.webmanifest`,
`robots.txt` and `llms.txt`. All are generated from sources in `scripts/` via
`npm run assets` — no binary is hand-edited.
