"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { evaluateRule } from "@/lib/eligibility";
import { fmt, type Dictionary, type Locale } from "@/lib/i18n";
import { describeRule } from "@/lib/rules-text";
import { activeMember, hasAnswers, memberLabel, toggleDoc, useDocs, useFamily } from "@/lib/storage";
import type { Rule } from "@/lib/types";
import { Icon } from "./icons";
import { SaveButton } from "./save-button";
import { SpeakButton } from "./voice";

/** Share through the phone's own sheet (WhatsApp is usually first); fall back to a WhatsApp link. */
export function ShareButton({ title, text, label, className = "" }: { title: string; text: string; label: string; className?: string }) {
  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, "_blank", "noopener");
  }
  return (
    <button
      type="button"
      onClick={share}
      className={`pressable inline-flex h-10 items-center gap-2 rounded-md border-[1.5px] border-ink px-3 text-[0.95rem] font-bold hover:bg-paper-2 ${className}`}
    >
      <Icon name="share" size={18} />
      {label}
    </button>
  );
}

export function SchemeActions({
  lang,
  slug,
  name,
  displayName,
  state,
  speakText,
  t,
}: {
  lang: Locale;
  slug: string;
  name: string;
  displayName: string;
  state: string | null;
  speakText: string;
  t: Pick<Dictionary, "scheme" | "chat">;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <SpeakButton id={`scheme-${slug}`} text={speakText} labels={{ listen: t.chat.listen, stop: t.chat.stopListen }} />
      <SaveButton variant="pill" slug={slug} name={name} state={state} href={`/${lang}/schemes/${slug}`} labels={t.scheme} />
      <ShareButton title={displayName} text={`${t.scheme.shareText} ${displayName}`} label={t.scheme.share} />
    </div>
  );
}

type Verdict = "eligible" | "maybe" | "ineligible";
const STAMP_COLOR: Record<Verdict, string> = { eligible: "text-stamp", maybe: "text-ochre", ineligible: "text-accent" };

/**
 * "Can I get this?" for one scheme, using the answers saved on this phone.
 * The same deterministic rules as the finder; every condition is spelled out.
 */
