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

const { site, mailto } = await import(join(root, "src/data/site.ts"));
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

function alternateHref(html, lang) {
  const tags = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]);
  const tag = tags.find((value) => value.includes(`rel="alternate"`) && value.includes(`hreflang="${lang}"`));
  return tag ? /href="([^"]+)"/.exec(tag)?.[1] : undefined;
}

const pages = [
  { file: "index.html", lang: "pt-BR", canonical: "https://id42studio.github.io/", robotsIndex: true },
  { file: "en/index.html", lang: "en", canonical: "https://id42studio.github.io/en/", robotsIndex: true },
];

const onePagerPages = [
  {
    file: "one-pager/index.html",
    lang: "pt-BR",
    canonical: "https://id42studio.github.io/one-pager/",
    href: "/one-pager/",
    copy: ptBR,
  },
  {
    file: "en/one-pager/index.html",
    lang: "en",
    canonical: "https://id42studio.github.io/en/one-pager/",
    href: "/en/one-pager/",
    copy: en,
  },
];

const homeHreflang = {
  "pt-BR": "https://id42studio.github.io/",
  en: "https://id42studio.github.io/en/",
  "x-default": "https://id42studio.github.io/",
};

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

    for (const [lang, href] of Object.entries(homeHreflang)) {
      assert(alternateHref(html, lang) === href, `hreflang ${lang} → ${alternateHref(html, lang) ?? "missing"}`);
    }

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

for (const page of onePagerPages) {
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
    assert(robots.includes("index"), "one-pager must be indexable");
    assert(!/<header[^>]*class="[^"]*site-header/.test(html), "site nav must not render");
    assert(!/class="[^"]*\bnav-link\b/.test(html), "nav links must not render");
    assert(/@page\s*\{[^}]*size:\s*A4/.test(html), "missing @page size A4");
    assert(html.includes(page.copy.onePager.print), "missing print action");
    return `${title.length}c title, ${description.length}c description`;
  });

  check(`${page.file}: hreflang points at the sheet`, () => {
    const html = read(page.file);
    const expected = {
      "pt-BR": "https://id42studio.github.io/one-pager/",
      en: "https://id42studio.github.io/en/one-pager/",
      "x-default": "https://id42studio.github.io/one-pager/",
    };
    for (const [lang, href] of Object.entries(expected)) {
      assert(alternateHref(html, lang) === href, `hreflang ${lang} → ${alternateHref(html, lang) ?? "missing"}`);
    }
    const alternateLocale = meta(html, "property", "og:locale:alternate");
    const expectedAlternate = page.lang === "en" ? "pt_BR" : "en_US";
    assert(alternateLocale === expectedAlternate, `og:locale:alternate ${alternateLocale ?? "missing"}`);
    return page.canonical;
  });

  check(`${page.file}: copy stays inside what the site already says`, () => {
    const html = read(page.file);
    const text = html
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/<[^>]+>/g, " ");
    const copy = page.copy;
    const other = page.lang === "en" ? ptBR : en;

    for (const line of copy.hero.titleLines) assert(text.includes(line), `missing headline “${line}”`);
    assert(text.includes(copy.onePager.thesis), "missing thesis");
    const thesisClause = copy.onePager.thesis.split(": ").slice(1).join(": ");
    assert(thesisClause.length > 40 && copy.saaw.text.includes(thesisClause), "thesis is not a clause from saaw.text");
    assert(!text.includes(other.onePager.thesis), "other locale thesis leaked");

    for (const model of copy.deliver.models) {
      assert(text.includes(model.key), `missing ${model.key}`);
      assert(text.includes(model.title), `missing “${model.title}”`);
      assert(text.includes(model.model), `missing “${model.model}”`);
      for (const item of model.items) assert(text.includes(item), `missing “${item}”`);
    }
    assert(text.includes(copy.deliver.note), "missing the no-list-price note");

    for (const capability of copy.capabilities.items) {
      assert(text.includes(capability.title), `missing capability “${capability.title}”`);
      assert(text.includes(capability.text), `missing capability text “${capability.title}”`);
    }
    for (const step of copy.process.steps) {
      assert(text.includes(step.title) && text.includes(step.text), `missing step “${step.title}”`);
    }
    for (const product of copy.work.items) {
      assert(text.includes(product.name), `missing ${product.name}`);
      assert(html.includes(`href="${product.url}"`), `missing link ${product.url}`);
      assert(text.includes(product.solution), `missing solution for ${product.name}`);
      assert(text.includes(product.status), `missing status for ${product.name}`);
    }

    assert(text.includes(site.email), "missing contact email");
    assert(html.includes(`mailto:${site.email}`), "mailto must read site.email");
    assert(!html.includes("contato@") || site.email.startsWith("contato@"), "email must come from site.ts");
    assert(!html.includes(site.linkedin.url), "unpublished LinkedIn URL leaked");
    return `${copy.work.items.length} products`;
  });
}

