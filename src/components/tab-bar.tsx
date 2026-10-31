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
    { href: `/${lang}/chat`, label: labels.chat, icon: "mic", match: (p) => p.startsWith(`/${lang}/chat`) },
    { href: `/${lang}/find`, label: labels.find, icon: "list", match: (p) => p.startsWith(`/${lang}/find`) || p.startsWith(`/${lang}/saved`) },
    { href: `/${lang}/schemes`, label: labels.browse, icon: "grid", match: (p) => p.startsWith(`/${lang}/schemes`) },
    { href: `/${lang}/help`, label: labels.help, icon: "phone", match: (p) => p.startsWith(`/${lang}/help`) },
  ];
  return { tabs, pathname };
}

/** Thumb-reach navigation for phones: a ruled strip, the active tab marked in red. */
export function TabBar({ lang, labels }: { lang: Locale; labels: Labels }) {
  const { tabs, pathname } = useTabs(lang, labels);
  if (pathname.startsWith(`/${lang}/chat`)) return null;
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
      style={{ viewTransitionName: "tab-bar" }}
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const ask = tab.icon === "mic";
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`pressable relative flex h-16 flex-col items-center justify-center gap-0.5 text-[0.72rem] font-bold ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                <span
                  className={`absolute top-0 h-[3px] w-10 bg-accent transition-transform duration-300 ease-[var(--ease-out)] ${active ? "scale-x-100" : "scale-x-0"}`}
                />
                {ask ? (
                  <span className={`grid size-8 place-items-center rounded-full ${active ? "bg-accent text-paper" : "bg-ink text-paper"}`}>
                    <Icon name="mic" size={18} strokeWidth={2.2} />
                  </span>
                ) : (
                  <Icon name={tab.icon} size={22} strokeWidth={active ? 2.2 : 1.8} />
                )}
                <span className="max-w-full truncate px-1">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Same destinations as the tab bar, inline in the masthead on wider screens. */
export function NavLinks({ lang, labels }: { lang: Locale; labels: Labels }) {
  const { tabs, pathname } = useTabs(lang, labels);
  return (
    <nav aria-label="Main" className="mr-3 hidden items-center gap-5 sm:flex">
      {tabs.slice(1).map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.match(pathname) ? "true" : undefined}
          className="tab text-[0.98rem]"
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

export function SiteFooter({ text }: { text: string }) {
  const pathname = usePathname();
  if (/^\/(hi|en)\/chat/.test(pathname)) return null;
  return (
    <footer className="mx-auto w-full max-w-2xl px-4 pb-28 text-sm leading-relaxed text-muted sm:pb-10">
      <div className="border-t border-rule pt-4">{text}</div>
    </footer>
  );
}