export function MyEligibility({ lang, rules, t }: { lang: Locale; rules: Rule[]; t: Dictionary }) {
  const family = useFamily();
  const member = activeMember(family);
  const profile = member.profile;
  // State is already shown at the top; list the rules people can act on.
  const shown = rules.filter((r) => r.field !== "state");

  if (!hasAnswers(profile)) {
    return (
      <section className="border-2 border-ink p-5">
        <h2 className="font-display text-[1.6rem] leading-tight">{t.scheme.you.unknown}</h2>
        {shown.length > 0 && (
          <div className="mt-4">
            <p className="kicker mb-1">{t.scheme.rulesTitle}</p>
            <ul>
              {shown.map((r, i) => (
                <li key={i} className="flex gap-3 border-b border-dotted border-rule py-2 last:border-b-0">
                  <span aria-hidden className="text-accent">—</span>
                  {describeRule(r, t, lang)}
                </li>
              ))}
            </ul>
          </div>
        )}
        <Link href={`/${lang}/find`} className="btn btn-ink pressable mt-4 w-full sm:w-auto">
          {t.scheme.you.checkCta}
          <Icon name="arrowRight" size={18} />
        </Link>
      </section>
    );
  }

  const all = rules.map((r) => ({ rule: r, outcome: evaluateRule(r, profile) }));
  const verdict: Verdict = all.some((o) => o.outcome === "fail")
    ? "ineligible"
    : all.some((o) => o.outcome === "unknown")
      ? "maybe"
      : "eligible";
  // The state line only earns a row when it is the reason something fails or is missing.
  const outcomes = all.filter((o) => o.rule.field !== "state" || o.outcome !== "pass");
  const who = memberLabel(member, family.members, t.relations);

  return (
    <section className="relative border-2 border-ink p-5">
      <span key={verdict} className={`stamp stamp-in absolute -top-4 right-4 bg-paper ${STAMP_COLOR[verdict]}`}>
        {t.stamp[verdict]}
      </span>
      <h2 className="pr-24 font-display text-[1.6rem] leading-tight">{t.scheme.you[verdict]}</h2>
      <p className="mt-1 text-sm text-muted">{member.relation === "self" ? t.scheme.you.basedOnSelf : fmt(t.scheme.you.basedOn, { who })}</p>
      {outcomes.length > 0 && (
        <ul className="mt-4 border-t border-rule">
          {outcomes.map(({ rule, outcome }, i) => (
            <li key={i} className="flex items-start gap-3 border-b border-dotted border-rule py-2.5 last:border-b-0">
              <span
                className={`mt-0.5 grid size-6 flex-none place-items-center ${
                  outcome === "pass" ? "text-stamp" : outcome === "fail" ? "text-accent" : "text-ochre"
                }`}
                aria-label={outcome === "pass" ? "✓" : outcome === "fail" ? t.scheme.you.fail : t.scheme.you.missing}
              >
                <Icon name={outcome === "pass" ? "check" : outcome === "fail" ? "x" : "dots"} size={20} strokeWidth={3} />
              </span>
              <span className={outcome === "fail" ? "line-through decoration-accent/60" : ""}>
                {describeRule(rule, t, lang)}
                {outcome === "unknown" && <span className="ml-2 text-sm font-bold text-ochre">{t.scheme.you.missing}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link href={`/${lang}/find`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold underline decoration-accent decoration-2 underline-offset-4">
        <Icon name="pencil" size={15} />
        {t.scheme.you.update}
      </Link>
    </section>
  );
}

/** Documents as a printed checklist the person ticks at home before going to the CSC. */
export function DocChecklist({ slug, lines, t }: { slug: string; lines: string[]; t: Dictionary["scheme"] }) {
  const have = new Set(useDocs()[slug] ?? []);
  const done = lines.filter((_, i) => have.has(i)).length;

  return (
    <div className="flex flex-col">
      <div className="mb-1 flex items-baseline justify-between gap-4">
        <p className="text-sm text-muted">{t.docsHint}</p>
        <p className="whitespace-nowrap font-bold tabular-nums">{fmt(t.docsReady, { a: done, b: lines.length })}</p>
      </div>
      <div className="mb-2 h-1 bg-paper-2" aria-hidden>
        <div className="h-full origin-left bg-ink transition-transform duration-500 ease-[var(--ease-out)]" style={{ transform: `scaleX(${lines.length ? done / lines.length : 0})` }} />
      </div>
      <ul>
        {lines.map((line, i) => {
          const on = have.has(i);
          return (
            <li key={i}>
              <button type="button" role="checkbox" aria-checked={on} onClick={() => toggleDoc(slug, i)} className="choice items-start">
                <span className="box mt-0.5">{on && <Icon name="check" size={15} strokeWidth={3} className="check-draw" />}</span>
                <span className={`font-semibold text-pretty transition-colors ${on ? "text-muted line-through decoration-ink/40" : ""}`}>{line}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Sticky in-page contents that follow the reader down the page. */
export function SectionNav({ sections, label }: { sections: { id: string; label: string }[]; label: string }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      { rootMargin: "-100px 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  useEffect(() => {
    document.getElementById(`nav-${active}`)?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active]);

  return (
    <nav aria-label={label} className="sticky top-[4.35rem] z-20 -mx-4 border-b border-rule bg-paper/95 backdrop-blur-md">
      <ul className="no-scrollbar flex gap-6 overflow-x-auto px-4">
        {sections.map((s) => (
          <li key={s.id}>
            <a id={`nav-${s.id}`} href={`#${s.id}`} aria-current={active === s.id ? "true" : undefined} className="tab block py-3 text-[0.92rem]">
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
