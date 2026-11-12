#!/usr/bin/env node
/**
 * Playwright check: after typing a new process into the playground, the
 * client-rendered result must keep the same styled structure as the SSR paint
 * (step mark / label / detail, neighbour score column, signal chips).
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
} finally {
  await browser.close();
  server.close();
}

if (failed) {
  console.error("\nPlayground e2e failed.");
  process.exit(1);
}

console.log("\nPlayground e2e passed.");
