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

const { site } = await import(join(root, "src/data/site.ts"));
const [{ ptBR }, { en }] = await Promise.all([
  import(join(root, "src/i18n/pt-BR.ts")),
  import(join(root, "src/i18n/en.ts")),
]);

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

/** Canonical Portuguese slug first, published English alias second. */
const anchors = [
  ["top", "home"],
  ["diagnostico", "challenges"],
  ["entrega", "deliver"],
  ["produtos", "work"],
  ["solucoes", "solutions"],
  ["playground", "playground"],
  ["processo", "process"],
  ["casos-de-uso", "applications"],
  ["estudio", "studio"],
  ["saaw", "saaw"],
  ["labs", "labs"],
  ["discovery", "discovery"],
  ["contato", "contact"],
];

/** Document order after products move up and the thesis moves down. */
const sectionOrder = [
  "top",
  "diagnostico",
  "entrega",
  "produtos",
  "solucoes",
  "playground",
  "processo",
  "casos-de-uso",
  "estudio",
  "saaw",
  "labs",
  "contato",
];

const navByPage = {
  "index.html": ["#produtos", "#solucoes", "#playground", "#processo", "#estudio", "#contato"],
  "en/index.html": ["#work", "#solutions", "#playground", "#process", "#studio", "#contact"],
};

const portugueseHrefs = ["#produtos", "#solucoes", "#processo", "#estudio", "#contato"];
const englishHrefs = ["#work", "#solutions", "#process", "#studio", "#contact"];

check("both locales rendered", () => {
  for (const page of pages) assert(existsSync(join(dist, page.file)), `${page.file} missing`);
  return `${pages.length} pages`;
});

check("404 page rendered", () => {
  assert(existsSync(join(dist, "404.html")), "404.html missing");
  const html = read("404.html");
  assert(/noindex/i.test(meta(html, "name", "robots") ?? ""), "404 must be noindex");
  for (const copy of [ptBR.notFound, en.notFound]) {
    for (const key of ["label", "title", "accent", "text", "home"]) {
      assert(html.includes(copy[key]), `404 missing ${key}`);
    }
  }
  assert(html.includes('lang="pt-BR"') && html.includes('lang="en"'), "both languages must be marked");
  assert(html.includes('href="/"') && html.includes('href="/en/"'), "both home links must be present");
  return "noindex, both languages";
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

    const alternateLocale = meta(html, "property", "og:locale:alternate");
    const expectedAlternate = page.lang === "en" ? "pt_BR" : "en_US";
    assert(alternateLocale === expectedAlternate, `og:locale:alternate ${alternateLocale ?? "missing"}`);

    const image = meta(html, "property", "og:image") ?? "";
    const imagePath = image.replace("https://id42studio.github.io/", "");
    assert(existsSync(join(dist, imagePath)), `og image missing: ${imagePath}`);
    return imagePath;
  });

  check(`${page.file}: sections and published anchors`, () => {
    const html = read(page.file);
    const missing = anchors.flat().filter((id) => !html.includes(`id="${id}"`));
    assert(missing.length === 0, `missing ids: ${missing.join(", ")}`);

    const duplicates = [...html.matchAll(/\sid="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((id, index, all) => all.indexOf(id) !== index);
    assert(duplicates.length === 0, `duplicate ids: ${[...new Set(duplicates)].join(", ")}`);

    let cursor = -1;
    for (const id of sectionOrder) {
      const at = html.indexOf(`id="${id}"`);
      assert(at > cursor, `${id} is out of section order`);
      cursor = at;
    }

    const indexes = [...html.matchAll(/<span class="idx"[^>]*>\s*(\d+)\s*<\/span>/g)].map((match) => match[1]);
    assert(indexes.join(",") === "01,02,03,04,05,06,07,08,09,10", `section indexes ${indexes.join(",")}`);
    return `${sectionOrder.length} sections in order`;
  });

  check(`${page.file}: locale nav anchors`, () => {
    const html = read(page.file);
    const expected = navByPage[page.file];
    for (const className of ["nav-link", "mobile-link"]) {
      const hrefs = [...html.matchAll(new RegExp(`<a class="${className}" href="(#[^"]+)"`, "g"))].map(
        (match) => match[1],
      );
      assert(hrefs.join(",") === expected.join(","), `${className}: ${hrefs.join(",")}`);
    }

    const footer = [...html.matchAll(/<a class="footer-link" href="(#[^"]+)"/g)].map((match) => match[1]);
    assert(footer.join(",") === expected.join(","), `footer: ${footer.join(",")}`);

    const own = page.file === "en/index.html" ? englishHrefs : portugueseHrefs;
    const other = page.file === "en/index.html" ? portugueseHrefs : englishHrefs;
    for (const href of own) assert(html.includes(`href="${href}"`), `missing ${href}`);
    for (const href of other) assert(!html.includes(`href="${href}"`), `wrong-locale link ${href}`);
    return expected.join(" ");
  });

  check(`${page.file}: internal links resolve`, () => {
    const html = read(page.file);
    const targets = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
    const refs = [...html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
    const broken = [...new Set(refs)].filter((ref) => !targets.has(ref));
    assert(broken.length === 0, `broken anchors: ${broken.join(", ")}`);
    return `${new Set(refs).size} anchors`;
  });

  check(`${page.file}: structured data`, () => {
    const html = read(page.file);
    const raw = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1];
    assert(raw, "no JSON-LD block");
    const data = JSON.parse(raw);
    const types = data["@graph"].flatMap((node) => (Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]]));
    for (const type of ["Organization", "ProfessionalService", "WebSite", "ItemList"]) {
      assert(types.includes(type), `graph types: ${types.join(", ")}`);
    }

    const organization = data["@graph"].find((node) =>
      [node["@type"]].flat().includes("Organization"),
    );
    const logoUrl = typeof organization.logo === "string" ? organization.logo : organization.logo?.url;
    assert(logoUrl === `${site.url}${site.logo}`, `logo ${logoUrl}`);
    assert(existsSync(join(dist, site.logo.slice(1))), "logo file missing from dist");

    const serialized = JSON.stringify(data);
    if (site.linkedin.published) {
      assert(organization.sameAs?.includes(site.linkedin.url), "sameAs missing LinkedIn");
    } else {
      assert(!("sameAs" in organization), "unpublished profile must not set sameAs");
      assert(!serialized.includes(site.linkedin.url), "unpublished profile leaked into JSON-LD");
    }
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
  assert((sitemap.match(/<lastmod>[^<]+<\/lastmod>/g) ?? []).length >= 2, "missing lastmod");

  const alternates = [...sitemap.matchAll(/<xhtml:link\b[^>]*>/g)].map((match) => match[0]);
  const xDefault = alternates.filter((tag) => /hreflang="x-default"/.test(tag));
  assert(xDefault.length >= 2, "missing x-default alternate");
  for (const tag of xDefault) {
    const href = /href="([^"]+)"/.exec(tag)?.[1];
    assert(href === "https://id42studio.github.io/", `x-default href ${href}`);
  }
  return "2 urls + x-default + lastmod";
});

