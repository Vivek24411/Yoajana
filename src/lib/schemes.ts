import "server-only";
import fs from "node:fs";
import path from "node:path";
import MiniSearch from "minisearch";
import type { Scheme } from "./types";
import { expandQuery } from "./synonyms";
import { fixGlue } from "./format";
import { inCategory, type CategoryId } from "./categories";

let cache: { list: Scheme[]; bySlug: Map<string, Scheme>; index: MiniSearch<Scheme> } | null = null;

const TEXT_FIELDS = ["details", "benefits", "eligibility", "exclusions", "applicationProcess", "documents", "faq"] as const;

// Names sort badly with leading quotes ("“Advance…”"); compare on letters only.
const sortKey = (name: string) => name.replace(/^[^\p{L}\p{N}]+/u, "").toLowerCase();

function load() {
  if (cache) return cache;
  const file = path.join(process.cwd(), "data", "schemes.json");
  const raw = JSON.parse(fs.readFileSync(file, "utf8")) as Scheme[];
  const list = raw.map((s) => {
    const copy = { ...s };
    for (const f of TEXT_FIELDS) copy[f] = fixGlue(s[f] ?? "");
    return copy;
  });
  const index = new MiniSearch<Scheme>({
    idField: "slug",
    fields: ["name", "tagText", "details", "benefits", "eligibility"],
    extractField: (doc, field) =>
      field === "tagText" ? doc.tags.join(" ") : (doc[field as keyof Scheme] as string),
    searchOptions: {
      boost: { name: 5, tagText: 3, eligibility: 1.2 },
      prefix: (term) => term.length > 3,
      fuzzy: (term) => (term.length > 5 ? 0.15 : false),
      combineWith: "OR",
    },
  });
  index.addAll(list);
  cache = { list, bySlug: new Map(list.map((s) => [s.slug, s])), index };
  return cache;
}

export function allSchemes() {
  return load().list;
}

export function getScheme(slug: string) {
  return load().bySlug.get(slug);
}

export function searchSchemes(query: string, opts: { state?: string; limit?: number } = {}) {
  const { index, bySlug } = load();
  const q = expandQuery(query);
  if (!q.trim()) return [];
  // Nationally applicable and hand-reviewed schemes are what most people are asking about.
  const hits = index.search(q, {
    boostDocument: (id) => {
      const s = bySlug.get(String(id));
      return (s?.level === "central" ? 1.6 : 1) * (s?.reviewed ? 2 : 1);
    },
  });
  const out: Scheme[] = [];
  for (const hit of hits) {
    const s = bySlug.get(String(hit.id));
    if (!s) continue;
    // Central schemes apply everywhere; state schemes only in that state.
    if (opts.state && s.state && s.state !== opts.state) continue;
    out.push(s);
    if (out.length >= (opts.limit ?? 20)) break;
  }
  return out;
}

/**
 * Browse listing. Without a search query, show what most people need first:
 * hand-reviewed schemes, then the chosen state's own schemes, then central ones.
 */
export function browseSchemes(opts: { q?: string; state?: string; category?: CategoryId }) {
  const { q, state, category } = opts;
  const central = state === "central";
  const stateName = state && !central ? state : undefined;
  let list = q ? searchSchemes(q, { state: stateName, limit: 400 }) : allSchemes();
  if (central) list = list.filter((s) => s.level === "central");
  else if (stateName) list = list.filter((s) => !s.state || s.state === stateName);
  if (category) list = list.filter((s) => inCategory(s.tags, category));
  if (!q) {
    list = [...list].sort(
      (a, b) =>
        Number(Boolean(b.reviewed)) - Number(Boolean(a.reviewed)) ||
        Number(Boolean(stateName && b.state)) - Number(Boolean(stateName && a.state)) ||
        Number(b.level === "central") - Number(a.level === "central") ||
        sortKey(a.name).localeCompare(sortKey(b.name)),
    );
  }
  return list;
}

/** A few related schemes for the detail page, limited to places the person could apply. */
export function similarSchemes(s: Scheme, limit = 4) {
  const query = [...s.tags.filter((t) => !/sign in/i.test(t)).slice(0, 4), s.name].join(" ");
  return searchSchemes(query, { state: s.state ?? undefined, limit: limit + 1 })
    .filter((x) => x.slug !== s.slug)
    .slice(0, limit);
}

export function popularSchemes() {
  return allSchemes().filter((s) => s.reviewed);
}

export function states() {
  return [...new Set(allSchemes().map((s) => s.state).filter(Boolean) as string[])].sort();
}
