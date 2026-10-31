"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { setPref, usePrefs, type Prefs } from "@/lib/storage";
import { Icon, type IconName } from "./icons";

/** Text size matters more than anything else for older eyes, so it sits one tap away in the header. */
export function SettingsMenu({ t }: { t: Dictionary }) {
  const [open, setOpen] = useState(false);
  const prefs = usePrefs();
  const ref = useRef<HTMLDivElement>(null);
  const s = t.settings;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const sizes: { v: Prefs["size"]; px: string }[] = [
    { v: "md", px: "text-base" },
    { v: "lg", px: "text-xl" },
    { v: "xl", px: "text-2xl" },
  ];
  const themes: { v: Prefs["theme"]; label: string; icon: IconName }[] = [
    { v: "system", label: s.auto, icon: "refresh" },
    { v: "light", label: s.light, icon: "sun" },
    { v: "dark", label: s.dark, icon: "moon" },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={s.open}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="pressable grid size-10 place-items-center rounded hover:bg-paper-2"
      >
        <Icon name="type" size={22} />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={s.open}
          className="sheet-in absolute right-0 top-12 z-40 w-72 border-2 border-ink bg-card p-4 shadow-[6px_6px_0_var(--ink)]"
        >
          <p className="kicker mb-2">{s.textSize}</p>
          <div className="grid grid-cols-3 border border-ink">
            {sizes.map((o) => (
              <button
                key={o.v}
                type="button"
                aria-pressed={prefs.size === o.v}
                onClick={() => setPref("size", o.v)}
                className={`pressable h-12 border-r border-ink font-display last:border-r-0 ${o.px} ${
                  prefs.size === o.v ? "bg-ink text-paper" : ""
                }`}
              >
                अ A
              </button>
            ))}
          </div>
          <p className="kicker mb-2 mt-4">{s.theme}</p>
          <div className="grid grid-cols-3 border border-ink">
            {themes.map((o) => (
              <button
                key={o.v}
                type="button"
                aria-pressed={prefs.theme === o.v}
                onClick={() => setPref("theme", o.v)}
                className={`pressable flex h-14 flex-col items-center justify-center gap-0.5 border-r border-ink text-sm font-bold last:border-r-0 ${
                  prefs.theme === o.v ? "bg-ink text-paper" : ""
                }`}
              >
                <Icon name={o.icon} size={18} />
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
