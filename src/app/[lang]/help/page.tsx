import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClearData, InstallCard } from "@/components/help-client";
import { Icon } from "@/components/icons";
import { CSC_LOCATOR, CYBER_PORTAL, HELPLINES } from "@/lib/helplines";
import { getDictionary, hasLocale } from "@/lib/i18n";

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
    <div className="flex flex-col gap-8">
      <header className="enter">
        <h1 className="font-display text-[2rem] font-semibold leading-tight">{h.title}</h1>
        <p className="mt-1 text-muted">{h.intro}</p>
      </header>

      <ul className="grid gap-2.5 sm:grid-cols-2">
        {HELPLINES.map((line, i) => (
          <li key={line.number} className="enter" style={{ "--i": i } as React.CSSProperties}>
            <a href={`tel:${line.number.replace(/-/g, "")}`} className="card pressable lift group flex items-center gap-3.5 p-4">
              <span className="grid size-12 flex-none place-items-center rounded-2xl bg-brand-soft text-brand">
                <Icon name={line.icon} size={24} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold leading-snug">{line.label[lang]}</span>
                <span className="block text-sm leading-snug text-muted">{line.note[lang]}</span>
              </span>
              <span className="flex flex-none flex-col items-center gap-0.5">
                <span className="grid size-11 place-items-center rounded-full bg-brand text-brand-ink transition-transform duration-300 group-hover:scale-105">
                  <Icon name="phone" size={19} />
                </span>
                <span className="font-display text-[0.95rem] font-semibold tabular-nums">{line.number}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <InstallCard t={h} />

      <section className="card flex flex-col gap-3 border-brand/25 bg-brand-soft p-5">
        <h2 className="flex items-center gap-2.5 text-lg font-bold">
          <Icon name="mapPin" size={22} className="text-brand" />
          {h.cscTitle}
        </h2>
        <p className="leading-relaxed">{h.cscBody}</p>
        <a href={CSC_LOCATOR} target="_blank" rel="noopener noreferrer" className="btn btn-primary pressable self-start">
          {t.scheme.findCsc}
          <Icon name="external" size={17} />
        </a>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-[1.45rem] font-semibold">{h.safetyTitle}</h2>
        <ol className="card flex flex-col divide-y divide-border">
          {h.tips.map((tip, i) => (
            <li key={i} className="flex gap-3.5 p-4">
              <span className="grid size-8 flex-none place-items-center rounded-full bg-amber-soft font-bold text-amber">{i + 1}</span>
              <span className="pt-0.5 leading-relaxed">{tip}</span>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          <a href="tel:1930" className="btn btn-accent pressable">
            <Icon name="phone" size={18} />
            1930
          </a>
          <a href={CYBER_PORTAL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost pressable">
            cybercrime.gov.in
            <Icon name="external" size={17} />
          </a>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-[1.45rem] font-semibold">{h.howTitle}</h2>
        <ol className="grid gap-2.5 sm:grid-cols-3">
          {h.how.map((step, i) => (
            <li key={i} className="card flex flex-col gap-2 p-4">
              <span className="font-display text-3xl font-semibold text-accent">{i + 1}</span>
              <span className="font-bold">{step.title}</span>
              <span className="text-[0.95rem] leading-relaxed text-muted">{step.body}</span>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${lang}/chat`} className="btn btn-primary pressable">
            <Icon name="mic" size={18} />
            {t.nav.chat}
          </Link>
          <Link href={`/${lang}/saved`} className="btn btn-ghost pressable">
            <Icon name="bookmark" size={18} />
            {t.saved.title}
          </Link>
        </div>
      </section>

      <section className="card flex flex-col gap-3 p-5">
        <h2 className="flex items-center gap-2.5 text-lg font-bold">
          <Icon name="shield" size={22} className="text-brand" />
          {h.privacyTitle}
        </h2>
        <p className="leading-relaxed text-muted">{h.privacyBody}</p>
        <ClearData t={h} />
      </section>
    </div>
  );
}
