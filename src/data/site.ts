/**
 * Site-wide configuration: canonical URL, contact channels and product links.
 * Values here are the single source of truth for the whole page.
 */
export const site = {
  url: "https://id42studio.github.io",
  name: "ID42 Studio",
  legalName: "ID42 Studio",
  email: "contato@id42.studio",
  linkedin: "https://www.linkedin.com/company/id42studio",
  locale: "pt-BR",
  themeColor: "#050507",
} as const;

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
