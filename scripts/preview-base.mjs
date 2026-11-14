/** Pure helpers for PR preview paths. Shared by the Astro build and the publisher. */

const PREVIEW_BASE = /^\/pr-preview\/pr-[1-9][0-9]*\/$/;

/** Accept only the site root or one numbered preview directory. */
export function previewBase(value = "/") {
  if (value === "/" || PREVIEW_BASE.test(value)) return value;
  throw new Error("Base path must be / or /pr-preview/pr-<number>/");
}

/** Positive PR number, with no leading zero and no extra characters. */
export function previewNumber(value) {
  const text = String(value ?? "").trim();
  if (!/^[1-9][0-9]*$/.test(text)) throw new Error("Invalid PR number");
  const number = Number(text);
  if (!Number.isSafeInteger(number)) throw new Error("Invalid PR number");
  return number;
}

/**
 * Join a site base with a root-relative path.
 * `..`, protocol-relative URLs and non-preview bases are rejected.
 */
export function joinBase(base, path) {
  const prefix = previewBase(base);
  if (typeof path !== "string" || path.includes("\\") || path.includes("..")) {
    throw new Error("Unsafe path");
  }
  if (path.startsWith("#") || path.startsWith("mailto:") || /^[a-z][a-z0-9+.-]*:/i.test(path)) {
    return path;
  }
  if (!path.startsWith("/")) throw new Error("Unsafe path");
  return prefixAbsolutePath(path, prefix);
}

/** Prefix a root-absolute URL, leaving the production root and existing prefixes alone. */
export function prefixAbsolutePath(url, base) {
  const prefix = previewBase(base);
  if (typeof url !== "string" || !url.startsWith("/") || url.startsWith("//")) return url;
  if (prefix === "/" || url === prefix || url.startsWith(prefix) || url === prefix.slice(0, -1)) return url;
  return `${prefix}${url.slice(1)}`;
}

/** Rewrite root-absolute references inside HTML or CSS. Idempotent for an already-prefixed tree. */
export function prefixRootUrls(source, base) {
  const prefix = previewBase(base);
  if (prefix === "/" || typeof source !== "string") return source;

  const rewriteAttr = (name, value) =>
    value.replace(new RegExp(`(\\b${name}=")(\\/[^"]*)"`, "g"), (_, lead, url) => {
      return `${lead}${prefixAbsolutePath(url, prefix)}"`;
    });

  let next = rewriteAttr("href", source);
  next = rewriteAttr("src", next);
  next = next.replace(/(\bsrcset=")([^"]*)"/g, (_, lead, value) => {
    const rewritten = value.replace(/(^|,\s*)(\/[^,\s]*)/g, (full, separator, url) => {
      const prefixed = prefixAbsolutePath(url, prefix);
      return prefixed === url ? full : `${separator}${prefixed}`;
    });
    return `${lead}${rewritten}"`;
  });
  next = next.replace(/url\((["']?)(\/[^"')\s]+)\1\)/g, (full, quote, url) => {
    const prefixed = prefixAbsolutePath(url, prefix);
    return prefixed === url ? full : `url(${quote}${prefixed}${quote})`;
  });
  return next;
}

export function rewriteCssUrls(css, base) {
  return prefixRootUrls(css, base);
}

/** Point a web manifest at the preview directory without touching other fields. */
export function rewriteManifest(manifest, base) {
  const prefix = previewBase(base);
  if (!manifest || typeof manifest !== "object" || !Array.isArray(manifest.icons)) {
    throw new Error("Invalid manifest");
  }
  return {
    ...manifest,
    start_url: prefix,
    scope: prefix,
    icons: manifest.icons.map((icon) => {
      if (!icon || typeof icon.src !== "string" || !icon.src.startsWith("/")) {
        throw new Error("Invalid manifest icon");
      }
      return { ...icon, src: joinBase(prefix, icon.src) };
    }),
  };
}
