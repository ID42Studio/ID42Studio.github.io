import { publishedProfiles, site } from "../data/site";
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
  ogLocaleAlternate: string;
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
    ogLocaleAlternate: getContent(locale === "en" ? "pt-BR" : "en").meta.ogLocale,
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

/** Organization (also a ProfessionalService) + WebSite + shipped products, as one @graph. */
function buildSchema(content: SiteContent, locale: Locale): Record<string, unknown> {
  const sameAs = publishedProfiles();

  const organization = {
    "@type": ["Organization", "ProfessionalService"],
    "@id": `${site.url}/#organization`,
    name: site.name,
    url: site.url,
    logo: {
      "@type": "ImageObject",
      url: new URL(site.logo, site.url).href,
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
    "@id": `${site.url}/#website`,
    url: site.url,
    name: site.name,
    inLanguage: ["pt-BR", "en"],
    publisher: { "@id": `${site.url}/#organization` },
  };

  const products = {
    "@type": "ItemList",
    "@id": `${site.url}/#products`,
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