check("home links to the one-pager without borrowing its print rules", () => {
  for (const page of onePagerPages) {
    const homeFile = page.lang === "en" ? "en/index.html" : "index.html";
    const html = read(homeFile);
    assert(html.includes(page.copy.onePager.download), `${homeFile} missing the download label`);
    assert(html.includes(`href="${page.href}"`), `${homeFile} missing ${page.href}`);
    assert(!/@page\s*\{[^}]*size:\s*A4/.test(html), `${homeFile} picked up the one-pager @page rule`);
  }
  const portuguese = read("index.html");
  const english = read("en/index.html");
  assert(!portuguese.includes(en.onePager.download), "English download label on the Portuguese home");
  assert(!english.includes(ptBR.onePager.download), "Portuguese download label on the English home");
  return "/one-pager/ + /en/one-pager/";
});

/* ----------------------------------------------------------------- assets */

const publishedHtml = () =>
  ["index.html", "en/index.html", ...onePagerPages.map((page) => page.file)].map((file) => read(file)).join("\n");

check("every referenced asset exists", () => {
  const html = publishedHtml();
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
  const html = publishedHtml();
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
  const files = ["index.html", "en/index.html", "one-pager/index.html", "en/one-pager/index.html", "llms.txt"];
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

check("sitemap lists both locales and the one-pager", () => {
  const sitemap = read("sitemap-0.xml");
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]).sort();
  const expected = [
    "https://id42studio.github.io/",
    "https://id42studio.github.io/en/",
    "https://id42studio.github.io/en/one-pager/",
    "https://id42studio.github.io/one-pager/",
  ];
  assert(urls.join("\n") === expected.join("\n"), `urls:\n${urls.join("\n")}`);
  assert((sitemap.match(/<lastmod>[^<]+<\/lastmod>/g) ?? []).length >= expected.length, "missing lastmod");

  const blocks = sitemap.split("<url>").slice(1);
  assert(blocks.length === expected.length, `expected ${expected.length} url blocks`);
  for (const block of blocks) {
    const loc = /<loc>([^<]+)<\/loc>/.exec(block)?.[1];
    const xDefault = [...block.matchAll(/<xhtml:link\b[^>]*>/g)]
      .map((match) => match[0])
      .find((tag) => /hreflang="x-default"/.test(tag));
    assert(xDefault, `missing x-default for ${loc}`);
    const href = /href="([^"]+)"/.exec(xDefault)?.[1];
    const fallback = loc?.includes("/one-pager/")
      ? "https://id42studio.github.io/one-pager/"
      : "https://id42studio.github.io/";
    assert(href === fallback, `x-default for ${loc} is ${href}`);

    const portuguese = [...block.matchAll(/<xhtml:link\b[^>]*>/g)]
      .map((match) => match[0])
      .find((tag) => /hreflang="pt-BR"/.test(tag));
    const english = [...block.matchAll(/<xhtml:link\b[^>]*>/g)]
      .map((match) => match[0])
      .find((tag) => /hreflang="en"/.test(tag));
    const ptHref = portuguese ? /href="([^"]+)"/.exec(portuguese)?.[1] : undefined;
    const enHref = english ? /href="([^"]+)"/.exec(english)?.[1] : undefined;
    if (loc?.includes("/one-pager/")) {
      assert(ptHref === "https://id42studio.github.io/one-pager/", `pt-BR alternate ${ptHref}`);
      assert(enHref === "https://id42studio.github.io/en/one-pager/", `en alternate ${enHref}`);
    } else {
      assert(ptHref === "https://id42studio.github.io/", `pt-BR alternate ${ptHref}`);
      assert(enHref === "https://id42studio.github.io/en/", `en alternate ${enHref}`);
    }
  }
  return "4 urls + paired hreflang + x-default + lastmod";
});

