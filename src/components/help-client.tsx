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
    <section className="card enter flex items-center gap-4 p-5">
      <span className="grid size-12 flex-none place-items-center rounded-2xl bg-accent-soft text-accent">
        <Icon name="download" size={24} />
      </span>
      <div className="flex-1">
        <h2 className="font-bold">{t.installTitle}</h2>
        <p className="text-sm text-muted">{t.installBody}</p>
      </div>
      <button type="button" onClick={install} className="btn btn-primary pressable min-h-11 text-base">
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
      className="btn btn-ghost pressable min-h-11 self-start border-danger/40 text-base text-danger"
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
      <div className="enter card flex flex-col items-center gap-4 px-6 py-12 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-accent-soft text-accent">
          <Icon name="bookmark" size={30} />
        </span>
        <p className="max-w-sm text-muted">{t.saved.empty}</p>
        <Link href={`/${lang}/schemes`} className="btn btn-primary pressable">
          {t.saved.browse}
          <Icon name="arrowRight" size={18} />
        </Link>
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {saved.map((s, i) => {
        const ready = docs[s.slug]?.length ?? 0;
        const href = `/${lang}/schemes/${s.slug}`;
        return (
          <li key={s.slug} className="enter card pressable lift relative" style={{ "--i": i } as React.CSSProperties}>
            <Link href={href} className="flex flex-col gap-1 p-4 pr-14 after:absolute after:inset-0 after:rounded-[inherit] after:content-['']">
              <span className="text-[0.8rem] font-semibold text-muted">{s.state ? stateLabel(s.state, lang) : t.scheme.central}</span>
              {localName(s.slug, lang) && <span className="font-bold leading-snug text-brand">{localName(s.slug, lang)}</span>}
              <span className="font-bold leading-snug">{s.name}</span>
              {ready > 0 && (
                <span className="chip mt-1 self-start bg-green-soft text-green">
                  <Icon name="file" size={13} />
                  {ready} {t.saved.docs}
                </span>
              )}
            </Link>
            <SaveButton slug={s.slug} name={s.name} state={s.state} href={href} labels={t.scheme} className="absolute right-2 top-2 z-10" />
          </li>
        );
      })}
    </ul>
  );
}
