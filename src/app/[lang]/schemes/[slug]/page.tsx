import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import { DocChecklist, MyEligibility, SchemeActions, SectionNav } from "@/components/scheme-client";
import { SectionHead } from "@/components/section-head";
import { summarize } from "@/lib/eligibility";
import { firstSentence, toFaq, toLines, toSteps } from "@/lib/format";
import { CSC_LOCATOR } from "@/lib/helplines";
import { fmt, getDictionary, hasLocale, numeral, stateLabel, type Locale } from "@/lib/i18n";
import { localName, POPULAR } from "@/lib/popular";
import { getScheme, similarSchemes } from "@/lib/schemes";

// "Indicative Documents", "Documents Required:" are headings in the source text, not papers to tick.
const DOC_HEADING = /^(indicative |mandatory |required |supporting )?documents?( required| needed)?\s*:?$/i;
// Short lines with no full stop ("Objective", "Note") are sub-headings.
const isSubheading = (l: string) => l.length < 32 && !/[.:;,?)]$/.test(l) && !/\d/.test(l);

export async function generateMetadata({ params }: PageProps<"/[lang]/schemes/[slug]">): Promise<Metadata> {
  const { slug, lang } = await params;
  const s = getScheme(slug);
  if (!s) return {};
  const local = hasLocale(lang) ? localName(slug, lang) : undefined;
  return { title: local ?? s.name, description: summarize(s.details, 160) };
}

