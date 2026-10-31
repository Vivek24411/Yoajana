import Link from "next/link";
import { Suspense } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import { Logo } from "./icons";
import { LangSwitch } from "./lang-switch";
import { NavLinks } from "./tab-bar";
import { SettingsMenu } from "./settings-menu";

/** Masthead: the name set like a newspaper title, with a double rule underneath. */
export function Header({ lang, t }: { lang: Locale; t: Dictionary }) {
  return (
    <header className="sticky top-0 z-30 bg-paper/92 backdrop-blur-md" style={{ viewTransitionName: "site-header" }}>
      <div className="mx-auto flex h-16 max-w-4xl items-center gap-1.5 px-4">
        <Link href={`/${lang}`} className="mr-auto flex items-center gap-2.5 py-1 pr-2">
          <Logo size={34} />
          <span className="whitespace-nowrap font-display text-[24px] leading-none">{t.appName}</span>
        </Link>
        <NavLinks lang={lang} labels={t.nav} />
        <SettingsMenu t={t} />
        <Suspense fallback={<span className="px-2 text-[16px] font-bold">{t.switchLang}</span>}>
          <LangSwitch lang={lang} label={t.switchLang} />
        </Suspense>
      </div>
      <div className="mx-auto max-w-4xl px-4" aria-hidden>
        <div className="h-[5px] border-y border-ink" />
      </div>
    </header>
  );
}
