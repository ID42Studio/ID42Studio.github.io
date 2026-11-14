#!/usr/bin/env node
/**
 * Playwright check: the playground re-render keeps its styled structure, and
 * the one-page brief renders in both locales, links back to the homes, and
 * prints on a single A4 page.
 */
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

if (!existsSync(join(dist, "index.html"))) {
  console.error("dist/index.html missing — run `npm run build` first.");
  process.exit(1);
}

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

function serve(filePath, res) {
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    res.writeHead(404).end("missing");
    return;
  }
  res.writeHead(200, {
    "Content-Type": mime[extname(filePath)] ?? "application/octet-stream",
    "Cache-Control": "no-store",
  });
  res.end(readFileSync(filePath));
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  let path = url.pathname;
  if (path.endsWith("/")) path += "index.html";
  serve(join(dist, path), res);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const base = `http://127.0.0.1:${port}`;

const sample =
  "o vendedor recebe uma oportunidade e precisa gerar orçamento e enviar para o cliente";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

let failed = false;
const assert = (condition, message) => {
  if (!condition) {
    console.error(`✗ ${message}`);
    failed = true;
  } else {
    console.log(`✓ ${message}`);
  }
};

try {
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.locator("#playground").scrollIntoViewIfNeeded();

  const input = page.locator("[data-pg-input]");
  await input.fill("");
  await input.pressSequentially(sample, { delay: 8 });
  await page.waitForTimeout(450);

  const steps = page.locator("[data-pg-flow] .pg-step");
  const stepCount = await steps.count();
  assert(stepCount === 5, `expected 5 steps after re-render, got ${stepCount}`);

  for (let i = 0; i < stepCount; i += 1) {
    const step = steps.nth(i);
    const mark = step.locator(".pg-step-mark");
    const label = step.locator(".pg-step-label");
    const detail = step.locator(".pg-step-detail");

    assert((await mark.count()) === 1, `step ${i}: mark element present`);
    assert((await label.count()) === 1, `step ${i}: label element present`);
    assert((await detail.count()) === 1, `step ${i}: detail element present`);

    const markBox = await mark.boundingBox();
    const labelBox = await label.boundingBox();
    const detailBox = await detail.boundingBox();
    assert(!!markBox && markBox.width >= 18 && markBox.height >= 18, `step ${i}: mark is a badge`);
    assert(!!labelBox && labelBox.width > 40, `step ${i}: label has width`);
    assert(!!detailBox && detailBox.y > (labelBox?.y ?? 0) - 1, `step ${i}: detail sits under label`);

    const markDisplay = await mark.evaluate((el) => getComputedStyle(el).display);
    assert(markDisplay === "grid", `step ${i}: mark keeps grid display (got ${markDisplay})`);
  }

  const nearItems = page.locator("[data-pg-near] .pg-near-item");
  const nearCount = await nearItems.count();
  assert(nearCount >= 1, `neighbour rows present (${nearCount})`);

  if (nearCount > 0) {
    const first = nearItems.first();
    const score = first.locator(".pg-near-score");
    const text = first.locator(".pg-near-text");
    assert((await score.count()) === 1, "neighbour score element present");
    assert((await text.count()) === 1, "neighbour text element present");
    const scoreBox = await score.boundingBox();
    const textBox = await text.boundingBox();
    assert(!!scoreBox && !!textBox && textBox.x > scoreBox.x + 8, "score column sits left of text");
    const scoreText = (await score.textContent())?.trim() ?? "";
    assert(/^\d+%$/.test(scoreText), `score looks like a percent (got "${scoreText}")`);
  }

  const signals = page.locator("[data-pg-signals] .pg-signal");
  const signalCount = await signals.count();
  assert(signalCount >= 1, `signal chips present (${signalCount})`);

  if (signalCount > 0) {
    const chip = signals.first();
    const styles = await chip.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        radius: cs.borderRadius,
        display: cs.display,
        fontFamily: cs.fontFamily,
        fontSize: Number.parseFloat(cs.fontSize),
      };
    });
    assert(styles.display.includes("flex") || styles.display === "block" || styles.display === "inline" || styles.display === "list-item" || styles.display === "inline-block", `signal display ok (${styles.display})`);
    assert(styles.radius.includes("999") || Number.parseFloat(styles.radius) >= 10, `signal has chip radius (${styles.radius})`);
    assert(styles.fontSize <= 14, `signal stays chip-sized (${styles.fontSize}px)`);
    assert(/mono|geist/i.test(styles.fontFamily), `signal uses mono family (${styles.fontFamily})`);
  }

  const model = (await page.locator("[data-pg-model]").textContent())?.trim() ?? "";
  assert(model.length > 0, `model badge populated (${model})`);

  const { site } = await import(join(root, "src/data/site.ts"));
  const { ptBR } = await import(join(root, "src/i18n/pt-BR.ts"));
  const { en } = await import(join(root, "src/i18n/en.ts"));

  const pdfPageCount = (buffer) => (buffer.toString("latin1").match(/\/Type\s*\/Page(?!s)/g) ?? []).length;

  const assertSheet = async (path, copy) => {
    await page.emulateMedia({ media: "screen" });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${base}${path}`, { waitUntil: "networkidle" });

    const h1 = (await page.locator("h1").innerText()).replace(/\s+/g, " ");
    for (const line of copy.hero.titleLines) {
      assert(h1.includes(line), `${path} headline includes “${line}”`);
    }
    assert((await page.locator(".site-header").count()) === 0, `${path} has no site header`);
    assert(
      (await page.locator(`a[href^="mailto:${site.email}"]`).count()) >= 1,
      `${path} mailto uses site.email`,
    );
    assert((await page.getByText(site.email, { exact: true }).count()) >= 1, `${path} shows the contact address`);
    for (const product of copy.work.items) {
      assert((await page.locator(`a[href="${product.url}"]`).count()) === 1, `${path} links ${product.name}`);
    }
    assert(
      (await page.getByText(copy.deliver.models[2].model, { exact: true }).count()) >= 1,
      `${path} keeps the Outcome caveat`,
    );
    assert((await page.getByText(copy.deliver.note, { exact: true }).count()) >= 1, `${path} states there is no list price`);

    await page.evaluate(() => {
      window.__printed = 0;
      window.print = () => {
        window.__printed += 1;
      };
    });
    await page.locator("[data-print]").click();
    assert((await page.evaluate(() => window.__printed)) === 1, `${path} print action calls window.print`);

    const enHref = await page.locator('[data-locale-switch] a[hreflang="en"]').getAttribute("href");
    const ptHref = await page.locator('[data-locale-switch] a[hreflang="pt-BR"]').getAttribute("href");
    assert(enHref === "/en/one-pager/", `${path} English switch stays on the sheet (${enHref})`);
    assert(ptHref === "/one-pager/", `${path} Portuguese switch stays on the sheet (${ptHref})`);

    await page.emulateMedia({ media: "print" });
    assert((await page.locator(".sheet-toolbar").isVisible()) === false, `${path} hides the toolbar when printing`);
    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    assert(background === "rgb(5, 5, 7)", `${path} print keeps the brand background (${background})`);
    const pdf = await page.pdf({ printBackground: true, preferCSSPageSize: true });
    const pdfPages = pdfPageCount(pdf);
    assert(pdfPages === 1, `${path} prints on one A4 page (got ${pdfPages})`);
    await page.emulateMedia({ media: "screen" });
  };

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  const portugueseDownload = page.locator('a[href="/one-pager/"]');
  assert((await portugueseDownload.count()) === 1, "Portuguese home links to the one-pager");
  await portugueseDownload.click();
  await page.waitForURL(/\/one-pager\/$/);

  await assertSheet("/one-pager/", ptBR);
  await page.locator('[data-locale-switch] a[hreflang="en"]').click();
  await page.waitForURL(/\/en\/one-pager\/$/);
  await assertSheet("/en/one-pager/", en);

  await page.goto(`${base}/en/`, { waitUntil: "networkidle" });
  assert((await page.locator('a[href="/en/one-pager/"]').count()) === 1, "English home links to the one-pager");

  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/one-pager/", "/en/one-pager/"]) {
    await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    assert(!overflow, `${path} has no horizontal overflow at 390px`);
    assert(await page.locator("h1").isVisible(), `${path} headline is visible on a phone`);
    assert(await page.locator("[data-print]").isVisible(), `${path} print action is visible on a phone`);
  }
} finally {
  await browser.close();
  server.close();
}

if (failed) {
  console.error("\nSite e2e failed.");
  process.exit(1);
}

console.log("\nSite e2e passed.");
