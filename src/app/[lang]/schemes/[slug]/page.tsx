import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";
import { DocChecklist, MyEligibility, SchemeActions, SectionNav } from "@/components/scheme-client";
import { summarize } from "@/lib/eligibility";
import { firstSentence, toFaq, toLines, toSteps } from "@/lib/format";
import { CSC_LOCATOR } from "@/lib/helplines";
import { fmt, getDictionary, hasLocale, stateLabel } from "@/lib/i18n";
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

  return (
    <article className="flex flex-col gap-5">
      <Link href={`/${lang}/schemes`} className="enter inline-flex items-center gap-1 self-start rounded-full py-1 pr-2 text-sm font-semibold text-muted hover:text-text">
        <Icon name="chevronLeft" size={18} />
        {sc.backToAll}
      </Link>

      <header className="enter flex flex-col gap-2.5" style={{ "--i": 1 } as React.CSSProperties}>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-muted">
          <span className="chip bg-brand-soft text-brand">
            <Icon name={s.state ? "mapPin" : "shield"} size={14} />
            {s.state ? stateLabel(s.state, lang) : sc.central}
          </span>
          {s.ministry && <span>{s.ministry}</span>}
        </p>
        {local && <p className="font-display text-[1.65rem] font-semibold leading-tight text-brand">{local}</p>}
        <h1 className={`font-display font-semibold leading-[1.15] text-balance ${local ? "text-xl text-muted" : "text-[2rem]"}`}>{s.name}</h1>
        {s.reviewed && (
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-green">
            <Icon name="shield" size={16} />
            {sc.reviewed}
          </p>
        )}
      </header>

      <div className="enter" style={{ "--i": 2 } as React.CSSProperties}>
        <SchemeActions lang={lang} slug={slug} name={s.name} displayName={display} state={s.state} speakText={speakText} t={t} />
      </div>

      {mainBenefit && (
        <section className="enter relative overflow-hidden rounded-[1.25rem] bg-hero p-5 text-hero-ink" style={{ "--i": 3 } as React.CSSProperties}>
          <div aria-hidden className="absolute -right-8 -top-8 size-32 rounded-full bg-accent/25 blur-2xl" />
          <p className="relative flex items-center gap-2 text-sm font-bold text-accent">
            <Icon name="rupee" size={17} />
            {sc.mainBenefit}
          </p>
          <p className="relative mt-1.5 text-[1.15rem] font-semibold leading-snug text-pretty">{mainBenefit}</p>
        </section>
      )}

      <div className="enter" style={{ "--i": 4 } as React.CSSProperties}>
        <MyEligibility lang={lang} rules={s.rules} t={t} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={ask(fmt(sc.explainPrompt, { name: s.name }))} className="btn btn-accent pressable min-h-12 flex-1 text-base sm:flex-none">
          <Icon name="chat" size={19} />
          {sc.explain}
        </Link>
        <Link href={ask(fmt(sc.askPrompt, { name: s.name }))} className="btn btn-ghost pressable min-h-12 flex-1 text-base sm:flex-none">
          <Icon name="mic" size={19} />
          {sc.askAbout}
        </Link>
      </div>

      {sections.length > 1 && <SectionNav sections={sections} label={sc.details} />}

      {sc.englishNote && (
        <p className="flex items-start gap-2.5 rounded-2xl bg-surface-2 p-3.5 text-sm leading-relaxed text-muted">
          <Icon name="info" size={18} className="mt-0.5 flex-none" />
          {sc.englishNote}
        </p>
      )}

      {s.details && (
        <Section id="about" icon="info" title={sc.details}>
          <div className="flex flex-col gap-2.5">
            {toLines(s.details).map((line, i) =>
              isSubheading(line) ? (
                <p key={i} className="eyebrow pt-1">{line}</p>
              ) : (
                <p key={i} className="text-pretty">{line}</p>
              ),
            )}
          </div>
        </Section>
      )}

      {s.benefits && (
        <Section id="benefits" icon="rupee" title={sc.benefits}>
          <Bullets lines={toLines(s.benefits)} />
        </Section>
      )}

      {s.eligibility && (
        <Section id="eligibility" icon="users" title={sc.eligibility}>
          <Bullets lines={toLines(s.eligibility)} />
          {s.exclusions && (
            <details className="group mt-4 rounded-2xl border border-border bg-surface-2/60">
              <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 font-semibold">
                <span className="flex items-center gap-2">
                  <Icon name="x" size={18} className="text-danger" />
                  {sc.exclusions}
                </span>
                <Icon name="chevronDown" size={20} className="faq-chevron text-muted transition-transform duration-300" />
              </summary>
              <div className="faq-body px-4 pb-4">
                <Bullets lines={toLines(s.exclusions)} />
              </div>
            </details>
          )}
        </Section>
      )}

      {docs.length > 0 && (
        <Section id="documents" icon="file" title={sc.documents}>
          <DocChecklist slug={slug} lines={docs} t={sc} />
        </Section>
      )}

      {s.applicationProcess && (
        <Section id="apply" icon="arrowRight" title={sc.applicationProcess}>
          {steps.intro.length > 0 && (
            <div className="mb-3 flex flex-col gap-1.5">
              {steps.intro.map((l, i) => (
                <p key={i} className={i === 0 && steps.steps.length ? "font-semibold" : ""}>
                  {l}
                </p>
              ))}
            </div>
          )}
          {steps.steps.length > 0 && (
            <ol className="relative flex flex-col gap-4 pl-1">
              {steps.steps.map((step, i) => (
                <li key={i} className="relative flex gap-3.5">
                  {i < steps.steps.length - 1 && <span aria-hidden className="absolute bottom-[-1rem] left-[0.94rem] top-9 w-0.5 bg-border" />}
                  <span className="relative grid size-8 flex-none place-items-center rounded-full bg-brand text-sm font-bold text-brand-ink">{i + 1}</span>
                  <p className="pt-0.5 text-pretty">{step}</p>
                </li>
              ))}
            </ol>
          )}
        </Section>
      )}

      <section className="card flex flex-col gap-3 border-brand/25 bg-brand-soft p-5">
        <h2 className="flex items-center gap-2.5 text-lg font-bold">
          <Icon name="mapPin" size={22} className="text-brand" />
          {sc.whereToApply}
        </h2>
        <p className="text-[0.98rem] leading-relaxed">{sc.cscBody}</p>
        <div className="flex flex-wrap gap-2">
          <a href={CSC_LOCATOR} target="_blank" rel="noopener noreferrer" className="btn btn-primary pressable min-h-11 text-base">
            {sc.findCsc}
            <Icon name="external" size={17} />
          </a>
          <a href={s.officialUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost pressable min-h-11 bg-surface text-base">
            {sc.official}
            <Icon name="external" size={17} />
          </a>
        </div>
      </section>

      {faq.length > 0 && (
        <Section id="faq" icon="chat" title={sc.faq}>
          <div className="-mx-1 flex flex-col">
            {faq.slice(0, 12).map((item, i) => (
              <details key={i} className="border-t border-border first:border-t-0">
                <summary className="flex cursor-pointer items-start justify-between gap-3 rounded-xl px-1 py-3 font-semibold">
                  <span className="text-pretty">{item.q}</span>
                  <Icon name="chevronDown" size={20} className="faq-chevron mt-0.5 flex-none text-muted transition-transform duration-300" />
                </summary>
                <p className="faq-body px-1 pb-4 text-pretty text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </Section>
      )}

      {s.sources.length > 0 && (
        <Section id="links" icon="external" title={sc.sources}>
          <ul className="flex flex-col gap-2">
            {s.sources.map((u) => (
              <li key={u}>
                <a href={u} target="_blank" rel="noopener noreferrer" className="break-all text-[0.95rem] font-semibold text-brand underline decoration-brand/30 underline-offset-4">
                  {u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {similar.length > 0 && (
        <section className="flex flex-col gap-3 pt-2">
          <h2 className="font-display text-[1.45rem] font-semibold">{sc.similar}</h2>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {similar.map((x) => (
              <li key={x.slug}>
                <Link href={`/${lang}/schemes/${x.slug}`} className="card pressable lift flex h-full items-center gap-3 p-4">
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-muted">{x.state ? stateLabel(x.state, lang) : sc.central}</span>
                    <span className="mt-0.5 line-clamp-2 font-bold leading-snug">{localName(x.slug, lang) ?? x.name}</span>
                  </span>
                  <Icon name="chevronRight" size={20} className="flex-none text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

function Section({ id, icon, title, children }: { id: string; icon: IconName; title: string; children: ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-32 p-5">
      <h2 className="mb-3 flex items-center gap-2.5 text-[1.2rem] font-bold">
        <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand">
          <Icon name={icon} size={19} />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Bullets({ lines }: { lines: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-3 text-pretty">
          <span aria-hidden className="mt-[0.7rem] size-1.5 flex-none rounded-full bg-accent" />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}
