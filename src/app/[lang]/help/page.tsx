import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClearData, InstallCard } from "@/components/help-client";
import { Icon } from "@/components/icons";
import { SectionHead } from "@/components/section-head";
import { CSC_LOCATOR, CYBER_PORTAL, HELPLINES } from "@/lib/helplines";
import { getDictionary, hasLocale, numeral } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/help">): Promise<Metadata> {
  const { lang } = await params;
  return { title: getDictionary(hasLocale(lang) ? lang : "hi").help.title };
}

export default async function HelpPage({ params }: PageProps<"/[lang]/help">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const h = t.help;

  return (
    <div className="flex flex-col gap-10">
      <header className="enter">
        <h1 className="font-display text-[2.4rem] leading-tight">{h.title}</h1>
        <p className="mt-1 text-muted">{h.intro}</p>
      </header>

      {/* Set like a printed phone directory: name and use on the left, the number big on the right. */}
      <ul className="enter -mt-4 border-t-[3px] border-ink" style={{ "--i": 1 } as React.CSSProperties}>
        {HELPLINES.map((line) => (
          <li key={line.number}>
            <a href={`tel:${line.number.replace(/-/g, "")}`} className="group flex items-center gap-3 border-b border-rule py-3.5">
              <span className="min-w-0 flex-1">
                <span className="block font-bold leading-snug">{line.label[lang]}</span>
                <span className="block text-sm leading-snug text-muted">{line.note[lang]}</span>
              </span>
              <span className="flex flex-none items-center gap-2.5">
                <span className="font-display text-[1.45rem] leading-none tabular-nums group-hover:text-accent">{line.number}</span>
                <span className="grid size-10 place-items-center rounded-full bg-accent text-paper transition-transform duration-300 group-active:scale-90">
                  <Icon name="phone" size={18} />
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <InstallCard t={h} />

      <aside className="notice flex flex-col gap-3">
        <p className="font-display text-2xl leading-tight">{h.cscTitle}</p>
        <p className="leading-relaxed">{h.cscBody}</p>
        <a href={CSC_LOCATOR} target="_blank" rel="noopener noreferrer" className="btn btn-ink pressable self-start">
          <Icon name="mapPin" size={18} />
          {t.scheme.findCsc}
        </a>
      </aside>

      <section className="flex flex-col gap-3">
        <SectionHead n={numeral(1, lang)} title={h.safetyTitle} />
        <ol>
          {h.tips.map((tip, i) => (
            <li key={i} className="flex gap-4 border-b border-rule py-3">
              <span className="w-6 flex-none font-display text-2xl leading-none text-accent">{numeral(i + 1, lang, 1)}</span>
              <span className="leading-relaxed">{tip}</span>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          <a href="tel:1930" className="btn btn-accent pressable">
            <Icon name="phone" size={18} />
            1930
          </a>
          <a href={CYBER_PORTAL} target="_blank" rel="noopener noreferrer" className="btn btn-line pressable">
            cybercrime.gov.in
            <Icon name="external" size={16} />
          </a>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHead n={numeral(2, lang)} title={h.howTitle} />
        <ol>
          {h.how.map((step, i) => (
            <li key={i} className="flex gap-4 border-b border-rule py-3">
              <span className="w-6 flex-none font-display text-2xl leading-none text-accent">{numeral(i + 1, lang, 1)}</span>
              <span>
                <span className="block font-bold">{step.title}</span>
                <span className="block leading-relaxed text-muted">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${lang}/chat`} className="btn btn-ink pressable">
            <Icon name="mic" size={18} />
            {t.nav.chat}
          </Link>
          <Link href={`/${lang}/saved`} className="btn btn-line pressable">
            <Icon name="bookmark" size={18} />
            {t.saved.title}
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHead n={numeral(3, lang)} title={h.privacyTitle} />
        <p className="leading-relaxed text-muted">{h.privacyBody}</p>
        <ClearData t={h} />
      </section>
    </div>
  );
}
