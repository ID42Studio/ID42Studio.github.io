import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertPreviewArtifact, htmlIssues } from "../scripts/verify-preview.mjs";

const base = "/pr-preview/pr-9/";
const origin = "https://id42studio.github.io";

function page({ canonical, extra = "" }) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="pt-BR" href="${origin}${base}">
<link rel="alternate" hreflang="en" href="${origin}${base}en/">
<link rel="alternate" hreflang="x-default" href="${origin}${base}">
<link rel="icon" href="${base}favicon.svg">
</head>
<body>
<a href="${base}">PT</a>
<a href="${base}en/">EN</a>
${extra}
</body>
</html>`;
}

function writePreview(dir) {
  mkdirSync(join(dir, "en"), { recursive: true });
  writeFileSync(join(dir, "favicon.svg"), "<svg></svg>");
  writeFileSync(join(dir, "robots.txt"), "User-agent: *\nDisallow: /\n");
  writeFileSync(
    join(dir, "manifest.webmanifest"),
    JSON.stringify({ start_url: base, scope: base, icons: [{ src: `${base}favicon.svg` }] }),
  );
  writeFileSync(join(dir, "index.html"), page({ canonical: `${origin}${base}` }));
  writeFileSync(join(dir, "en/index.html"), page({ canonical: `${origin}${base}en/` }));
  writeFileSync(join(dir, "404.html"), page({ canonical: `${origin}${base}404.html` }));
}

test("html gate accepts preview URLs and rejects production canonicals", () => {
  const spec = { base, canonical: `${origin}${base}`, label: "index.html" };
  assert.deepEqual(htmlIssues(page({ canonical: `${origin}${base}` }), spec), []);
  const withBareRoot = page({
    canonical: `${origin}${base}`,
    extra: `<script type="application/ld+json">{"url":"${origin}${base.slice(0, -1)}"}</script>`,
  });
  assert.deepEqual(htmlIssues(withBareRoot, spec), []);
  const production = htmlIssues(page({ canonical: `${origin}/` }), spec);
  assert.ok(production.some((issue) => /canonical|production URL/.test(issue)));
  const indexed = page({ canonical: `${origin}${base}` }).replace("noindex, nofollow", "index, follow");
  assert.ok(htmlIssues(indexed, spec).some((issue) => /noindex/.test(issue)));
});

test("artifact gate accepts a closed static tree and rejects symlinks, sitemaps and path escapes", () => {
  const root = mkdtempSync(join(tmpdir(), "id42-preview-"));
  writePreview(root);
  assert.deepEqual(assertPreviewArtifact(root, 9), { number: 9, base });

  const sitemap = mkdtempSync(join(tmpdir(), "id42-preview-"));
  writePreview(sitemap);
  writeFileSync(join(sitemap, "sitemap-0.xml"), `<url><loc>${origin}/</loc></url>`);
  assert.throws(() => assertPreviewArtifact(sitemap, 9), /sitemap/);

  const linked = mkdtempSync(join(tmpdir(), "id42-preview-"));
  writePreview(linked);
  symlinkSync(join(linked, "index.html"), join(linked, "escape.html"));
  assert.throws(() => assertPreviewArtifact(linked, 9), /symlink/);

  const escaped = mkdtempSync(join(tmpdir(), "id42-preview-"));
  writePreview(escaped);
  writeFileSync(
    join(escaped, "index.html"),
    page({ canonical: `${origin}${base}`, extra: '<a href="/secret">x</a>' }),
  );
  assert.throws(() => assertPreviewArtifact(escaped, 9), /escapes preview|production URL|missing asset/);
});
