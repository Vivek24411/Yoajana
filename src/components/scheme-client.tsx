"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { evaluateRule } from "@/lib/eligibility";
import { fmt, type Dictionary, type Locale } from "@/lib/i18n";
import { describeRule } from "@/lib/rules-text";
import { activeMember, hasAnswers, memberLabel, toggleDoc, useDocs, useFamily } from "@/lib/storage";
import type { Rule } from "@/lib/types";
import { Icon, type IconName } from "./icons";
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
      className={`pressable inline-flex items-center gap-2 rounded-full border border-border-strong px-3.5 py-2 text-sm font-semibold hover:bg-surface-2 ${className}`}
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
  slug: string;
  name: string;
  displayName: string;
  state: string | null;
  speakText: string;
  lang: Locale;
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
const VERDICT_STYLE: Record<Verdict, { icon: IconName; box: string; badge: string }> = {
  eligible: { icon: "check", box: "border-green/40 bg-green-soft", badge: "bg-green text-bg" },
  maybe: { icon: "info", box: "border-amber/40 bg-amber-soft", badge: "bg-amber text-bg" },
  ineligible: { icon: "x", box: "border-danger/30 bg-danger-soft", badge: "bg-danger text-bg" },
};

/**
 * "Can I get this?" for one scheme, using the answers saved on this phone.
 * The same deterministic rules as the finder; every condition is spelled out.
 */
export function MyEligibility({ lang, rules, t }: { lang: Locale; rules: Rule[]; t: Dictionary }) {
  const family = useFamily();
  const member = activeMember(family);
  const profile = member.profile;
  const known = hasAnswers(profile);
  // State is already shown at the top; list the rules people can act on.
  const shown = rules.filter((r) => r.field !== "state");

  if (!known) {
    return (
      <section className="card flex flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-11 flex-none place-items-center rounded-2xl bg-accent-soft text-accent">
            <Icon name="list" size={24} />
          </span>
          <h2 className="text-lg font-bold leading-snug">{t.scheme.you.unknown}</h2>
        </div>
        {shown.length > 0 && <RuleList rules={shown} t={t} lang={lang} />}
        <Link href={`/${lang}/find`} className="btn btn-primary pressable w-full sm:w-auto sm:self-start">
          {t.scheme.you.checkCta}
          <Icon name="arrowRight" size={18} />
        </Link>
      </section>
    );
  }

  const outcomes = rules.map((r) => ({ rule: r, outcome: evaluateRule(r, profile) }));
  const verdict: Verdict = outcomes.some((o) => o.outcome === "fail")
    ? "ineligible"
    : outcomes.some((o) => o.outcome === "unknown")
      ? "maybe"
      : "eligible";
  const style = VERDICT_STYLE[verdict];
  const who = memberLabel(member, family.members, t.relations);

  return (
    <section className={`card flex flex-col gap-4 border p-5 ${style.box}`}>
      <div className="flex items-start gap-3">
        <span className={`pop grid size-11 flex-none place-items-center rounded-full ${style.badge}`}>
          <Icon name={style.icon} size={24} strokeWidth={2.4} />
        </span>
        <div>
          <h2 className="text-lg font-bold leading-snug">{t.scheme.you[verdict]}</h2>
          <p className="text-sm text-muted">{fmt(t.scheme.you.basedOn, { who })}</p>
        </div>
      </div>
      {outcomes.filter((o) => o.rule.field !== "state").length > 0 && (
        <ul className="flex flex-col gap-2 border-t border-text/10 pt-4">
          {outcomes
            .filter((o) => o.rule.field !== "state")
            .map(({ rule, outcome }, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[0.98rem]">
                <span
                  className={`mt-0.5 grid size-6 flex-none place-items-center rounded-full ${
                    outcome === "pass" ? "bg-green text-bg" : outcome === "fail" ? "bg-danger text-bg" : "border-2 border-dashed border-amber text-amber"
                  }`}
                >
                  <Icon name={outcome === "pass" ? "check" : outcome === "fail" ? "x" : "dots"} size={14} strokeWidth={3} />
                </span>
                <span>
                  {describeRule(rule, t, lang)}
                  {outcome === "unknown" && <span className="ml-1.5 text-sm font-semibold text-amber">· {t.scheme.you.missing}</span>}
                </span>
              </li>
            ))}
        </ul>
      )}
      <Link href={`/${lang}/find`} className="inline-flex items-center gap-1.5 self-start text-sm font-bold text-brand">
        <Icon name="pencil" size={16} />
        {t.scheme.you.update}
      </Link>
    </section>
  );
}

function RuleList({ rules, t, lang }: { rules: Rule[]; t: Dictionary; lang: Locale }) {
  return (
    <div>
      <p className="eyebrow mb-2">{t.scheme.rulesTitle}</p>
      <ul className="flex flex-col gap-1.5">
        {rules.map((r, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[0.98rem]">
            <span className="mt-[0.6rem] size-1.5 flex-none rounded-full bg-accent" />
            {describeRule(r, t, lang)}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Documents as a checklist the person ticks off at home before going to the CSC. */
export function DocChecklist({ slug, lines, t }: { slug: string; lines: string[]; t: Dictionary["scheme"] }) {
  const have = new Set(useDocs()[slug] ?? []);
  const done = lines.filter((_, i) => have.has(i)).length;
  const pct = lines.length ? done / lines.length : 0;
  const C = 2 * Math.PI * 16;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
        <svg width="44" height="44" viewBox="0 0 40 40" className="flex-none -rotate-90" aria-hidden>
          <circle cx="20" cy="20" r="16" fill="none" stroke="var(--border-strong)" strokeWidth="4" />
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="var(--green)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            style={{ transition: "stroke-dashoffset 500ms var(--ease-out)" }}
          />
        </svg>
        <div className="leading-tight">
          <p className="font-bold tabular-nums">{fmt(t.docsReady, { a: done, b: lines.length })}</p>
          <p className="text-sm text-muted">{t.docsHint}</p>
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {lines.map((line, i) => {
          const on = have.has(i);
          return (
            <li key={i}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggleDoc(slug, i)}
                className="pressable flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left hover:bg-surface-2"
              >
                <span
                  className={`mt-0.5 grid size-6 flex-none place-items-center rounded-md border-2 transition-colors duration-200 ${
                    on ? "border-green bg-green text-bg" : "border-border-strong"
                  }`}
                >
                  {on && <Icon name="check" size={15} strokeWidth={3} className="check-draw" />}
                </span>
                <span className={`text-pretty transition-colors ${on ? "text-muted line-through decoration-muted/50" : ""}`}>{line}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Sticky in-page tabs that follow the reader down the page. */
export function SectionNav({ sections, label }: { sections: { id: string; label: string }[]; label: string }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      { rootMargin: "-90px 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  useEffect(() => {
    document.getElementById(`nav-${active}`)?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active]);

  return (
    <nav aria-label={label} className="sticky top-16 z-20 -mx-4 border-b border-border/70 bg-bg/85 backdrop-blur-xl">
      <ul className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 py-2.5">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              id={`nav-${s.id}`}
              href={`#${s.id}`}
              aria-current={active === s.id ? "true" : undefined}
              className={`pressable chip h-9 whitespace-nowrap px-3.5 text-[0.88rem] ${
                active === s.id ? "bg-text text-bg" : "text-muted hover:bg-surface-2"
              }`}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