check("linkedin follows the published flag", () => {
  const files = ["index.html", "en/index.html", "404.html", "llms.txt"];
  for (const file of files) {
    const present = read(file).includes(site.linkedin.url);
    assert(
      present === site.linkedin.published,
      site.linkedin.published
        ? `${file} is missing the LinkedIn URL`
        : `${file} still publishes the LinkedIn URL`,
    );
  }
  return site.linkedin.published ? "published" : "hidden";
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

/* -------------------------------------------------------- playground engine */

const { analyze } = await import(join(root, "src/lib/classify.ts"));
const { EXEMPLARS } = await import(join(root, "src/lib/exemplars.ts"));

const classifierCases = [
  {
    text: "O time gasta dois dias por mês conferindo notas fiscais e lançando no ERP.",
    locale: "pt-BR",
    model: "outcome",
    domain: "finance",
  },
  {
    text: "Perdemos leads porque ninguém responde o WhatsApp no fim de semana.",
    locale: "pt-BR",
    model: "build",
    domain: "sales",
  },
  {
    text: "Precisamos monitorar nossos serviços 24/7, com plantão e SLA de resposta.",
    locale: "pt-BR",
    model: "operate",
    domain: "generic",
  },
  {
    text: "Queremos criar um aplicativo novo do zero para os técnicos em campo.",
    locale: "pt-BR",
    model: "build",
    domain: "support",
  },
  {
    text: "The team spends two days a month checking invoices and typing them into the ERP.",
    locale: "en",
    model: "outcome",
    domain: "finance",
  },
  {
    text: "We lose leads because nobody answers WhatsApp over the weekend.",
    locale: "en",
    model: "build",
    domain: "sales",
  },
  {
    text: "We need to monitor our services 24/7, with on-call rotation and response SLAs.",
    locale: "en",
    model: "operate",
    domain: "generic",
  },
  {
    text: "We want to build a new field app from scratch for our technicians.",
    locale: "en",
    model: "build",
    domain: "generic",
  },
];

check("playground classifier", () => {
  for (const item of classifierCases) {
    const analysis = analyze(item.text, item.locale);
    assert(
      analysis.model === item.model,
      `[${item.locale}] expected ${item.model}, got ${analysis.model} — "${item.text.slice(0, 40)}…"`,
    );
    assert(
      analysis.domain === item.domain,
      `[${item.locale}] expected ${item.domain}, got ${analysis.domain}`,
    );
    assert(analysis.flow.length === 5, "flow must have five stages");
    assert(analysis.flow.every((step) => step.label && step.detail), "empty stage copy");
    assert(!analysis.result.includes("{{"), "unfilled placeholder in the outcome");
  }

  const empty = analyze("oi", "pt-BR");
  assert(empty.matched === false, "short text should not be treated as matched");
  assert(empty.confidence < 0.3, "noise should not score high confidence");

  return `${classifierCases.length} cases + noise`;
});

check("playground corpus is self-consistent", () => {
  let total = 0;

  for (const locale of ["pt-BR", "en"]) {
    for (const exemplar of EXEMPLARS[locale]) {
      const analysis = analyze(exemplar.text, locale);
      total += 1;
      assert(
        analysis.model === exemplar.model,
        `[${locale}] "${exemplar.text.slice(0, 42)}…" → ${analysis.model}, expected ${exemplar.model}`,
      );
      assert(
        analysis.domain === exemplar.domain,
        `[${locale}] "${exemplar.text.slice(0, 42)}…" → ${analysis.domain}, expected ${exemplar.domain}`,
      );
    }
  }

  return `${total} exemplars`;
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
