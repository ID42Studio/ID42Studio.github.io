#!/usr/bin/env node
/**
 * Reject a preview artifact that is not a self-contained, noindex static tree.
 * The trusted publisher runs this from main; it never executes files from the artifact.
 */
import { existsSync, lstatSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { previewBase, previewNumber } from "./preview-base.mjs";

const ORIGIN = "https://id42studio.github.io";
const MAX_FILES = 2000;
const MAX_BYTES = 40 * 1024 * 1024;

export function assertPreviewArtifact(root, prNumber) {
  const number = previewNumber(prNumber);
  const base = previewBase(`/pr-preview/pr-${number}/`);
  const issues = [];

  if (!existsSync(root) || !statSync(root).isDirectory()) {
    throw new Error(`Preview directory missing: ${root}`);
  }

  const files = [];
  walk(root, root, files, issues);
  if (files.length > MAX_FILES) issues.push(`too many files (${files.length})`);

  const total = files.reduce((sum, file) => sum + statSync(file).size, 0);
  if (total > MAX_BYTES) issues.push(`preview is ${(total / 1024 / 1024).toFixed(1)} MB`);

  for (const name of ["sitemap.xml", "sitemap-index.xml", "sitemap-0.xml"]) {
    if (existsSync(join(root, name))) issues.push(`${name} must not be published with a preview`);
  }

  const required = ["index.html", "en/index.html", "404.html", "manifest.webmanifest", "robots.txt"];
  for (const name of required) {
    if (!existsSync(join(root, name))) issues.push(`missing ${name}`);
  }

  const canonicals = {
    "index.html": `${ORIGIN}${base}`,
    "en/index.html": `${ORIGIN}${base}en/`,
    "404.html": `${ORIGIN}${base}404.html`,
  };

  for (const file of files.filter((item) => item.endsWith(".html"))) {
    const rel = relative(root, file).split(sep).join("/");
    const html = readFileSync(file, "utf8");
    issues.push(...htmlIssues(html, { base, canonical: canonicals[rel] ?? null, label: rel }));
    issues.push(...missingAssets(root, html, base, rel));
  }

  if (existsSync(join(root, "manifest.webmanifest"))) {
    const manifest = JSON.parse(readFileSync(join(root, "manifest.webmanifest"), "utf8"));
    if (manifest.start_url !== base) issues.push(`manifest start_url ${manifest.start_url}`);
    if (manifest.scope !== base) issues.push(`manifest scope ${manifest.scope}`);
    for (const icon of manifest.icons ?? []) {
      if (typeof icon.src !== "string" || !icon.src.startsWith(base)) issues.push(`manifest icon ${icon.src}`);
    }
  }

  if (issues.length > 0) {
    throw new Error(`Preview ${number} is not publishable:\n- ${issues.join("\n- ")}`);
  }
  return { number, base };
}

export function htmlIssues(html, { base, canonical, label }) {
  const issues = [];
  const where = label ? `${label}: ` : "";
  const robots = meta(html, "name", "robots") ?? "";
  if (!/noindex/i.test(robots)) issues.push(`${where}missing noindex`);
  if (!/nofollow/i.test(robots)) issues.push(`${where}missing nofollow`);

  const canonicals = links(html, "canonical");
  if (canonical && canonicals.length !== 1) issues.push(`${where}expected one canonical, found ${canonicals.length}`);
  if (canonical && canonicals[0] !== canonical) issues.push(`${where}canonical ${canonicals[0] ?? "missing"}`);
  for (const href of canonicals) {
    if (!href.startsWith(`${ORIGIN}${base}`)) issues.push(`${where}canonical leaves the preview: ${href}`);
  }

  const alternates = hreflang(html);
  const expected = {
    "pt-BR": `${ORIGIN}${base}`,
    en: `${ORIGIN}${base}en/`,
    "x-default": `${ORIGIN}${base}`,
  };
  for (const [lang, href] of Object.entries(expected)) {
    if (alternates[lang] !== href) issues.push(`${where}hreflang ${lang} is ${alternates[lang] ?? "missing"}`);
  }

  if (!html.includes(`href="${base}"`) || !html.includes(`href="${base}en/"`)) {
    issues.push(`${where}locale links must stay inside ${base}`);
  }

  for (const url of absoluteSiteUrls(html)) {
    if (!inPreview(url, base)) issues.push(`${where}production URL ${url}`);
  }

  for (const url of rootUrls(html)) {
    if (!url.startsWith(base)) issues.push(`${where}path escapes preview: ${url}`);
  }

  for (const tag of tags(html, "script")) {
    const src = attr(tag, "src");
    if (!src) continue;
    if (!src.startsWith(base) && !src.startsWith(`${ORIGIN}${base}`)) issues.push(`${where}script ${src}`);
  }

  for (const tag of tags(html, "link")) {
    const href = attr(tag, "href");
    const rel = attr(tag, "rel");
    if (!href || rel === "canonical" || rel === "alternate") continue;
    if (href.startsWith(base) || href.startsWith(`${ORIGIN}${base}`) || href.startsWith("#")) continue;
    issues.push(`${where}resource ${href}`);
  }

  return issues;
}

function walk(dir, root, files, issues) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = relative(root, full);
    const parts = rel.split(sep);
    if (rel.startsWith("..") || parts.includes(".git") || parts.includes("..")) {
      issues.push(`unsafe path ${rel}`);
      continue;
    }
    const stat = lstatSync(full);
    if (stat.isSymbolicLink()) {
      issues.push(`symlink ${rel}`);
      continue;
    }
    if (stat.isDirectory()) walk(full, root, files, issues);
    else files.push(full);
  }
}

