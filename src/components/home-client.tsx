"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fmt, type Dictionary, type Locale } from "@/lib/i18n";
import { activeMember, hasAnswers, memberLabel, useFamily, useSaved } from "@/lib/storage";
import type { Profile } from "@/lib/types";
import { Icon } from "./icons";
import { MicButton, SoundWave, useVoiceInput } from "./voice";

/** The big mic on the home screen: speak, and we open the answer in chat. */
export function HomeVoice({ lang, t }: { lang: Locale; t: Dictionary }) {
  const router = useRouter();
  const [heard, setHeard] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const voice = useVoiceInput({
    lang,
    onInterim: setHeard,
    onFinal: (text) => router.push(`/${lang}/chat?${new URLSearchParams({ q: text })}`),
    onUnsupported: () => setNotice(t.chat.noVoice),
  });

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <MicButton
        size="xl"
        listening={voice.listening}
        busy={voice.busy}
        onClick={() => {
          setNotice(null);
          setHeard("");
          voice.toggle();
        }}
        labels={{ start: t.home.tapToSpeak, stop: t.chat.micStop, listening: t.chat.listening }}
      />
      <div className="min-h-[3.25rem]" aria-live="polite">
        {voice.listening ? (
          <div className="fade-in flex flex-col items-center gap-1">
            <SoundWave className="text-accent" />
            <p className="max-w-xs text-base font-semibold text-hero-ink">{heard || t.chat.listening}</p>
          </div>
        ) : notice ? (
          <p className="fade-in max-w-xs text-sm text-hero-ink/80">{notice}</p>
        ) : (
          <>
            <p className="text-lg font-bold text-hero-ink">{t.home.tapToSpeak}</p>
            <p className="text-sm text-hero-ink/70">{t.home.speakHint}</p>
          </>
        )}
      </div>
    </div>
  );
}

type Summary = { counts: { eligible: number; maybe: number; general: number }; top: { slug: string; name: string }[] };

/** Returning visitors see their own count; first-timers get the invitation to answer 9 questions. */
export function HomeProfile({ lang, t }: { lang: Locale; t: Dictionary }) {
  const family = useFamily();
  const member = activeMember(family);
  const profile = member.profile;
  const ready = hasAnswers(profile);
  const key = JSON.stringify(profile);
  const [summary, setSummary] = useState<{ key: string; data: Summary } | null>(null);

  useEffect(() => {
    if (!ready) return;
    const ctrl = new AbortController();
    fetch("/api/eligibility?summary=1", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: key,
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? (r.json() as Promise<Summary>) : null))
      .then((data) => data && setSummary({ key, data }))
      .catch(() => {});
    return () => ctrl.abort();
  }, [key, ready]);

  if (!ready) {
    return (
      <Link
        href={`/${lang}/find`}
        className="enter card pressable lift group relative flex items-center gap-4 overflow-hidden p-5"
        style={{ "--i": 1 } as React.CSSProperties}
      >
        <span className="grid size-14 flex-none place-items-center rounded-2xl bg-accent-soft text-accent">
          <Icon name="list" size={28} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[1.35rem] font-semibold leading-tight">{t.home.findTitle}</span>
          <span className="mt-1 block text-base text-muted">{t.home.findBody}</span>
        </span>
        <span aria-label={t.home.start} className="grid size-12 flex-none place-items-center rounded-full bg-brand text-brand-ink">
          <Icon name="arrowRight" size={22} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </Link>
    );
  }

  const data = summary?.key === key ? summary.data : null;
  return (
    <Link
      href={`/${lang}/find`}
      className="enter card pressable lift group flex flex-col gap-3 p-5"
      style={{ "--i": 1 } as React.CSSProperties}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="eyebrow">
          {t.home.welcomeBack} · {memberLabel(member, family.members, t.relations)}
        </span>
        <Icon name="arrowRight" size={20} className="text-brand transition-transform duration-300 group-hover:translate-x-0.5" />
      </span>
      {data ? (
        <span className="fade-in flex items-end gap-3">
          <span className="font-display text-5xl font-semibold leading-none text-brand tabular-nums">{data.counts.eligible}</span>
          <span className="pb-1 leading-tight">
            <span className="block font-bold">{fmt(t.home.eligibleCount, { n: "" }).trim()}</span>
            {data.counts.maybe > 0 && <span className="block text-sm text-muted">{fmt(t.home.maybeCount, { n: data.counts.maybe })}</span>}
          </span>
        </span>
      ) : (
        <span className="flex items-end gap-3">
          <span className="skeleton h-12 w-16" />
          <span className="skeleton h-5 w-40" />
        </span>
      )}
      {data && data.top.length > 0 && (
        <span className="flex flex-col gap-1.5 border-t border-border pt-3">
          {data.top.map((s) => (
            <span key={s.slug} className="flex items-center gap-2 text-[0.95rem]">
              <Icon name="check" size={16} strokeWidth={2.5} className="flex-none text-green" />
              <span className="truncate">{s.name}</span>
            </span>
          ))}
        </span>
      )}
      <ProfileChips profile={profile} t={t} />
    </Link>
  );
}

function ProfileChips({ profile, t }: { profile: Profile; t: Dictionary }) {
  const bits = [
    profile.age !== undefined && `${profile.age} ${t.common.years}`,
    profile.gender && t.options.gender[profile.gender],
    profile.occupation?.length && t.options.occupation[profile.occupation[0]],
    profile.area && t.options.area[profile.area].split(" (")[0],
  ].filter(Boolean) as string[];
  if (!bits.length) return null;
  return (
    <span className="flex flex-wrap gap-1.5">
      {bits.map((b) => (
        <span key={b} className="chip bg-surface-2 text-muted">
          {b}
        </span>
      ))}
    </span>
  );
}

export function SavedStrip({ lang, t }: { lang: Locale; t: Dictionary }) {
  const saved = useSaved();
  if (!saved.length) return null;
  return (
    <section className="fade-in flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-[1.45rem] font-semibold">{t.home.saved}</h2>
        <Link href={`/${lang}/saved`} className="text-sm font-bold text-brand">
          {t.common.seeAll} ({saved.length})
        </Link>
      </div>
      <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
        {saved.slice(0, 8).map((s) => (
          <li key={s.slug} className="snap-start">
            <Link
              href={`/${lang}/schemes/${s.slug}`}
              className="card pressable lift flex h-full w-56 items-start gap-2.5 p-3.5 text-[0.95rem] font-semibold leading-snug"
            >
              <Icon name="bookmark" size={18} fill="currentColor" className="mt-0.5 flex-none text-accent" />
              <span className="line-clamp-3">{s.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
