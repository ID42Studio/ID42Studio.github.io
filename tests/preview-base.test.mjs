import test from "node:test";
import assert from "node:assert/strict";
import {
  joinBase,
  prefixAbsolutePath,
  prefixRootUrls,
  previewBase,
  previewNumber,
  rewriteManifest,
} from "../scripts/preview-base.mjs";

const base = "/pr-preview/pr-123/";

test("preview base accepts the site root and a numbered directory only", () => {
  assert.equal(previewBase("/"), "/");
  assert.equal(previewBase(base), base);
  for (const input of [
    "",
    "//example.com/",
    "/pr-preview/../",
    "/pr-preview/pr-0/",
    '/" onclick="x',
    "/pr-preview/pr-2",
    "/pr-preview/pr-2/extra/",
    "pr-preview/pr-2/",
    "/PR-preview/pr-2/",
    "/pr-preview/pr-01/",
    "/pr-preview/pr-2/../",
  ]) {
    assert.throws(() => previewBase(input), /Base path/);
  }
});

test("preview numbers reject padding, signs and extra text", () => {
  assert.equal(previewNumber(7), 7);
  assert.equal(previewNumber(" 42 "), 42);
  assert.equal(previewNumber("42\n"), 42);
  for (const input of ["0", "01", "-1", "1.5", "1e2", "9 9", "pr-9", "9000000000000000000", "42\n1"]) {
    assert.throws(() => previewNumber(input), /Invalid PR number/, String(input));
  }
});

test("joinBase prefixes in-site paths and leaves external targets alone", () => {
  assert.equal(joinBase("/", "/"), "/");
  assert.equal(joinBase("/", "/en/"), "/en/");
  assert.equal(joinBase("/", "/en/#work"), "/en/#work");
  assert.equal(joinBase("/", "/favicon.svg"), "/favicon.svg");
  assert.equal(joinBase(base, "/"), base);
  assert.equal(joinBase(base, "/en/"), `${base}en/`);
  assert.equal(joinBase(base, "/en/#work"), `${base}en/#work`);
  assert.equal(joinBase(base, "/fonts/a.woff2"), `${base}fonts/a.woff2`);
  assert.equal(joinBase(base, "#main"), "#main");
  assert.equal(joinBase(base, "mailto:contato@id42.studio"), "mailto:contato@id42.studio");
  assert.equal(joinBase(base, "https://vbsell.com"), "https://vbsell.com");
  assert.throws(() => joinBase(base, "/../secret"), /Unsafe path/);
  assert.throws(() => joinBase("//evil/", "/"), /Base path/);
});

test("prefixing root URLs is idempotent and ignores protocol-relative URLs", () => {
  const html = [
    '<a href="/">PT</a>',
    '<a href="/en/">EN</a>',
    '<a href="https://vbsell.com/">out</a>',
    '<img src="/og.png">',
    '<img src="//cdn.example/a.png">',
    'src: url("/fonts/instrument-sans-latin-wght.woff2")',
    'src: url("/pr-preview/pr-123/fonts/manrope-latin-wght.woff2")',
  ].join("\n");
  const once = prefixRootUrls(html, base);
  assert.equal(prefixRootUrls(once, base), once);
  assert.match(once, new RegExp(`href="${base}"`));
  assert.match(once, new RegExp(`href="${base}en/"`));
  assert.match(once, /href="https:\/\/vbsell\.com\/"/);
  assert.match(once, /src="\/\/cdn\.example\/a\.png"/);
  assert.match(once, new RegExp(`url\\("${base}fonts/instrument-sans-latin-wght\\.woff2"\\)`));
  assert.equal(once.split(`${base}fonts/manrope`).length - 1, 1);
  assert.equal(prefixAbsolutePath("/favicon.svg", "/"), "/favicon.svg");
  assert.equal(prefixRootUrls(html, "/"), html);
});

test("manifest scope and icons move under the preview directory", () => {
  const manifest = rewriteManifest(
    {
      name: "ID42 Studio",
      start_url: "/",
      scope: "/",
      icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    },
    base,
  );
  assert.equal(manifest.name, "ID42 Studio");
  assert.equal(manifest.start_url, base);
  assert.equal(manifest.scope, base);
  assert.equal(manifest.icons[0].src, `${base}icon-192.png`);
  assert.throws(() => rewriteManifest({ icons: [{ src: "https://evil/x.png" }] }, base), /icon/);
});
