import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const workflowDir = join(root, ".github/workflows");

function workflow(name) {
  return readFileSync(join(workflowDir, name), "utf8");
}

function uses(text) {
  return [...text.matchAll(/^\s*uses:\s*(\S+)/gm)].map((match) => match[1]);
}

test("every action is pinned to a commit SHA and the old force-push deploy is gone", () => {
  assert.equal(existsSync(join(workflowDir, "deploy.yml")), false);
  const names = ["checks.yml", "pages.yml", "pages-preview.yml", "pages-deploy.yml"];
  const combined = names.map(workflow).join("\n");
  assert.doesNotMatch(combined, /git push -f/);
  for (const name of names) {
    const pins = uses(workflow(name));
    assert.ok(pins.length > 0, name);
    for (const pin of pins) assert.match(pin, /@[0-9a-f]{40}$/, `${name} ${pin}`);
  }
});

test("the pull request workflow cannot write contents and still runs the ship gate", () => {
  const checks = workflow("checks.yml");
  assert.match(checks, /contents:\s*read/);
  assert.doesNotMatch(checks, /contents:\s*write/);
  assert.doesNotMatch(checks, /pull_request_target/);
  assert.match(checks, /npm run ship/);
  assert.match(checks, /preview-pr-\$\{\{\s*github\.event\.pull_request\.number\s*\}\}/);
  assert.match(checks, /actions:\s*write/);
});

test("the publisher checks out main, validates the artifact and never builds PR code", () => {
  const preview = workflow("pages-preview.yml");
  assert.match(preview, /ref:\s*main/);
  assert.match(preview, /persist-credentials:\s*false/);
  assert.match(preview, /node scripts\/verify-preview\.mjs/);
  assert.match(preview, /rossjrw\/pr-preview-action@873417d2df72380da1f3978378fb58560bcde976/);
  assert.match(preview, /marocchino\/sticky-pull-request-comment@773744901bac0e8cbb5a0dc842800d45e9b2b405/);
  assert.match(preview, /umbrella-dir:\s*pr-preview/);
  assert.doesNotMatch(preview, /pull_request\.head/);
  assert.doesNotMatch(preview, /workflow_run\.head_sha/);
  assert.doesNotMatch(preview, /\bnpm\b/);
  assert.doesNotMatch(preview, /\bastro\b/);
  assert.match(preview, /workflows:\s*\[Pull request checks\]/);
  assert.match(preview, /pull_request_target:\s*\n\s*types:\s*\[closed\]/);
});

test("production publish keeps pr-preview and the snapshot deploy does not run site code", () => {
  const pages = workflow("pages.yml");
  assert.match(pages, /npm run ship/);
  assert.match(pages, /clean-exclude:\s*pr-preview\//);
  assert.match(pages, /clean:\s*true/);
  assert.match(pages, /force:\s*false/);
  assert.match(pages, /group:\s*gh-pages/);

  const deploy = workflow("pages-deploy.yml");
  assert.match(deploy, /ref:\s*gh-pages/);
  assert.match(deploy, /actions\/deploy-pages@d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e/);
  assert.match(deploy, /workflows:\s*\[Pages, Pages preview\]/);
  assert.doesNotMatch(deploy, /pull_request\.head/);
  assert.doesNotMatch(deploy, /\bnpm\b/);
});
