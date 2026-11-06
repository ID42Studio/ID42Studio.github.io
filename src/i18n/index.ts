import { en } from "./en";
import { ptBR } from "./pt-BR";
import type { Locale, SiteContent } from "./types";

export type { Locale, SiteContent };

const dictionaries: Record<Locale, SiteContent> = {
  "pt-BR": ptBR,
  en,
};

export const DEFAULT_LOCALE: Locale = "pt-BR";

export function getContent(locale: Locale): SiteContent {
  return dictionaries[locale] ?? ptBR;
}

export function isLocale(value: string): value is Locale {
  return value === "pt-BR" || value === "en";
}

/** Canonical path of the page for a locale. */
export function pagePath(locale: Locale): string {
  return locale === "en" ? "/en/" : "/";
}

/** Same-page path in the other locale, used by the language switch. */
export function alternatePath(locale: Locale): string {
  return locale === "en" ? "/" : "/en/";
}

/** HTML lang attribute + hreflang value. */
export function htmlLang(locale: Locale): string {
  return locale === "en" ? "en" : "pt-BR";
}