function missingAssets(root, html, base, label) {
  const issues = [];
  for (const url of rootUrls(html)) {
    const rel = url.slice(base.length).split("#")[0].split("?")[0];
    if (!rel || rel.endsWith("/")) continue;
    if (!existsSync(join(root, rel))) issues.push(`${label}: missing asset ${rel}`);
  }
  return issues;
}

function inPreview(url, base) {
  const withSlash = `${ORIGIN}${base}`;
  const noSlash = withSlash.slice(0, -1);
  return url === noSlash || url.startsWith(withSlash);
}

function absoluteSiteUrls(html) {
  return [...html.matchAll(/https:\/\/id42studio\.github\.io(?:\/[^"'\\\s<>]*)?/g)].map((match) => match[0]);
}

function rootUrls(html) {
  const found = new Set();
  for (const tagName of ["a", "link", "script", "img", "source"]) {
    for (const tag of tags(html, tagName)) {
      for (const name of ["href", "src"]) {
        const value = attr(tag, name);
        if (value?.startsWith("/") && !value.startsWith("//")) found.add(value.split("#")[0]);
      }
    }
  }
  for (const match of html.matchAll(/url\((["']?)(\/[^"')\s]+)\1\)/g)) found.add(match[2]);
  return [...found];
}

function hreflang(html) {
  const map = {};
  for (const tag of tags(html, "link")) {
    const lang = attr(tag, "hreflang");
    const href = attr(tag, "href");
    if (lang && href) map[lang] = href;
  }
  return map;
}

function links(html, rel) {
  return tags(html, "link")
    .filter((tag) => attr(tag, "rel") === rel)
    .map((tag) => attr(tag, "href"))
    .filter(Boolean);
}

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map((match) => match[0]);
}

function attr(tag, name) {
  const match = new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, "i").exec(tag);
  return match?.[1] ?? null;
}

function meta(html, attribute, value) {
  for (const tag of tags(html, "meta")) {
    if (attr(tag, attribute) === value) return attr(tag, "content");
  }
  return null;
}

function isMain() {
  const entry = process.argv[1];
  return Boolean(entry) && import.meta.url === pathToFileURL(entry).href;
}

if (isMain()) {
  const root = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), "..", "dist-preview");
  const number = previewNumber(process.argv[3] ?? process.env.PR_NUMBER);
  const plan = assertPreviewArtifact(root, number);
  console.log(`Preview ${plan.number} at ${root} is valid (${plan.base}).`);
}
