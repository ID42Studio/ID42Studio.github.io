#!/usr/bin/env node
/**
 * Browser check for a built preview: both locales render, assets load from the
 * preview base, and the language switch stays inside that directory.
 */
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { chromium } from "playwright";
import { previewBase, previewNumber } from "./preview-base.mjs";

const number = previewNumber(process.env.PR_NUMBER);
const basePath = previewBase(`/pr-preview/pr-${number}/`);
const dist = process.env.OUT_DIR ?? "dist-preview";

if (!existsSync(join(dist, "index.html"))) {
  console.error(`${dist}/index.html missing — run npm run build:preview first.`);
  process.exit(1);
}

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

function fileFor(pathname) {
  if (pathname !== basePath && !pathname.startsWith(basePath)) return null;
  let rel = pathname.slice(basePath.length);
  if (rel === "" || rel.endsWith("/")) rel += "index.html";
  if (rel.startsWith("/") || rel.includes("..")) return null;
  const file = join(dist, rel);
  if (!existsSync(file) || !statSync(file).isFile()) return null;
  return file;
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  const file = fileFor(url.pathname);
  if (!file) {
    res.writeHead(404).end("missing");
    return;
  }
  res.writeHead(200, {
    "Content-Type": mime[extname(file)] ?? "application/octet-stream",
    "Cache-Control": "no-store",
  });
  res.end(readFileSync(file));
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const origin = `http://127.0.0.1:${port}`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const failures = [];
const fontUrls = [];

page.on("response", (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith(basePath)) return;
  if (response.status() >= 400) failures.push(`${response.status()} ${url.pathname}`);
  if (url.pathname.endsWith(".woff2")) fontUrls.push(url.pathname);
});

const assert = (condition, message) => {
  if (!condition) {
    console.error(`✗ ${message}`);
    failures.push(message);
  } else {
    console.log(`✓ ${message}`);
  }
};

try {
  await page.goto(`${origin}${basePath}`, { waitUntil: "networkidle" });
  assert((await page.locator("html").getAttribute("lang")) === "pt-BR", "pt-BR document");
  assert((await page.locator("h1").count()) === 1, "one heading");
  const robots = await page.locator('meta[name="robots"]').getAttribute("content");
  assert(robots?.includes("noindex") && robots?.includes("nofollow"), `robots ${robots}`);
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  assert(canonical?.endsWith(basePath), `canonical ${canonical}`);

  await page.locator('a[data-locale-link][hreflang="en"]').first().click();
  await page.waitForURL((url) => url.pathname === `${basePath}en/`);
  assert((await page.locator("html").getAttribute("lang")) === "en", "english document");
  assert((await page.locator('meta[name="robots"]').getAttribute("content"))?.includes("noindex"), "english noindex");

  await page.locator('a[data-locale-link][hreflang="pt-BR"]').first().click();
  await page.waitForURL((url) => url.pathname === basePath);
  assert((await page.locator("html").getAttribute("lang")) === "pt-BR", "back to pt-BR");
  assert(fontUrls.some((url) => url.startsWith(basePath)), "font loaded from the preview");
  assert(fontUrls.every((url) => url.startsWith(basePath)), "fonts stay inside the preview");
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

if (failures.length > 0) {
  console.error(`\n${failures.length} preview check(s) failed.`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("\nPreview browser checks passed.");
