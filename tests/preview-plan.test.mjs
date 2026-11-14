import test from "node:test";
import assert from "node:assert/strict";
import { previewPlan, previewRemovalPlan } from "../scripts/preview-plan.mjs";

const run = {
  event: "pull_request",
  conclusion: "success",
  head_sha: "abc",
  head_repository: { full_name: "contributor/site" },
};
const pr = { number: 123, state: "open", head: { sha: "abc", repo: { full_name: "contributor/site" } } };
const artifact = { name: "preview-pr-123", id: 42, expired: false };

test("publisher accepts current fork and same-repository builds and skips stale or closed PRs", () => {
  assert.deepEqual(previewPlan(run, [artifact], pr), { number: 123, artifactId: 42 });
  const repo = { full_name: "ID42Studio/ID42Studio.github.io" };
  assert.deepEqual(
    previewPlan({ ...run, head_repository: repo }, [artifact], { ...pr, head: { sha: "abc", repo } }),
    { number: 123, artifactId: 42 },
  );
  assert.equal(previewPlan(run, [artifact], { ...pr, state: "closed" }), null);
  assert.equal(previewPlan({ ...run, head_sha: "old" }, [artifact], pr), null);
  assert.equal(previewPlan({ ...run, conclusion: "failure" }, [artifact], pr), null);
  assert.equal(previewPlan({ ...run, event: "push" }, [artifact], pr), null);
  assert.equal(previewPlan(run, [{ ...artifact, expired: true }, artifact], pr).artifactId, 42);
});

test("publisher rejects artifact spoofing, expired or duplicate artifacts and repository mismatch", () => {
  assert.throws(() => previewPlan(run, [{ ...artifact, name: "preview-pr-124" }], pr), /match PR/);
  assert.throws(() => previewPlan(run, [artifact, artifact], pr), /exactly one/);
  assert.throws(() => previewPlan(run, [{ ...artifact, expired: true }], pr), /exactly one/);
  assert.throws(() => previewPlan(run, [{ ...artifact, name: "../preview-pr-123" }], pr), /exactly one/);
  assert.throws(() => previewPlan(run, [{ ...artifact, name: "preview-pr-0123" }], pr), /exactly one/);
  assert.throws(() => previewPlan(run, [{ ...artifact, id: 0 }], pr), /artifact id/);
  assert.throws(
    () => previewPlan({ ...run, head_repository: { full_name: "other/repo" } }, [artifact], pr),
    /Repository mismatch/,
  );
  assert.throws(() => previewPlan(run, [artifact], { ...pr, head: { sha: "abc", repo: null } }), /Repository mismatch/);
});

test("preview cleanup is idempotent for missing previews and only removes closed PR directories", async () => {
  const closed = { number: 9, state: "closed" };
  assert.equal(await previewRemovalPlan(closed, async () => {
    throw { status: 404 };
  }), null);
  assert.equal(await previewRemovalPlan(closed, async () => {
    const error = new Error("missing");
    error.response = { status: 404 };
    throw error;
  }), null);
  assert.equal(await previewRemovalPlan(closed, async () => []), null);
  assert.equal(await previewRemovalPlan({ ...closed, state: "open" }, () => assert.fail("should not read")), null);
  assert.deepEqual(
    await previewRemovalPlan(closed, async (path, ref) => {
      assert.equal(path, "pr-preview/pr-9");
      assert.equal(ref, "gh-pages");
      return [{ name: "index.html", type: "file" }];
    }),
    { number: 9 },
  );
  await assert.rejects(previewRemovalPlan(closed, async () => {
    throw new Error("permission denied");
  }), /permission denied/);
  await assert.rejects(previewRemovalPlan(closed, async () => ({ type: "file" })), /directory/);
  await assert.rejects(previewRemovalPlan({ number: 0, state: "closed" }, async () => []), /Invalid PR number/);
});