check("linkedin follows the published flag", () => {
  const files = [
    "index.html",
    "en/index.html",
    "one-pager/index.html",
    "en/one-pager/index.html",
    "404.html",
    "llms.txt",
  ];
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

check("robots.txt points at the sitemap and hides previews", () => {
  const robots = read("robots.txt");
  assert(/Sitemap: https:\/\/id42studio\.github\.io\/sitemap-index\.xml/.test(robots), "sitemap line missing");
  assert(/Disallow:\s*\/pr-preview\//.test(robots), "preview path must be disallowed");
  assert(!/^Disallow:\s*\/\s*$/m.test(robots), "must not disallow the whole site");
  return "sitemap + disallow /pr-preview/";
});

check("production build is not a preview", () => {
  for (const file of ["index.html", "en/index.html", "one-pager/index.html", "en/one-pager/index.html"]) {
    const html = read(file);
    assert(!html.includes("/pr-preview/"), `${file} contains a preview base`);
    const robots = meta(html, "name", "robots") ?? "";
    assert(robots.includes("index") && !robots.includes("noindex"), `${file} must stay indexable`);
  }
  const sitemap = read("sitemap-0.xml");
  assert(!sitemap.includes("/pr-preview/"), "production sitemap lists a preview");
  return "root base";
});

check("llms.txt exists", () => {
  const body = read("llms.txt");
  assert(body.includes("https://id42studio.github.io/en/"), "missing English url");
  assert(body.includes("https://id42studio.github.io/one-pager/"), "missing Portuguese one-pager");
  assert(body.includes("https://id42studio.github.io/en/one-pager/"), "missing English one-pager");
  return `${(body.length / 1024).toFixed(1)} KB`;
});

check("contact address follows site.email", () => {
  const htmlHref = (subject, body) => mailto(subject, body).replaceAll("&", "&amp;");
  const pages = [
    { file: "index.html", href: htmlHref(ptBR.cta.emailSubject, ptBR.cta.emailBody), note: ptBR.cta.note },
    { file: "en/index.html", href: htmlHref(en.cta.emailSubject, en.cta.emailBody), note: en.cta.note },
  ];

  for (const page of pages) {
    const html = read(page.file);
    assert(html.includes(page.href), `${page.file} mailto dropped the subject or body`);
    assert(html.includes(`${site.email} · ${page.note}`), `${page.file} is missing the visible address`);
    assert(html.includes(`"email":"${site.email}"`), `${page.file} JSON-LD email drifted`);
    assert(!html.includes("{{email}}"), `${page.file} still has the llms placeholder`);
  }

  const notFound = read("404.html");
  assert(notFound.includes(`mailto:${site.email}`), "404 mailto drifted");
  assert(notFound.includes(`>${site.email}<`), "404 is missing the visible address");

  for (const page of onePagerPages) {
    const html = read(page.file);
    const href = htmlHref(page.copy.cta.emailSubject, page.copy.cta.emailBody);
    assert(html.includes(href), `${page.file} mailto dropped the subject or body`);
    assert(html.includes(`>${site.email}<`), `${page.file} is missing the visible address`);
    assert(html.includes(`"email":"${site.email}"`), `${page.file} JSON-LD email drifted`);
    assert(!html.includes("contato@"), `${page.file} still names the old inbox`);
  }

  const llms = read("llms.txt");
  assert(llms.includes(`Email: ${site.email}`), "llms.txt email drifted");
  assert(!llms.includes("{{email}}"), "llms.txt placeholder was not stamped");
  return site.email;
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

check("one-pager weight budget", () => {
  const sizes = onePagerPages.map((page) => {
    const gz = gzipSync(Buffer.from(read(page.file))).length;
    assert(gz < 16 * 1024, `${page.file} is ${(gz / 1024).toFixed(1)} KB gzipped (budget 16)`);
    return `${page.file} ${(gz / 1024).toFixed(1)} KB gz`;
  });
  return sizes.join(" · ");
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