export default async function SchemePage({ params }: PageProps<"/[lang]/schemes/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const s = getScheme(slug);
  if (!s) notFound();
  const t = getDictionary(lang);
  const sc = t.scheme;
  const local = localName(slug, lang);
  const display = local ?? s.name;
  const faq = toFaq(s.faq);
  const steps = toSteps(s.applicationProcess);
  const docs = toLines(s.documents).filter((l) => !DOC_HEADING.test(l));
  const ask = (q: string) => `/${lang}/chat?${new URLSearchParams({ q })}`;
  const speakText = [display, s.details, sc.benefits, s.benefits, sc.eligibility, s.eligibility].join(". ");
  const mainBenefit = POPULAR[slug]?.[lang].line ?? (s.benefits ? firstSentence(s.benefits) : "");
  const similar = similarSchemes(s);

  const sections = [
    s.details && { id: "about", label: sc.details },
    s.benefits && { id: "benefits", label: sc.benefits },
    s.eligibility && { id: "eligibility", label: sc.eligibility },
    docs.length > 0 && { id: "documents", label: sc.documents },
    s.applicationProcess && { id: "apply", label: sc.applicationProcess },
    faq.length > 0 && { id: "faq", label: sc.faq },
  ].filter(Boolean) as { id: string; label: string }[];
  const num = (id: string) => numeral(sections.findIndex((x) => x.id === id) + 1, lang);

  return (
    <article className="flex flex-col gap-7">
      <header className="enter flex flex-col gap-2">
        <Link href={`/${lang}/schemes`} className="mb-2 inline-flex items-center gap-1 self-start text-sm font-bold text-muted hover:text-ink">
          <Icon name="arrowLeft" size={16} />
          {sc.backToAll}
        </Link>
        <p className="kicker">
          {s.state ? stateLabel(s.state, lang) : sc.central}
          {s.ministry && <span className="font-semibold normal-case tracking-normal text-muted"> · {s.ministry}</span>}
        </p>
        <h1 className="font-display text-[2.35rem] leading-[1.08] text-balance">{display}</h1>
        {local && <p className="text-lg font-semibold leading-snug text-muted">{s.name}</p>}
        {s.reviewed && (
          <p className="inline-flex items-center gap-1.5 text-sm font-bold text-stamp">
            <Icon name="shield" size={16} />
            {sc.reviewed}
          </p>
        )}
        <div className="mt-3">
          <SchemeActions lang={lang} slug={slug} name={s.name} displayName={display} state={s.state} speakText={speakText} t={t} />
        </div>
      </header>

      {mainBenefit && (
        <blockquote className="enter border-l-4 border-accent pl-4" style={{ "--i": 2 } as React.CSSProperties}>
          <p className="kicker">{sc.mainBenefit}</p>
          <p className="mt-1 text-[1.4rem] font-bold leading-snug text-pretty">{mainBenefit}</p>
        </blockquote>
      )}

      <div className="enter" style={{ "--i": 3 } as React.CSSProperties}>
        <MyEligibility lang={lang} rules={s.rules} t={t} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={ask(fmt(sc.explainPrompt, { name: s.name }))} className="btn btn-accent pressable flex-1 sm:flex-none">
          <Icon name="chat" size={19} />
          {sc.explain}
        </Link>
        <Link href={ask(fmt(sc.askPrompt, { name: s.name }))} className="btn btn-line pressable flex-1 sm:flex-none">
          <Icon name="mic" size={19} />
          {sc.askAbout}
        </Link>
      </div>

      {sections.length > 1 && <SectionNav sections={sections} label={sc.details} />}

      {sc.englishNote && (
        <p className="flex items-start gap-2.5 text-sm leading-relaxed text-muted">
          <Icon name="info" size={17} className="mt-0.5 flex-none" />
          {sc.englishNote}
        </p>
      )}

      {s.details && (
        <Section id="about" n={num("about")} title={sc.details}>
          <div className="flex flex-col gap-2.5">
            {toLines(s.details).map((line, i) =>
              isSubheading(line) ? (
                <p key={i} className="kicker pt-1">{line}</p>
              ) : (
                <p key={i} className="text-pretty">{line}</p>
              ),
            )}
          </div>
        </Section>
      )}

      {s.benefits && (
        <Section id="benefits" n={num("benefits")} title={sc.benefits}>
          <Bullets lines={toLines(s.benefits)} />
        </Section>
      )}

      {s.eligibility && (
        <Section id="eligibility" n={num("eligibility")} title={sc.eligibility}>
          <Bullets lines={toLines(s.eligibility)} />
          {s.exclusions && (
            <details className="mt-4 border-y border-rule">
              <summary className="flex cursor-pointer items-center justify-between gap-2 py-3 font-bold">
                {sc.exclusions}
                <Icon name="plus" size={20} className="faq-chevron flex-none text-accent transition-transform duration-300" />
              </summary>
              <div className="faq-body pb-4">
                <Bullets lines={toLines(s.exclusions)} />
              </div>
            </details>
          )}
        </Section>
      )}

      {docs.length > 0 && (
        <Section id="documents" n={num("documents")} title={sc.documents}>
          <DocChecklist slug={slug} lines={docs} t={sc} />
        </Section>
      )}

      {s.applicationProcess && (
        <Section id="apply" n={num("apply")} title={sc.applicationProcess}>
          {steps.intro.length > 0 && (
            <div className="mb-4 flex flex-col gap-1.5">
              {steps.intro.map((l, i) => (
                <p key={i} className={i === 0 && steps.steps.length ? "font-bold" : ""}>
                  {l}
                </p>
              ))}
            </div>
          )}
          {steps.steps.length > 0 && (
            <ol className="flex flex-col">
              {steps.steps.map((step, i) => (
                <li key={i} className="flex gap-4 border-t border-rule py-3 first:border-t-0 first:pt-0">
                  <span className="w-8 flex-none font-display text-[1.75rem] leading-none text-accent">{numeral(i + 1, lang, 1)}</span>
                  <p className="text-pretty">{step}</p>
                </li>
              ))}
            </ol>
          )}
        </Section>
      )}

      <aside className="notice flex flex-col gap-3">
        <p className="font-display text-2xl leading-none">{sc.whereToApply}</p>
        <p className="leading-relaxed">{sc.cscBody}</p>
        <div className="flex flex-wrap gap-2">
          <a href={CSC_LOCATOR} target="_blank" rel="noopener noreferrer" className="btn btn-ink pressable">
            <Icon name="mapPin" size={18} />
            {sc.findCsc}
          </a>
          <a href={s.officialUrl} target="_blank" rel="noopener noreferrer" className="btn btn-line pressable">
            {sc.official}
            <Icon name="external" size={16} />
          </a>
        </div>
      </aside>

      {faq.length > 0 && (
        <Section id="faq" n={num("faq")} title={sc.faq}>
          <div className="flex flex-col">
            {faq.slice(0, 12).map((item, i) => (
              <details key={i} className="border-b border-rule">
                <summary className="flex cursor-pointer items-start justify-between gap-3 py-3.5 font-bold">
                  <span className="text-pretty">{item.q}</span>
                  <Icon name="plus" size={20} className="faq-chevron mt-0.5 flex-none text-accent transition-transform duration-300" />
                </summary>
                <p className="faq-body pb-4 text-pretty text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </Section>
      )}

      {s.sources.length > 0 && (
        <section className="flex flex-col gap-2">
          <p className="kicker">{sc.sources}</p>
          {s.sources.map((u) => (
            <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="break-all text-[0.95rem] font-semibold underline decoration-rule decoration-2 underline-offset-4 hover:decoration-accent">
              {u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
            </a>
          ))}
        </section>
      )}

      {similar.length > 0 && <Similar lang={lang} title={sc.similar} central={sc.central} items={similar} />}
    </article>
  );
}

function Section({ id, n, title, children }: { id: string; n: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-32 flex-col gap-4">
      <SectionHead n={n} title={title} />
      {children}
    </section>
  );
}

function Bullets({ lines }: { lines: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-3 text-pretty">
          <span aria-hidden className="flex-none text-accent">—</span>
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

function Similar({ lang, title, central, items }: { lang: Locale; title: string; central: string; items: { slug: string; name: string; state: string | null }[] }) {
  return (
    <section className="flex flex-col pt-2">
      <SectionHead title={title} />
      <ul>
        {items.map((x) => (
          <li key={x.slug}>
            <Link href={`/${lang}/schemes/${x.slug}`} className="group flex items-center gap-3 border-b border-rule py-3.5">
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold uppercase tracking-wide text-muted">{x.state ? stateLabel(x.state, lang) : central}</span>
                <span className="line-clamp-2 font-bold leading-snug group-hover:text-accent">{localName(x.slug, lang) ?? x.name}</span>
              </span>
              <Icon name="arrowRight" size={18} className="flex-none text-muted transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
