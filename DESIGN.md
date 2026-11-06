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
| Display | Bricolage Grotesque 500–700 | `clamp()` up to 6.9rem, tracking `-0.055em`, line-height `0.9` |
| Body | Inter 400–600 | 16px base, 1.6–1.7 line-height, `text-wrap: pretty` |
| Labels | JetBrains Mono 400–500 | 11px, uppercase, tracking `0.16–0.2em` |

Only latin subsets are shipped (`public/fonts`, preloaded). Display type is
never used below 1.5rem, where Bricolage loses its character.

## Layout

- Content width: **1200px**, gutters `clamp(1.25rem, 4vw, 2.5rem)`.
- Section rhythm: `clamp(4.5rem, 9vw, 8.5rem)` block padding, hairline top
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
labels never shift while the hero trace advances.

## Performance budget

Measured on the deployed site (Lighthouse, mobile emulation):

| Metric | Value |
| --- | --- |
| Performance / Accessibility / Best practices / SEO | 99 / 100 / 100 / 100 |
| FCP · LCP · CLS · TBT | 1.2 s · 1.6 s · 0 · 0 ms |
| Transferred on first load | ~130 KB (fonts are 129 KB of it) |
| Requests | document + 3 font files, nothing else |

Rules that keep it there:

- No JavaScript framework. `src/scripts/site.ts` is the only JS and ships inline.
- CSS is inlined at build time (`inlineStylesheets: "always"`) — one request,
  no render-blocking stylesheet.
- The scroll handler never reads layout: the scroll range is measured once and
  refreshed on `load`/`resize`.
- Fonts are latin-only variable woff2 files, self-hosted and preloaded.
- `npm run verify` fails the build over 28 KB HTML (gzip) or 80 KB of CSS.

## Assets

`public/` ships the two social cards (`og.png`, `og-en.png`), the app icon set
(`icon-192`, `icon-512`, `apple-touch-icon`), `favicon.svg`, `manifest.webmanifest`,
`robots.txt` and `llms.txt`. All are generated from sources in `scripts/` via
`npm run assets` — no binary is hand-edited.
