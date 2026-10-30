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
    <div className="flex flex-col gap-5">
      <header className="enter">
        <h1 className="font-display text-[2rem] font-semibold leading-tight">{t.browse.title}</h1>
        <p className="mt-0.5 text-muted">
          <b className="text-text tabular-nums">{list.length.toLocaleString("en-IN")}</b> {t.browse.results}
          {!q && ` · ${t.browse.usefulFirst}`}
        </p>
      </header>

      <form action={`/${lang}/schemes`} role="search" className="enter flex flex-col gap-2.5" style={{ "--i": 1 } as React.CSSProperties}>
        {cat && <input type="hidden" name="cat" value={cat} />}
        <div className="relative">
          <Icon name="search" size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            name="q"
            defaultValue={q}
            placeholder={t.browse.search}
            aria-label={t.browse.search}
            enterKeyHint="search"
            className="field rounded-full pl-12"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Icon name="mapPin" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <AutoSubmitSelect
              name="state"
              defaultValue={state}
              aria-label={t.find.q.state}
              className="field appearance-none truncate rounded-full pl-11 pr-10"
            >
              <option value="">{t.browse.allStates}</option>
              <option value="central">{t.browse.centralOnly}</option>
              {states().map((s) => (
                <option key={s} value={s}>
                  {stateLabel(s, lang)}
                </option>
              ))}
            </AutoSubmitSelect>
            <Icon name="chevronDown" size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
          </div>
          <button className="btn btn-primary pressable h-14 px-6">{t.browse.searchBtn}</button>
        </div>
      </form>

      <nav aria-label={t.home.topics} className="enter -mx-4" style={{ "--i": 2 } as React.CSSProperties}>
        <ul className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1">
          <li>
            <Link
              href={href({ cat: undefined, page: undefined })}
              scroll={false}
              aria-current={!cat ? "true" : undefined}
              className={`pressable chip h-10 whitespace-nowrap border px-4 text-[0.92rem] ${!cat ? "border-brand bg-brand text-brand-ink" : "border-border-strong bg-surface"}`}
            >
              {t.browse.allTopics}
            </Link>
          </li>
          {CATEGORIES.map((c) => {
            const on = cat === c.id;
            return (
              <li key={c.id}>
                <Link
                  href={href({ cat: on ? undefined : c.id, page: undefined })}
                  scroll={false}
                  aria-current={on ? "true" : undefined}
                  className={`pressable chip h-10 whitespace-nowrap border px-3.5 text-[0.92rem] ${
                    on ? "border-brand bg-brand text-brand-ink" : "border-border-strong bg-surface"
                  }`}
                >
                  <Icon name={c.icon} size={17} />
                  {c.label[lang]}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {list.length === 0 ? (
        <div className="enter card flex flex-col items-center gap-3 px-6 py-10 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-surface-2 text-muted">
            <Icon name="search" size={26} />
          </span>
          <p className="max-w-sm text-muted">{t.browse.noResults}</p>
          <Link href={`/${lang}/schemes`} className="btn btn-ghost pressable min-h-11 text-base">
            {t.browse.clear}
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
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
              tags={s.tags}
              reviewed={s.reviewed}
              reviewedLabel={t.scheme.reviewed}
              saveLabels={{ save: t.scheme.save, saved: t.scheme.saved }}
            />
          ))}
        </ul>
      )}

      {list.length > shown.length && (
        <Link href={href({ page: String(page + 1) })} scroll={false} className="btn btn-ghost pressable w-full">
          {t.find.showMore} ({(list.length - shown.length).toLocaleString("en-IN")})
          <Icon name="chevronDown" size={18} />
        </Link>
      )}
    </div>
  );
}
