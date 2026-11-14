#!/usr/bin/env node
/**
 * Build the static PR preview into dist-preview/ (or OUT_DIR).
 * Does not run the production gate; callers run `npm run ship` separately.
 */
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { previewBase, previewNumber, prefixRootUrls, rewriteManifest } from "./preview-base.mjs";

const number = previewNumber(process.env.PR_NUMBER);
const base = previewBase(`/pr-preview/pr-${number}/`);
const outDir = process.env.OUT_DIR ?? "dist-preview";

const result = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  env: { ...process.env, SITE_BASE: base, OUT_DIR: outDir },
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

rewriteTree(outDir, base);

const manifestPath = join(outDir, "manifest.webmanifest");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
writeFileSync(manifestPath, `${JSON.stringify(rewriteManifest(manifest, base), null, 2)}\n`);

console.log(`Preview ${number} written to ${outDir} at ${base}`);

function rewriteTree(dir, basePath) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      rewriteTree(full, basePath);
      continue;
    }
    const ext = extname(name);
    if (ext !== ".html" && ext !== ".css") continue;
    const before = readFileSync(full, "utf8");
    const after = prefixRootUrls(before, basePath);
    if (after !== before) writeFileSync(full, after);
  }
}
