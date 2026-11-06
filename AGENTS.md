# AGENTS.md

Project notes for AI coding agents working in this repository.

## What this is

A static, bilingual one-page site (Astro 7 + Tailwind v4) for ID42 Studio,
deployed to GitHub Pages at the domain root (`https://id42studio.github.io`).

## Rules

- **Copy is data, not markup.** Every user-visible string lives in
  `src/i18n/pt-BR.ts` and `src/i18n/en.ts` and must satisfy `SiteContent`
  (`src/i18n/types.ts`). Never hardcode Portuguese or English text in a
  component.
- **Keep output static.** No server adapters, no client framework islands, no
  runtime data fetching. GitHub Pages serves files only.
- **No external requests.** Fonts are self-hosted in `public/fonts`; no CDN,
  no analytics scripts, no remote images.
- **Tokens before hex.** Colors, radii, fonts and easing come from `@theme` in
  `src/styles/global.css`. Add a token instead of inlining a new color.
- **Respect reduced motion.** Any new animation must be disabled under
  `prefers-reduced-motion: reduce` and must not be required to read content.
- **English in the repo, Portuguese in the browser.** Commits, comments, docs
  and identifiers are English; site copy follows the locale dictionaries.

## Commands

```bash
npm run dev       # dev server on :4321
npm run build     # static build into dist/
npm run preview   # serve dist/
npm run check     # astro check — must pass before committing
```

## Structure

- `src/components/Landing.astro` composes the page from `sections/*`.
- `src/components/ui/` holds primitives (Brand, Icon, LocaleSwitch, SectionHead).
- `src/layouts/Base.astro` owns `<head>`, SEO, JSON-LD, font preloads.
- `src/scripts/site.ts` is the only JavaScript: nav state, reveals, mobile menu,
  the hero trace cycle and pointer parallax. Keep it under a few KB.

## Astro docs

Full documentation: https://docs.astro.build

- Routing and i18n: https://docs.astro.build/en/guides/internationalization/
- Styling / Tailwind: https://docs.astro.build/en/guides/styling/
- Components: https://docs.astro.build/en/basics/astro-components/
