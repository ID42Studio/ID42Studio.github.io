import type { Locale } from "../i18n";
import {
  DOMAIN_KEYS,
  MODEL_KEYS,
  PLAYGROUND,
  type DomainKey,
  type ModelKey,
  type StepTemplate,
} from "./playground-data.ts";

export interface FlowStep {
  label: string;
  detail: string;
}

export interface Analysis {
  /** Best-scoring delivery model. */
  model: ModelKey;
  /** Best-scoring operational domain. */
  domain: DomainKey;
  /** 0..1 — how separated the winning model is from the runner-up. */
  confidence: number;
  /** Cues found in the text, strongest first. */
  signals: string[];
  flow: FlowStep[];
  result: string;
  /** False when the text had almost no usable signal. */
  matched: boolean;
}

const MIN_LENGTH = 8;

/** Accent-insensitive, lowercase, single-spaced. */
function normalise(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function fill(template: string, domain: (typeof PLAYGROUND)[Locale]["domains"][DomainKey]): string {
  return template
    .replace(/\{\{noun\}\}/g, domain.noun)
    .replace(/\{\{batch\}\}/g, domain.batch)
    .replace(/\{\{signal\}\}/g, domain.signal)
    .replace(/\{\{artifact\}\}/g, domain.artifact)
    .replace(/\{\{outcome\}\}/g, domain.outcome);
}

function score(
  text: string,
  cues: string[],
): { total: number; hits: { cue: string; weight: number }[] } {
  const hits: { cue: string; weight: number }[] = [];

  for (const cue of cues) {
    const needle = normalise(cue);
    if (!needle) continue;

    // Portuguese and English verbs inflect ("conferir" → "conferindo",
    // "invoice" → "invoices"). For longer cues, accept the stem as well.
    const stem = needle.length >= 7 ? needle.slice(0, needle.length - 2) : needle;
    const matched = text.includes(needle) || (stem !== needle && text.includes(stem));
    if (!matched) continue;

    // Longer phrases are stronger evidence than single words.
    hits.push({ cue, weight: 1 + Math.min(needle.length / 18, 1) });
  }

  return { total: hits.reduce((sum, hit) => sum + hit.weight, 0), hits };
}

/**
 * Deterministic, offline classifier: it scores linguistic cues for each
 * delivery model and operational domain, then fills a flow template with the
 * domain's nouns. No model download, no network, same input → same output.
 */
export function analyze(description: string, locale: Locale): Analysis {
  const data = PLAYGROUND[locale];
  const text = normalise(description);

  const modelScores = {} as Record<ModelKey, number>;
  const modelHits = {} as Record<ModelKey, { cue: string; weight: number }[]>;

  for (const key of MODEL_KEYS) {
    const result = score(text, data.models[key].cues);
    modelScores[key] = result.total;
    modelHits[key] = result.hits;
  }

  let bestModel: ModelKey = "build";
  for (const key of MODEL_KEYS) {
    if (modelScores[key] > modelScores[bestModel]) bestModel = key;
  }

  const ranked = [...MODEL_KEYS].sort((a, b) => modelScores[b] - modelScores[a]);
  const top = modelScores[ranked[0]];
  const second = modelScores[ranked[1]];
  const matched = text.length >= MIN_LENGTH && top > 0;

  // Confidence blends separation (how far ahead the winner is) with evidence
  // mass (how much signal the text actually carried).
  const separation = top / (top + second || 0.001);
  const evidence = Math.min(1, top / 5);
  const confidence = !matched ? 0.15 : Math.min(0.95, 0.25 + 0.7 * separation * evidence);

  const domainScores = {} as Record<DomainKey, number>;
  const domainHits = {} as Record<DomainKey, { cue: string; weight: number }[]>;

  for (const key of DOMAIN_KEYS) {
    const result = score(text, data.domains[key].cues);
    domainScores[key] = result.total;
    domainHits[key] = result.hits;
  }

  let bestDomain: DomainKey = "generic";
  for (const key of DOMAIN_KEYS) {
    if (domainScores[key] > domainScores[bestDomain]) bestDomain = key;
  }

  const domain = data.domains[bestDomain];
  const model = data.models[bestModel];

  // Deduplicate overlapping cues ("invoice" / "invoices") keeping the longest.
  const candidates = [
    ...modelHits[bestModel].map((hit) => hit.cue),
    ...domainHits[bestDomain].map((hit) => hit.cue),
  ].sort((a, b) => b.length - a.length);

  const signals: string[] = [];
  for (const cue of candidates) {
    const needle = normalise(cue);
    if (signals.some((kept) => normalise(kept).includes(needle) || needle.includes(normalise(kept)))) {
      continue;
    }
    signals.push(cue);
    if (signals.length === 6) break;
  }

  const flow = model.steps.map((step: StepTemplate) => ({
    label: fill(step.label, domain),
    detail: fill(step.detail, domain),
  }));

  return {
    model: bestModel,
    domain: bestDomain,
    confidence,
    signals,
    flow,
    result: fill(model.result, domain),
    matched,
  };
}
