"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";
import { getDictionary } from "@/lib/i18n";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const lang = usePathname().startsWith("/en") ? "en" : "hi";
  const t = getDictionary(lang);
  return (
    <div className="enter flex flex-col items-start gap-4 border-t-[3px] border-ink py-8">
      <span className="text-accent">
        <Icon name="alert" size={30} />
      </span>
      <h1 className="font-display text-3xl">{t.errors.title}</h1>
      <p className="max-w-sm text-muted">{t.errors.body}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={reset} className="btn btn-ink pressable">
          <Icon name="refresh" size={18} />
          {t.chat.retry}
        </button>
        <Link href={`/${lang}`} className="btn btn-line pressable">
          {t.errors.home}
        </Link>
      </div>
    </div>
  );
}
