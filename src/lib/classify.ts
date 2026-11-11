import type { Locale } from "../i18n";
import {
  DOMAIN_KEYS,
  MODEL_KEYS,
  PLAYGROUND,
  type DomainKey,
  type ModelKey,
  type StepTemplate,
} from "./playground-data.ts";
import { EXEMPLARS } from "./exemplars.ts";
import { buildIndex, neighbours, normalise, type Neighbour, type VectorIndex } from "./embed.ts";

export interface FlowStep {
  label: string;
  detail: string;
}

export interface Analysis {
  /** Best-scoring delivery model. */
  model: ModelKey;
  /** Best-scoring operational domain. */
  domain: DomainKey;
  /** 0..1 — separation between winner and runner-up, weighted by evidence. */
  confidence: number;
  /** Cues found in the text, strongest first. */
  signals: string[];
  /** Closest examples from the corpus, with similarity. */
  neighbours: Neighbour[];
  flow: FlowStep[];
  result: string;
  /** False when the text carried almost no usable signal. */
  matched: boolean;
}

const MIN_LENGTH = 8;
/** Share of the score that comes from the lexicon; the rest comes from vectors. */
const LEXICON_WEIGHT = 0.42;
/** Similarity below this is treated as noise. */
const VECTOR_FLOOR = 0.06;

const indexes = new Map<Locale, VectorIndex>();

function indexFor(locale: Locale): VectorIndex {
  const cached = indexes.get(locale);
  if (cached) return cached;

  const built = buildIndex(EXEMPLARS[locale]);
  indexes.set(locale, built);
  return built;
}

function fill(template: string, domain: (typeof PLAYGROUND)[Locale]["domains"][DomainKey]): string {
  return template
    .replace(/\{\{noun\}\}/g, domain.noun)
    .replace(/\{\{batch\}\}/g, domain.batch)
    .replace(/\{\{signal\}\}/g, domain.signal)
    .replace(/\{\{artifact\}\}/g, domain.artifact)
    .replace(/\{\{outcome\}\}/g, domain.outcome);
}

function cueScore(
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

function normaliseScores<T extends string>(scores: Record<T, number>): Record<T, number> {
  const values = Object.values(scores) as number[];
  const max = values.length ? Math.max(...values, 0) : 0;
  if (max <= 0) return scores;

  const out = {} as Record<T, number>;
  for (const key of Object.keys(scores) as T[]) out[key] = scores[key] / max;
  return out;
}

function best<T extends string>(scores: Record<T, number>, keys: readonly T[], fallback: T): T {
  let winner = fallback;
  for (const key of keys) {
    if (scores[key] > scores[winner]) winner = key;
  }
  return winner;
}

/**
 * Hybrid classifier: explicit linguistic cues (precision) combined with cosine
 * similarity against a corpus of hand-written process descriptions (recall).
 * Both signals are local and deterministic — same input, same output, no
 * network, no model download.
 */
export function analyze(description: string, locale: Locale): Analysis {
  const data = PLAYGROUND[locale];
  const index = indexFor(locale);
  const text = normalise(description);

  /* ------------------------------------------------------------- lexicon */

  const lexModel = {} as Record<ModelKey, number>;
  const lexHits = {} as Record<ModelKey, { cue: string; weight: number }[]>;

  for (const key of MODEL_KEYS) {
    const result = cueScore(text, data.models[key].cues);
    lexModel[key] = result.total;
    lexHits[key] = result.hits;
  }

  const lexDomain = {} as Record<DomainKey, number>;
  const domainHits = {} as Record<DomainKey, { cue: string; weight: number }[]>;

  for (const key of DOMAIN_KEYS) {
    const result = cueScore(text, data.domains[key].cues);
    lexDomain[key] = result.total;
    domainHits[key] = result.hits;
  }

  /* -------------------------------------------------------------- vector */

  const near = neighbours(description, index, 5);

  const vecModel = {} as Record<ModelKey, number>;
  for (const key of MODEL_KEYS) vecModel[key] = 0;
  for (const item of near) vecModel[item.model] = Math.max(vecModel[item.model], item.score);

  const vecDomain = {} as Record<DomainKey, number>;
  for (const key of DOMAIN_KEYS) vecDomain[key] = 0;
  for (const item of near) vecDomain[item.domain] = Math.max(vecDomain[item.domain], item.score);

  /* --------------------------------------------------------- combination */

  const vecModelNorm = normaliseScores(vecModel);
  const vecDomainNorm = normaliseScores(vecDomain);
  const lexModelNorm = normaliseScores(lexModel);
  const lexDomainNorm = normaliseScores(lexDomain);

  const vectorPresent = (Object.values(vecModel) as number[]).some((value) => value > VECTOR_FLOOR);
  const lexiconPresent = (Object.values(lexModel) as number[]).some((value) => value > 0);

  const vectorWeight = !vectorPresent ? 0 : !lexiconPresent ? 1 : 1 - LEXICON_WEIGHT;
  const lexiconWeight = 1 - vectorWeight;

  const modelScore = {} as Record<ModelKey, number>;
  for (const key of MODEL_KEYS) {
    modelScore[key] = vecModelNorm[key] * vectorWeight + lexModelNorm[key] * lexiconWeight;
  }

  const domainScore = {} as Record<DomainKey, number>;
  for (const key of DOMAIN_KEYS) {
    domainScore[key] = vecDomainNorm[key] * vectorWeight + lexDomainNorm[key] * lexiconWeight;
  }

  const bestModel = best(modelScore, MODEL_KEYS, "build");
  const bestDomain = best(domainScore, DOMAIN_KEYS, "generic");

  /* ----------------------------------------------------------- confidence */

  const ranked = [...MODEL_KEYS].sort((a, b) => modelScore[b] - modelScore[a]);
  const top = modelScore[ranked[0]];
  const second = modelScore[ranked[1]];

  const matched =
    text.length >= MIN_LENGTH && (top > 0.02 || (near[0]?.score ?? 0) > VECTOR_FLOOR);

  const separation = top / (top + second || 0.001);
  const evidence = Math.min(1, top * 1.35);
  const confidence = matched ? Math.min(0.95, 0.3 + 0.65 * separation * evidence) : 0.15;

  /* -------------------------------------------------------------- signals */

  const candidates = [
    ...lexHits[bestModel].map((hit) => hit.cue),
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

  /* ----------------------------------------------------------------- copy */

  const domain = data.domains[bestDomain];
  const model = data.models[bestModel];

  const flow = model.steps.map((step: StepTemplate) => ({
    label: fill(step.label, domain),
    detail: fill(step.detail, domain),
  }));

  return {
    model: bestModel,
    domain: bestDomain,
    confidence,
    signals,
    neighbours: near.slice(0, 3),
    flow,
    result: fill(model.result, domain),
    matched,
  };
}
