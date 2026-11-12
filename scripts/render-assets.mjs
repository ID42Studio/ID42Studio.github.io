#!/usr/bin/env node
/**
 * Regenerates social cards (and optionally icons) with Playwright.
 * Prefer this over the Chrome CLI shim when headless Chrome hangs.
 */
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const browser = await chromium.launch({ headless: true });

async function shotHtml(hash, width, height, out, transparent = false) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  if (transparent) {
    await page.evaluate(() => {
      document.documentElement.style.background = "transparent";
      document.body.style.background = "transparent";
    }).catch(() => {});
  }
  const url = pathToFileURL(join(root, "scripts", hash.includes("icon") ? "icon-card.html" : "og-card.html")).href;
  // hash for og is #pt/#en; for icons the filename encodes size via dedicated calls below
  await page.goto(url + (hash.startsWith("#") ? hash : ""), { waitUntil: "load" });
  await page.waitForTimeout(400);
  await page.screenshot({
    path: join(root, out),
    type: "png",
    omitBackground: transparent,
  });
  await page.close();
}

await shotHtml("#pt", 1200, 630, "public/og.png");
await shotHtml("#en", 1200, 630, "public/og-en.png");

for (const [size, out] of [
  [192, "public/icon-192.png"],
  [512, "public/icon-512.png"],
  [180, "public/apple-touch-icon.png"],
]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.goto(pathToFileURL(join(root, "scripts/icon-card.html")).href + `#${size}`, {
    waitUntil: "load",
  });
  await page.waitForTimeout(300);
  await page.screenshot({
    path: join(root, out),
    type: "png",
    omitBackground: true,
  });
  await page.close();
}

await browser.close();
console.log("Rendered social cards and icons into public/.");
