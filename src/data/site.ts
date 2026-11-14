/**
 * Site-wide configuration: canonical URL, contact channels and product links.
 * Values here are the single source of truth for the whole page.
 */
export const site = {
  url: "https://id42studio.github.io",
  name: "ID42 Studio",
  legalName: "ID42 Studio",
  email: "contato@id42.studio",
  /** Raster mark used as the Organization logo in structured data. */
  logo: "/icon-512.png",
  /**
   * Company page. Keep `published` false until the URL actually responds.
   * Flipping it turns the CTA, the footer link and `sameAs` back on.
   * When you do, list the URL in `public/llms.txt` again.
   */
  linkedin: {
    url: "https://www.linkedin.com/company/id42studio",
    published: false as boolean,
  },
  locale: "pt-BR",
  themeColor: "#050507",
} as const;

/** Profile URLs that are safe to render and to list in structured data. */
export function publishedProfiles(): string[] {
  return [site.linkedin].filter((profile) => profile.published).map((profile) => profile.url);
}

export const mailto = (subject: string, body?: string): string => {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const query = params.toString();
  return `mailto:${site.email}${query ? `?${query}` : ""}`;
};

/** Path for a locale: pt-BR lives at the root, English under /en/. */
export const pathFor = (locale: "pt-BR" | "en", hash = ""): string =>
  locale === "en" ? `/en/${hash}` : `/${hash}`;
