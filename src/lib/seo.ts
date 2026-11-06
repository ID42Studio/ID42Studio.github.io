import { site } from "../data/site";
import { getContent, htmlLang, pagePath, type Locale, type SiteContent } from "../i18n";

export interface SeoInput {
  locale: Locale;
  /** Canonical path for this page. Defaults to the locale root. */
  path?: string;
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
  alternates: { hreflang: string; href: string }[];
  robots: string;
  schema: Record<string, unknown>;
}

/** Single source of truth for everything that goes into <head>. */
export function buildSeo({ locale, path, title, description, noindex = false }: SeoInput): Seo {
  const content = getContent(locale);
  const canonical = new URL(path ?? pagePath(locale), site.url).href;

  return {
    content,
    lang: htmlLang(locale),
    title: title ?? content.meta.title,
    description: description ?? content.meta.description,
    canonical,
    ogImage: `${site.url}${locale === "en" ? "/og-en.png" : "/og.png"}`,
    alternates: [
      { hreflang: "pt-BR", href: `${site.url}/` },
      { hreflang: "en", href: `${site.url}/en/` },
      { hreflang: "x-default", href: `${site.url}/` },
    ],
    robots: noindex
      ? "noindex, follow"
      : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    schema: buildSchema(content, locale),
  };
}

/** Organization + WebSite + shipped products, as a single @graph. */
function buildSchema(content: SiteContent, locale: Locale): Record<string, unknown> {
  const organization = {
    "@type": "Organization",
    "@id": `${site.url}/#organization`,
    name: site.name,
    url: site.url,
    email: site.email,
    description: content.meta.description,
    areaServed: { "@type": "Country", name: "Brazil" },
    sameAs: [site.linkedin],
    knowsAbout: [
      "AI agents",
      "Workflow automation",
      "ERP",
      "Odoo",
      "Systems integration",
      "Knowledge copilots",
    ],
  };

  const website = {
    "@type": "WebSite",
    "@id": `${site.url}/#website`,
    url: site.url,
    name: site.name,
    inLanguage: ["pt-BR", "en"],
    publisher: { "@id": `${site.url}/#organization` },
  };

  const products = {
    "@type": "ItemList",
    "@id": `${site.url}/#products`,
    name: locale === "en" ? "Products in production" : "Produtos em produção",
    itemListElement: content.cases.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
      description: item.description,
    })),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [organization, website, products],
  };
}
