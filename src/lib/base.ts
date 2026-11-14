import { joinBase } from "../../scripts/preview-base.mjs";

export { joinBase };

/** URL prefix configured for this build. "/" in production, "/pr-preview/pr-<N>/" for a preview. */
export function siteBase(): string {
  const value = import.meta.env?.BASE_URL;
  if (typeof value !== "string" || value.length === 0) return "/";
  return value;
}

/** Prefix a root-absolute path with the build base. External and hash-only URLs pass through. */
export function withBase(path: string): string {
  return joinBase(siteBase(), path);
}

/** True when this build is published under /pr-preview/pr-<N>/. */
export function isPreview(): boolean {
  return siteBase() !== "/";
}
