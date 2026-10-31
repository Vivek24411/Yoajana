"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fmt, type Dictionary, type Locale } from "@/lib/i18n";
import { localName } from "@/lib/popular";
import { activeMember, hasAnswers, memberLabel, useFamily, useSaved } from "@/lib/storage";
import { Icon } from "./icons";
import { MicButton, SoundWave, useVoiceInput } from "./voice";

/** The mic on the home screen: speak, and the answer opens in chat. */
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
    <div className="flex items-center gap-4">
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
      <div className="min-w-0 flex-1" aria-live="polite">
        {voice.listening ? (
          <div className="fade-in flex flex-col gap-1 text-accent">
            <SoundWave />
            <p className="font-bold leading-snug text-ink">{heard || t.chat.listening}</p>
          </div>
        ) : notice ? (
          <p className="fade-in text-[0.95rem] leading-snug text-muted">{notice}</p>
        ) : (
          <>
            <p className="text-xl font-bold leading-tight">{t.home.tapToSpeak}</p>
            <p className="mt-0.5 text-[0.95rem] leading-snug text-muted">{t.home.speakHint}</p>
          </>
        )}
      </div>
    </div>
  );
}

type Summary = { counts: { eligible: number; maybe: number; general: number }; top: { slug: string; name: string }[] };

/** Returning visitors see their own count, stamped; first-timers get the invitation to answer 9 questions. */
export function HomeProfile({ lang, t }: { lang: Locale; t: Dictionary }) {
  const family = useFamily();
  const saved = useSaved();
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

  const data = summary?.key === key ? summary.data : null;

  return (
    <div className="flex flex-col">
      {!ready ? (
        <Link href={`/${lang}/find`} className="group flex items-center gap-4 border-b border-rule py-5">
          <span className="min-w-0 flex-1">
            <span className="block text-[1.3rem] font-bold leading-tight">{t.home.findTitle}</span>
            <span className="mt-1 block text-muted">{t.home.findBody}</span>
          </span>
          <span className="btn btn-ink pressable">
            {t.home.start}
            <Icon name="arrowRight" size={18} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </Link>
      ) : (
        <Link href={`/${lang}/find`} className="group block border-b border-rule py-5">
          <span className="text-sm font-bold text-muted">{memberLabel(member, family.members, t.relations)}</span>
          <span className="mt-1 flex items-end gap-4">
            {data ? (
              <span className="fade-in font-display text-[4.25rem] leading-[0.85] tabular-nums">{data.counts.eligible}</span>
            ) : (
              <span className="skeleton h-14 w-20" />
            )}
            <span className="min-w-0 flex-1 pb-1 leading-tight">
              <span className="block font-bold">{fmt(t.home.eligibleCount, { n: "" }).trim()}</span>
              {data && data.counts.maybe > 0 && <span className="block text-sm text-muted">{fmt(t.home.maybeCount, { n: data.counts.maybe })}</span>}
            </span>
            {data && data.counts.eligible > 0 && <span className="stamp stamp-in mb-2">{t.stamp.eligible}</span>}
          </span>
          {data && data.top.length > 0 && (
            <span className="mt-4 flex flex-col">
              {data.top.map((s) => (
                <span key={s.slug} className="flex gap-2.5 border-t border-dotted border-rule py-2 text-[0.98rem]">
                  <span className="text-accent">—</span>
                  <span className="truncate">{localName(s.slug, lang) ?? s.name}</span>
                </span>
              ))}
            </span>
          )}
          <span className="mt-2 inline-flex items-center gap-1.5 font-bold text-accent">
            {t.common.seeAll}
            <Icon name="arrowRight" size={17} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </Link>
      )}
      {saved.length > 0 && (
        <Link href={`/${lang}/saved`} className="group flex items-center gap-3 border-b border-rule py-4 font-bold">
          <Icon name="bookmark" size={20} fill="currentColor" className="text-accent" />
          <span className="flex-1">{t.saved.title}</span>
          <span className="font-display text-xl tabular-nums">{saved.length}</span>
          <Icon name="chevronRight" size={20} className="text-muted transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
