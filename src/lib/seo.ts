import { publishedProfiles, site } from "../data/site";
import { getContent, htmlLang, pagePath, type Locale, type SiteContent } from "../i18n";
import { isPreview, withBase } from "./base";

export interface SeoInput {
  locale: Locale;
  /** Canonical path for this page. Defaults to the locale root. */
  path?: string;
  /**
   * Shared slug for a page that exists in both locales (`one-pager` →
   * `/one-pager/` and `/en/one-pager/`). Omit on the locale home.
   */
  slug?: string;
  title?: string;
  description?: string;
  noindex?: boolean;
}

export interface Seo {
  content: SiteContent;
  lang: string;
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  ogLocaleAlternate: string;
  alternates: { hreflang: string; href: string }[];
  robots: string;
  schema: Record<string, unknown>;
}

/** Absolute URL for a root-absolute path, including the preview base when one is configured. */
function abs(path: string): string {
  return new URL(withBase(path), site.url).href;
}

/**
 * Origin used in structured data. Production stays `https://id42studio.github.io`
 * (no trailing slash). A preview uses its own directory so it does not claim
 * the production canonical identity.
 */
function rootHref(): string {
  return abs("/").replace(/\/$/, "");
}

/** Locale homes. Preview builds use this set on every page: the trusted publisher checks it. */
function homeAlternates(): { hreflang: string; href: string }[] {
  return [
    { hreflang: "pt-BR", href: abs("/") },
    { hreflang: "en", href: abs("/en/") },
    { hreflang: "x-default", href: abs("/") },
  ];
}

/** hreflang set. A slug points at that page; the home page stays the default. */
function pageAlternates(slug: string): { hreflang: string; href: string }[] {
  const clean = slug.replace(/^\/|\/$/g, "");
  const portuguese = abs(`/${clean}/`);
  return [
    { hreflang: "pt-BR", href: portuguese },
    { hreflang: "en", href: abs(`/en/${clean}/`) },
    { hreflang: "x-default", href: portuguese },
  ];
}

/** Single source of truth for everything that goes into <head>. */
export function buildSeo({ locale, path, slug, title, description, noindex = false }: SeoInput): Seo {
  const content = getContent(locale);
  const canonical = abs(path ?? pagePath(locale));
  const preview = isPreview();

  return {
    content,
    lang: htmlLang(locale),
    title: title ?? content.meta.title,
    description: description ?? content.meta.description,
    canonical,
    ogImage: abs(locale === "en" ? "/og-en.png" : "/og.png"),
    ogLocaleAlternate: getContent(locale === "en" ? "pt-BR" : "en").meta.ogLocale,
    alternates: preview || !slug ? homeAlternates() : pageAlternates(slug),
    robots: preview
      ? "noindex, nofollow"
      : noindex
        ? "noindex, follow"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    schema: buildSchema(content, locale),
  };
}

/** Organization (also a ProfessionalService) + WebSite + shipped products, as one @graph. */
function buildSchema(content: SiteContent, locale: Locale): Record<string, unknown> {
  const sameAs = publishedProfiles();
  const root = rootHref();

  const organization = {
    "@type": ["Organization", "ProfessionalService"],
    "@id": `${root}/#organization`,
    name: site.name,
    url: root,
    logo: {
      "@type": "ImageObject",
      url: abs(site.logo),
      width: 512,
      height: 512,
    },
    email: site.email,
    description: content.meta.description,
    areaServed: { "@type": "Country", name: "Brazil" },
    ...(sameAs.length > 0 ? { sameAs } : {}),
    knowsAbout: [
      "Software engineering",
      "Solution architecture",
      "Systems integration",
      "AI agents",
      "Retrieval-augmented generation",
      "Digital products",
      "ERP",
      "Odoo",
      "Workflow automation",
      "Product engineering",
      "Intelligent operations",
      "Software as a Work",
    ],
  };

  const website = {
    "@type": "WebSite",
    "@id": `${root}/#website`,
    url: root,
    name: site.name,
    inLanguage: ["pt-BR", "en"],
    publisher: { "@id": `${root}/#organization` },
  };

  const products = {
    "@type": "ItemList",
    "@id": `${root}/#products`,
    name: locale === "en" ? "Projects and products" : "Projetos e produtos",
    itemListElement: content.work.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
      description: `${item.category}. ${item.solution}`,
    })),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [organization, website, products],
  };
}
