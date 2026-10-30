import type { MatchResult, OCCUPATIONS, Profile, Scheme } from "./types";

type Occupation = (typeof OCCUPATIONS)[number];

/**
 * Niche schemes (research fellowships, startup grants, awards) often have no rule that
 * excludes anyone, so they "match" a 67-year-old farmer. Push them down unless the
 * person's work fits.
 */
const NICHE: Record<string, Occupation[]> = {
  research: ["student"],
  fellowship: ["student"],
  internship: ["student"],
  scientist: [],
  science: ["student"],
  "higher education": ["student"],
  phd: ["student"],
  coaching: ["student"],
  startup: ["entrepreneur"],
  innovation: ["entrepreneur", "student"],
  award: [],
  sports: ["sports_person"],
  artist: ["artisan"],
  culture: ["artisan"],
};

const STUDY = /student|scholarship|school|education|stipend/i;

/** How useful a scheme is likely to be for this person. Ordering only: never changes eligibility. */
export function relevance(s: Scheme, p: Profile) {
  const occ = p.occupation ?? [];
  const tags = s.tags.map((t) => t.toLowerCase());
  let score = 0;
  if (s.reviewed) score += 4;
  if (p.state && s.state === p.state) score += 2;
  if (p.area === "rural" && tags.some((t) => /rural|village|gramin/.test(t))) score += 1;
  if (tags.some((t) => t in NICHE && !NICHE[t].some((o) => occ.includes(o)))) score -= 3;
  if ((p.age ?? 0) >= 45 && !occ.includes("student") && s.tags.some((t) => STUDY.test(t))) score -= 3;
  return score;
}

const STATUS_ORDER = { eligible: 0, maybe: 1, ineligible: 2 } as const;

/** Re-rank engine results within each status, keeping the engine's order as the tie-breaker. */
export function rankResults(results: MatchResult[], profile: Profile, get: (slug: string) => Scheme | undefined) {
  const score = new Map(results.map((r) => [r.slug, relevance(get(r.slug)!, profile)]));
  return results
    .map((r, i) => ({ r, i }))
    .sort(
      (a, b) =>
        STATUS_ORDER[a.r.status] - STATUS_ORDER[b.r.status] ||
        Number(b.r.specificity > 0) - Number(a.r.specificity > 0) ||
        score.get(b.r.slug)! - score.get(a.r.slug)! ||
        a.i - b.i,
    )
    .map(({ r }) => r);
}
