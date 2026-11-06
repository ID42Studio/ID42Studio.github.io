#!/usr/bin/env node
/**
 * Post-build verification gate.
 *
 * Asserts the invariants this site depends on: both locales rendered, SEO and
 * structured data intact, every referenced asset present on disk, no external
 * requests, no banned vendor strings, sane size budgets. Runs in CI before the
 * site is published.
 */
import { readFileSync, statSync, existsSync, readdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

const failures = [];
const checks = [];

function check(name, fn) {
  try {
    const detail = fn();
    checks.push({ ok: true, name, detail });
  } catch (error) {
    checks.push({ ok: false, name, detail: error.message });
    failures.push(`${name}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const read = (file) => readFileSync(join(dist, file), "utf8");

function count(html, regex) {
  return (html.match(regex) ?? []).length;
}

function meta(html, attribute, value) {
  const pattern = new RegExp(
    `<meta[^>]*${attribute}="${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*content="([^"]*)"`,
    "i",
  );
  const match = html.match(pattern);
  if (match) return match[1];
  const reversed = new RegExp(
    `<meta[^>]*content="([^"]*)"[^>]*${attribute}="${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`,
    "i",
  );
  return reversed.exec(html)?.[1];
}

function link(html, rel) {
  const pattern = new RegExp(`<link[^>]*rel="${rel}"[^>]*href="([^"]*)"`, "i");
  return pattern.exec(html)?.[1];
}

const pages = [
  { file: "index.html", lang: "pt-BR", canonical: "https://id42studio.github.io/", robotsIndex: true },
  { file: "en/index.html", lang: "en", canonical: "https://id42studio.github.io/en/", robotsIndex: true },
];

/* ------------------------------------------------------------- structure */

check("both locales rendered", () => {
  for (const page of pages) assert(existsSync(join(dist, page.file)), `${page.file} missing`);
  return `${pages.length} pages`;
});

check("404 page rendered", () => {
  assert(existsSync(join(dist, "404.html")), "404.html missing");
  const html = read("404.html");
  assert(/noindex/i.test(meta(html, "name", "robots") ?? ""), "404 must be noindex");
  return "noindex ok";
});

for (const page of pages) {
  check(`${page.file}: document basics`, () => {
    const html = read(page.file);
    assert(html.includes(`<html lang="${page.lang}"`), `expected lang=${page.lang}`);
    assert(count(html, /<h1[\s>]/g) === 1, "expected exactly one <h1>");
    assert((link(html, "canonical") ?? "") === page.canonical, "canonical mismatch");

    const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? "";
    assert(title.length >= 15 && title.length <= 70, `title length ${title.length}`);

    const description = meta(html, "name", "description") ?? "";
    assert(description.length >= 70 && description.length <= 165, `description length ${description.length}`);

    const robots = meta(html, "name", "robots") ?? "";
    assert(page.robotsIndex ? robots.includes("index") : robots.includes("noindex"), "robots directive wrong");
    return `${title.length}c title, ${description.length}c description`;
  });

  check(`${page.file}: social + alternates`, () => {
    const html = read(page.file);
    for (const tag of ["og:title", "og:description", "og:url", "og:image", "twitter:card"]) {
      assert(meta(html, "property", tag) || meta(html, "name", tag), `missing ${tag}`);
    }

    const hreflangs = [...html.matchAll(/hreflang="([^"]+)"/g)].map((m) => m[1]).sort();
    assert(
      ["en", "pt-BR", "x-default"].every((value) => hreflangs.includes(value)),
      `hreflang set incomplete: ${hreflangs.join(", ")}`,
    );

    const image = meta(html, "property", "og:image") ?? "";
    const imagePath = image.replace("https://id42studio.github.io/", "");
    assert(existsSync(join(dist, imagePath)), `og image missing: ${imagePath}`);
    return imagePath;
  });

  check(`${page.file}: structured data`, () => {
    const html = read(page.file);
    const raw = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1];
    assert(raw, "no JSON-LD block");
    const data = JSON.parse(raw);
    const types = data["@graph"].map((node) => node["@type"]);
    assert(types.includes("Organization") && types.includes("WebSite"), `graph types: ${types.join(", ")}`);
    return types.join(" + ");
  });
}

/* ----------------------------------------------------------------- assets */

check("every referenced asset exists", () => {
  const html = `${read("index.html")}${read("en/index.html")}`;
  const urls = new Set(
    [...html.matchAll(/(?:href|src)="(\/[^"#?]+)"/g)]
      .map((match) => match[1])
      .filter((url) => !url.endsWith("/"))
      .filter((url) => !url.startsWith("//")),
  );

  const missing = [...urls].filter((url) => !existsSync(join(dist, url)));
  assert(missing.length === 0, `missing on disk: ${missing.join(", ")}`);
  return `${urls.size} assets`;
});

check("no external requests", () => {
  const html = `${read("index.html")}${read("en/index.html")}`;
  // Only resource-bearing attributes matter: outbound <a href> links are fine.
  const resourcePatterns = [
    /<script[^>]*\ssrc="([^"]+)"/g,
    /<link[^>]*\shref="([^"]+)"/g,
    /<img[^>]*\ssrc="([^"]+)"/g,
    /<iframe[^>]*\ssrc="([^"]+)"/g,
  ];

  const external = resourcePatterns
    .flatMap((pattern) => [...html.matchAll(pattern)].map((match) => match[1]))
    .filter((url) => /^(https?:)?\/\//.test(url))
    .filter((url) => !url.startsWith("https://id42studio.github.io/"));

  assert(external.length === 0, `external resources: ${external.join(", ")}`);
  return "self-hosted only";
});

