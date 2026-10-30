import Link from "next/link";
import { Suspense } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import { Logo } from "./icons";
import { LangSwitch } from "./lang-switch";
import { NavLinks } from "./tab-bar";
import { SettingsMenu } from "./settings-menu";

export function Header({ lang, t }: { lang: Locale; t: Dictionary }) {
  return (
    <header
      className="sticky top-0 z-30 border-b border-border/70 bg-bg/80 backdrop-blur-xl backdrop-saturate-150"
      style={{ viewTransitionName: "site-header" }}
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-2 px-4">
        <Link href={`/${lang}`} className="mr-auto flex items-center gap-2.5 rounded-xl py-1 pr-2">
          <Logo size={36} />
          <span className="whitespace-nowrap font-display text-[21px] font-semibold leading-none tracking-tight text-text">{t.appName}</span>
        </Link>
        <NavLinks lang={lang} labels={t.nav} />
        <SettingsMenu t={t} />
        <Suspense fallback={<span className="btn btn-ghost min-h-10 px-3.5 text-base">{t.switchLang}</span>}>
          <LangSwitch lang={lang} label={t.switchLang} />
        </Suspense>
      </div>
    </header>
  );
}
