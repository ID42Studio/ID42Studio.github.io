/** Validate artifact provenance before a privileged workflow publishes static files. */

export function previewPlan(run, artifacts, pr) {
  if (!run || run.event !== "pull_request" || run.conclusion !== "success") return null;
  if (!Array.isArray(artifacts)) throw new Error("Expected exactly one preview artifact");

  const candidates = artifacts.filter(
    (artifact) => artifact && /^preview-pr-[1-9][0-9]*$/.test(artifact.name) && !artifact.expired,
  );
  if (candidates.length !== 1) throw new Error("Expected exactly one preview artifact");

  const artifact = candidates[0];
  const number = Number(artifact.name.slice("preview-pr-".length));
  if (!Number.isSafeInteger(number) || number < 1 || number !== pr?.number) {
    throw new Error("Artifact does not match PR");
  }
  if (pr.state !== "open" || pr.head?.sha !== run.head_sha) return null;
  if (!pr.head?.repo || pr.head.repo.full_name !== run.head_repository?.full_name) {
    throw new Error("Repository mismatch");
  }
  if (typeof artifact.id !== "number" || !Number.isSafeInteger(artifact.id) || artifact.id < 1) {
    throw new Error("Invalid artifact id");
  }
  return { number, artifactId: artifact.id };
}

/** Closing a PR with no published preview is an idempotent no-op. */
export async function previewRemovalPlan(pr, readDirectory) {
  if (!pr || pr.state !== "closed") return null;
  if (!Number.isSafeInteger(pr.number) || pr.number < 1) throw new Error("Invalid PR number");

  let entries;
  try {
    entries = await readDirectory(`pr-preview/pr-${pr.number}`, "gh-pages");
  } catch (error) {
    const status = error?.status ?? error?.response?.status;
    if (status === 404) return null;
    throw error;
  }
  if (!Array.isArray(entries)) throw new Error("Expected a preview directory");
  return entries.length ? { number: pr.number } : null;
}