check("vendor strings removed", () => {
  const files = ["index.html", "en/index.html", "llms.txt"];
  const banned = ["n8n"];
  for (const file of files) {
    const body = read(file).toLowerCase();
    for (const term of banned) {
      assert(!body.includes(term), `${term} found in ${file}`);
    }
  }
  return `${banned.length} terms clean`;
});

/* ------------------------------------------------------------------ seo */

check("sitemap lists both locales", () => {
  const sitemap = read("sitemap-0.xml");
  assert(sitemap.includes("https://id42studio.github.io/"), "missing pt-BR url");
  assert(sitemap.includes("https://id42studio.github.io/en/"), "missing en url");
  return "2 urls";
});

check("robots.txt points at the sitemap", () => {
  const robots = read("robots.txt");
  assert(/Sitemap: https:\/\/id42studio\.github\.io\/sitemap-index\.xml/.test(robots), "sitemap line missing");
  return "ok";
});

check("llms.txt exists", () => {
  const body = read("llms.txt");
  assert(body.includes("https://id42studio.github.io/en/"), "missing English url");
  return `${(body.length / 1024).toFixed(1)} KB`;
});

/* --------------------------------------------------------------- budgets */

check("page weight budget", () => {
  const html = read("index.html");
  const gz = gzipSync(Buffer.from(html)).length;
  assert(gz < 28 * 1024, `index.html is ${(gz / 1024).toFixed(1)} KB gzipped (budget 28)`);

  const inlineCss = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].reduce(
    (total, match) => total + match[1].length,
    0,
  );

  const cssDir = join(dist, "_astro");
  const externalCss = existsSync(cssDir)
    ? readdirSync(cssDir)
        .filter((file) => file.endsWith(".css"))
        .reduce((total, file) => total + statSync(join(cssDir, file)).size, 0)
    : 0;

  const css = inlineCss + externalCss;
  assert(css < 80 * 1024, `CSS is ${(css / 1024).toFixed(1)} KB (budget 80)`);

  return `html ${(gz / 1024).toFixed(1)} KB gz · css ${(css / 1024).toFixed(1)} KB`;
});

/* ------------------------------------------------------------- i18n parity */

function shapeKeys(value, prefix = "") {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      typeof item === "object" && item !== null ? shapeKeys(item, `${prefix}[${index}]`) : [],
    );
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      child && typeof child === "object" ? shapeKeys(child, `${prefix}${key}.`) : [`${prefix}${key}`],
    );
  }
  return [prefix.replace(/\.$/, "")];
}

const [{ ptBR }, { en }] = await Promise.all([
  import(join(root, "src/i18n/pt-BR.ts")),
  import(join(root, "src/i18n/en.ts")),
]);

check("locales have identical shape", () => {
  const ptKeys = shapeKeys(ptBR).sort();
  const enKeys = shapeKeys(en).sort();

  const missingInEn = ptKeys.filter((key) => !enKeys.includes(key));
  const missingInPt = enKeys.filter((key) => !ptKeys.includes(key));

  assert(
    missingInEn.length === 0 && missingInPt.length === 0,
    `missing in en: [${missingInEn.join(", ")}] · missing in pt-BR: [${missingInPt.join(", ")}]`,
  );

  const lookup = (source, key) =>
    key
      .replace(/\[(\d+)\]/g, ".$1")
      .split(".")
      .reduce((node, part) => (node == null ? node : node[part]), source);

  const empty = enKeys.filter((key) =>
    [ptBR, en].some((source) => {
      const value = lookup(source, key);
      return typeof value === "string" && value.trim() === "";
    }),
  );

  assert(empty.length === 0, `empty strings: ${empty.join(", ")}`);
  return `${ptKeys.length} keys`;
});

/* ------------------------------------------------------------------ report */

for (const entry of checks) {
  const mark = entry.ok ? "✓" : "✗";
  console.log(`${mark} ${entry.name}${entry.detail ? ` — ${entry.detail}` : ""}`);
}

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nAll ${checks.length} checks passed.`);
