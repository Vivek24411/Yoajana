"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/i18n";

export function LangSwitch({ lang, label }: { lang: Locale; label: string }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const other: Locale = lang === "hi" ? "en" : "hi";
  const rest = pathname.replace(/^\/(hi|en)(?=\/|$)/, "");
  const qs = search.toString();
  return (
    <Link
      href={`/${other}${rest}${qs ? `?${qs}` : ""}`}
      onClick={() => {
        document.cookie = `lang=${other}; path=/; max-age=31536000; samesite=lax`;
      }}
      className="btn btn-ghost pressable min-h-10 px-3.5 text-[16px]"
      lang={other}
    >
      {label}
    </Link>
  );
}
