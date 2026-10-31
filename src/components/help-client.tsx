"use client";

import Link from "next/link";
import { useState } from "react";
import { stateLabel, type Dictionary, type Locale } from "@/lib/i18n";
import { localName } from "@/lib/popular";
import { docsStore, familyStore, savedStore, useDocs, useSaved } from "@/lib/storage";
import { Icon } from "./icons";
import { useInstallPrompt } from "./pwa";
import { SaveButton } from "./save-button";

export function InstallCard({ t }: { t: Dictionary["help"] }) {
  const { available, install } = useInstallPrompt();
  if (!available) return null;
  return (
    <section className="enter flex items-center gap-4 border-y-2 border-ink py-4">
      <Icon name="download" size={26} className="flex-none text-accent" />
      <div className="flex-1">
        <h2 className="font-bold">{t.installTitle}</h2>
        <p className="text-sm text-muted">{t.installBody}</p>
      </div>
      <button type="button" onClick={install} className="btn btn-ink pressable">
        {t.installBtn}
      </button>
    </section>
  );
}

export function ClearData({ t }: { t: Dictionary["help"] }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        if (!window.confirm(t.confirmClear)) return;
        familyStore.set({ active: "self", members: [{ id: "self", relation: "self", profile: {} }] });
        savedStore.set([]);
        docsStore.set({});
        try {
          localStorage.removeItem("yojana-profile-v1");
          Object.keys(sessionStorage).filter((k) => k.startsWith("yojana-chat")).forEach((k) => sessionStorage.removeItem(k));
        } catch {
          /* ignore */
        }
        setDone(true);
      }}
      className="btn btn-line pressable self-start border-accent text-accent"
    >
      <Icon name={done ? "check" : "trash"} size={18} />
      {done ? t.cleared : t.clearData}
    </button>
  );
}

export function SavedList({ lang, t }: { lang: Locale; t: Dictionary }) {
  const saved = useSaved();
  const docs = useDocs();
  if (!saved.length) {
    return (
      <div className="enter flex flex-col items-start gap-4 border-t-[3px] border-ink pt-5">
        <Icon name="bookmark" size={30} className="text-accent" />
        <p className="max-w-sm text-muted">{t.saved.empty}</p>
        <Link href={`/${lang}/schemes`} className="btn btn-ink pressable">
          {t.saved.browse}
          <Icon name="arrowRight" size={18} />
        </Link>
      </div>
    );
  }
  return (
    <ul className="border-t-[3px] border-ink">
      {saved.map((s, i) => {
        const ready = docs[s.slug]?.length ?? 0;
        const href = `/${lang}/schemes/${s.slug}`;
        const local = localName(s.slug, lang);
        return (
          <li key={s.slug} className="enter group relative border-b border-rule" style={{ "--i": i } as React.CSSProperties}>
            <Link href={href} className="flex flex-col gap-0.5 py-4 pr-12 after:absolute after:inset-0 after:content-['']">
              <span className="text-[0.8rem] font-bold uppercase tracking-wide text-muted">{s.state ? stateLabel(s.state, lang) : t.scheme.central}</span>
              {local && <span className="font-display text-[1.3rem] leading-tight group-hover:text-accent">{local}</span>}
              <span className={local ? "text-[0.95rem] font-semibold text-muted" : "text-[1.1rem] font-bold leading-snug group-hover:text-accent"}>{s.name}</span>
              {ready > 0 && (
                <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-stamp">
                  <Icon name="check" size={14} strokeWidth={3} />
                  {ready} {t.saved.docs}
                </span>
              )}
            </Link>
            <SaveButton slug={s.slug} name={s.name} state={s.state} href={href} labels={t.scheme} className="absolute right-0 top-3 z-10" />
          </li>
        );
      })}
    </ul>
  );
}
