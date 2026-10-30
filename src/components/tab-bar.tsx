"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dictionary, Locale } from "@/lib/i18n";
import { Icon, type IconName } from "./icons";

type Labels = Dictionary["nav"];

function useTabs(lang: Locale, labels: Labels) {
  const pathname = usePathname();
  const tabs: { href: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
    { href: `/${lang}`, label: labels.home, icon: "home", match: (p) => p === `/${lang}` },
    { href: `/${lang}/schemes`, label: labels.browse, icon: "grid", match: (p) => p.startsWith(`/${lang}/schemes`) },
    { href: `/${lang}/chat`, label: labels.chat, icon: "mic", match: (p) => p.startsWith(`/${lang}/chat`) },
    { href: `/${lang}/find`, label: labels.find, icon: "list", match: (p) => p.startsWith(`/${lang}/find`) || p.startsWith(`/${lang}/saved`) },
    { href: `/${lang}/help`, label: labels.help, icon: "lifebuoy", match: (p) => p.startsWith(`/${lang}/help`) },
  ];
  return { tabs, pathname };
}

/** Thumb-reach navigation for phones. The "Ask" mic sits raised in the middle: speaking is the main way in. */
export function TabBar({ lang, labels }: { lang: Locale; labels: Labels }) {
  const { tabs, pathname } = useTabs(lang, labels);
  if (pathname.startsWith(`/${lang}/chat`)) return null;
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 sm:hidden"
      style={{ viewTransitionName: "tab-bar" }}
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {tabs.map((tab, i) => {
          const active = tab.match(pathname);
          if (i === 2) {
            return (
              <li key={tab.href} className="flex justify-center">
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className="pressable -mt-5 flex flex-col items-center gap-0.5"
                >
                  <span className="grid size-14 place-items-center rounded-full bg-brand text-brand-ink shadow-[0_10px_24px_-8px_var(--brand)] ring-4 ring-bg">
                    <Icon name="mic" size={26} strokeWidth={2} />
                  </span>
                  <span className={`text-[0.7rem] font-semibold ${active ? "text-brand" : "text-muted"}`}>{tab.label}</span>
                </Link>
              </li>
            );
          }
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`pressable relative flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-semibold ${
                  active ? "text-brand" : "text-muted"
                }`}
              >
                <span
                  className={`absolute top-0 h-[3px] w-8 rounded-b-full bg-brand transition-transform duration-300 ease-[var(--ease-out)] ${
                    active ? "scale-x-100" : "scale-x-0"
                  }`}
                />
                <Icon name={tab.icon} size={23} strokeWidth={active ? 2.1 : 1.75} />
                <span className="max-w-full truncate px-1">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Same destinations as the tab bar, shown inline in the header on wider screens. */
export function NavLinks({ lang, labels }: { lang: Locale; labels: Labels }) {
  const { tabs, pathname } = useTabs(lang, labels);
  return (
    <nav aria-label="Main" className="mr-1 hidden items-center gap-0.5 sm:flex">
      {tabs.slice(1).map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`pressable flex items-center gap-1.5 rounded-full px-3 py-2 text-[0.95rem] font-semibold ${
              active ? "bg-brand-soft text-brand" : "text-muted hover:text-text"
            }`}
          >
            <Icon name={tab.icon} size={18} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SiteFooter({ text }: { text: string }) {
  const pathname = usePathname();
  if (/^\/(hi|en)\/chat/.test(pathname)) return null;
  return (
    <footer className="mx-auto w-full max-w-3xl px-4 pb-28 text-sm leading-relaxed text-muted sm:pb-10">
      <div className="border-t border-border pt-5">{text}</div>
    </footer>
  );
}
