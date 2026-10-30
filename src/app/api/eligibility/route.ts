import { findSchemes, summarize } from "@/lib/eligibility";
import { profileSchema } from "@/lib/profile-schema";
import { rankResults } from "@/lib/relevance";
import { allSchemes, getScheme } from "@/lib/schemes";

// Enough for anyone to scroll through; keeps the response small on 2G/3G.
const CAP = { eligible: 300, maybe: 200, general: 120 } as const;

export async function POST(req: Request) {
  const parsed = profileSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid profile", issues: parsed.error.issues }, { status: 400 });
  }
  const all = rankResults(findSchemes(allSchemes(), parsed.data), parsed.data, getScheme);
  const group = (r: (typeof all)[number]) =>
    r.status === "maybe" ? "maybe" : r.specificity > 0 ? "eligible" : "general";
  const counts = { eligible: 0, maybe: 0, general: 0 };
  for (const r of all) counts[group(r)]++;

  if (new URL(req.url).searchParams.has("summary")) {
    const top = all.filter((r) => group(r) === "eligible").slice(0, 3).map((r) => ({ slug: r.slug, name: r.name }));
    return Response.json({ counts, top });
  }

  // No rule source text, no failed rules: just what the results screen shows.
  const seen = { eligible: 0, maybe: 0, general: 0 };
  const results = all
    .filter((r) => seen[group(r)]++ < CAP[group(r)])
    .map((r) => ({
      slug: r.slug,
      name: r.name,
      state: r.state,
      tags: r.tags.slice(0, 3),
      summary: summarize(r.summary, 150),
      group: group(r),
      matched: [...new Set(r.matched.map((m) => m.field))],
      unknown: r.unknown,
      reviewed: r.reviewed,
    }));
  return Response.json({ counts, results });
}
