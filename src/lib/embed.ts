import type { Exemplar } from "./exemplars.ts";

/**
 * A tiny vector space built from hand-written examples: character n-grams
 * inside words + TF-IDF + cosine similarity.
 *
 * Why not a neural model: the smallest multilingual sentence encoder carries a
 * 250k-token vocabulary and lands at 60–120 MB quantised — orders of magnitude
 * above the weight of this entire page. Retrieval over the page's own corpus
 * gives paraphrase tolerance with zero download and zero network.
 */

export interface SparseVector {
  /** term index → weight (TF-IDF, L2-normalised). */
  weights: Map<number, number>;
}

export interface VectorIndex {
  terms: Map<string, number>;
  idf: number[];
  docs: SparseVector[];
  items: Exemplar[];
}

const NGRAM_MIN = 3;
const NGRAM_MAX = 4;

/** Lowercase, accent-free, punctuation-free. */
export function normalise(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Word tokens plus character n-grams of each boundary-padded word, so that
 * "conferindo", "conferir" and "conferencia" share most of their features.
 */
function features(text: string): string[] {
  const tokens: string[] = [];

  for (const word of normalise(text).split(" ")) {
    if (!word) continue;
    tokens.push(`w:${word}`);

    const padded = `^${word}$`;
    for (let size = NGRAM_MIN; size <= NGRAM_MAX; size += 1) {
      for (let start = 0; start + size <= padded.length; start += 1) {
        tokens.push(`g:${padded.slice(start, start + size)}`);
      }
    }
  }

  return tokens;
}

function termFrequencies(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const token of features(text)) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return counts;
}

export function buildIndex(items: Exemplar[]): VectorIndex {
  const documentFrequency = new Map<string, number>();
  const frequencies = items.map((item) => {
    const counts = termFrequencies(item.text);
    for (const term of counts.keys()) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
    }
    return counts;
  });

  const terms = new Map<string, number>();
  const idf: number[] = [];

  for (const [term, df] of documentFrequency) {
    // Features present in a single document only add noise to short queries.
    if (df < 2) continue;
    terms.set(term, idf.length);
    idf.push(Math.log((items.length + 1) / (df + 1)) + 1);
  }

  const docs = frequencies.map((counts) => vectorise(counts, terms, idf));

  return { terms, idf, docs, items };
}

/** TF-IDF weighting followed by L2 normalisation. */
function vectorise(
  counts: Map<string, number>,
  terms: Map<string, number>,
  idf: number[],
): SparseVector {
  const weights = new Map<number, number>();
  let sum = 0;

  for (const [term, count] of counts) {
    const position = terms.get(term);
    if (position === undefined) continue;
    const weight = (1 + Math.log(count)) * idf[position];
    weights.set(position, weight);
    sum += weight * weight;
  }

  const norm = Math.sqrt(sum) || 1;
  for (const [position, weight] of weights) {
    weights.set(position, weight / norm);
  }

  return { weights };
}

export function embed(text: string, index: VectorIndex): SparseVector {
  return vectorise(termFrequencies(text), index.terms, index.idf);
}

export function cosine(a: SparseVector, b: SparseVector): number {
  const [small, large] = a.weights.size <= b.weights.size ? [a, b] : [b, a];
  let dot = 0;

  for (const [position, weight] of small.weights) {
    const other = large.weights.get(position);
    if (other !== undefined) dot += weight * other;
  }

  return dot;
}

export interface Neighbour {
  text: string;
  score: number;
  model: Exemplar["model"];
  domain: Exemplar["domain"];
}

export function neighbours(text: string, index: VectorIndex, limit = 3): Neighbour[] {
  const query = embed(text, index);

  return index.docs
    .map((doc, position) => ({
      text: index.items[position].text,
      model: index.items[position].model,
      domain: index.items[position].domain,
      score: cosine(query, doc),
    }))
    .filter((item) => item.score > 0.02)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
