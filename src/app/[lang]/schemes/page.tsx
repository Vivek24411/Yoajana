import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoSubmitSelect } from "@/components/auto-submit-select";
import { Icon } from "@/components/icons";
import { SchemeCard } from "@/components/scheme-card";
import { CATEGORIES, isCategory } from "@/lib/categories";
import { summarize } from "@/lib/eligibility";
import { getDictionary, hasLocale, stateLabel } from "@/lib/i18n";
import { localName, POPULAR } from "@/lib/popular";
import { browseSchemes, states } from "@/lib/schemes";

const PAGE = 30;

export async function generateMetadata({ params }: PageProps<"/[lang]/schemes">): Promise<Metadata> {
  const { lang } = await params;
  return { title: getDictionary(hasLocale(lang) ? lang : "hi").browse.title };
}

export default async function BrowsePage({ params, searchParams }: PageProps<"/[lang]/schemes">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 200).trim() : "";
  const state = typeof sp.state === "string" ? sp.state : "";
  const cat = typeof sp.cat === "string" && isCategory(sp.cat) ? sp.cat : undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const list = browseSchemes({ q, state, category: cat });
  const shown = list.slice(0, page * PAGE);
  const href = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { q, state, cat, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return `/${lang}/schemes${s ? `?${s}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="enter">
        <h1 className="font-display text-[2.4rem] leading-tight">{t.browse.title}</h1>
        <p className="mt-0.5 text-muted">
          <b className="font-display text-lg font-normal text-ink tabular-nums">{list.length.toLocaleString("en-IN")}</b> {t.browse.results}
          {!q && ` · ${t.browse.usefulFirst}`}
        </p>
      </header>

      <form action={`/${lang}/schemes`} role="search" className="enter flex flex-col gap-3" style={{ "--i": 1 } as React.CSSProperties}>
        {cat && <input type="hidden" name="cat" value={cat} />}
        <div className="flex items-end gap-3">
          <div className="relative flex-1">
            <Icon name="search" size={20} className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 text-muted" />
            <input name="q" defaultValue={q} placeholder={t.browse.search} aria-label={t.browse.search} enterKeyHint="search" className="field pl-9" />
          </div>
          <button className="btn btn-ink pressable">{t.browse.searchBtn}</button>
        </div>
        <label className="flex items-center gap-2 text-[0.95rem]">
          <Icon name="mapPin" size={18} className="flex-none text-accent" />
          <span className="sr-only">{t.find.q.state}</span>
          <AutoSubmitSelect
            name="state"
            defaultValue={state}
            className="min-w-0 cursor-pointer appearance-none border-0 bg-transparent py-1 pr-6 font-bold underline decoration-rule decoration-2 underline-offset-4 outline-none"
          >
            <option value="">{t.browse.allStates}</option>
            <option value="central">{t.browse.centralOnly}</option>
            {states().map((s) => (
              <option key={s} value={s}>
                {stateLabel(s, lang)}
              </option>
            ))}
          </AutoSubmitSelect>
          <Icon name="chevronDown" size={16} className="-ml-6 flex-none text-muted" />
        </label>
      </form>

      <nav aria-label={t.home.topics} className="enter -mx-4 border-b border-rule" style={{ "--i": 2 } as React.CSSProperties}>
        <ul className="no-scrollbar flex gap-6 overflow-x-auto px-4">
          <li>
            <Link href={href({ cat: undefined, page: undefined })} scroll={false} aria-current={!cat ? "true" : undefined} className="tab block">
              {t.browse.allTopics}
            </Link>
          </li>
          {CATEGORIES.map((c) => (
            <li key={c.id}>
              <Link
                href={href({ cat: cat === c.id ? undefined : c.id, page: undefined })}
                scroll={false}
                aria-current={cat === c.id ? "true" : undefined}
                className="tab block"
              >
                {c.label[lang]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {list.length === 0 ? (
        <div className="enter flex flex-col items-start gap-4 py-6">
          <p className="font-display text-2xl">{t.browse.noResultsTitle}</p>
          <p className="max-w-sm text-muted">{t.browse.noResults}</p>
          <Link href={`/${lang}/schemes`} className="btn btn-line pressable">
            {t.browse.clear}
          </Link>
        </div>
      ) : (
        <ul className="-mt-2">
          {shown.map((s, i) => (
            <SchemeCard
              key={s.slug}
              index={i % PAGE}
              href={`/${lang}/schemes/${s.slug}`}
              slug={s.slug}
              name={s.name}
              localName={localName(s.slug, lang)}
              state={s.state}
              place={s.state ? stateLabel(s.state, lang) : t.scheme.central}
              summary={POPULAR[s.slug]?.[lang].line ?? summarize(s.details || s.benefits, 170)}
              reviewed={s.reviewed}
              reviewedLabel={t.scheme.reviewed}
              saveLabels={{ save: t.scheme.save, saved: t.scheme.saved }}
            />
          ))}
        </ul>
      )}

      {list.length > shown.length && (
        <Link href={href({ page: String(page + 1) })} scroll={false} className="btn btn-line pressable w-full">
          {t.find.showMore} ({(list.length - shown.length).toLocaleString("en-IN")})
          <Icon name="chevronDown" size={18} />
        </Link>
      )}
    </div>
  );
}
