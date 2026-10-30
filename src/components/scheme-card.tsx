import Link from "next/link";
import type { ReactNode } from "react";
import { categoryOf } from "@/lib/categories";
import { Icon } from "./icons";
import { SaveButton } from "./save-button";

/**
 * One scheme in a list. The whole card is a link (stretched ::after), with the save
 * button layered above it so we never nest a button inside an anchor.
 */
export function SchemeCard({
  href,
  slug,
  name,
  localName,
  state,
  place,
  summary,
  tags,
  reviewed,
  reviewedLabel,
  saveLabels,
  index = 0,
  children,
}: {
  href: string;
  slug: string;
  name: string;
  localName?: string;
  state: string | null;
  place: string;
  summary?: string;
  tags: string[];
  reviewed?: boolean;
  reviewedLabel?: string;
  saveLabels: { save: string; saved: string };
  index?: number;
  children?: ReactNode;
}) {
  const icon = categoryOf(tags)?.icon ?? "file";
  return (
    <li className="enter card pressable lift relative" style={{ "--i": Math.min(index, 10) } as React.CSSProperties}>
      <Link href={href} className="flex gap-3.5 p-4 pr-14 after:absolute after:inset-0 after:rounded-[inherit] after:content-['']">
        <span className="grid size-11 flex-none place-items-center rounded-2xl bg-brand-soft text-brand">
          <Icon name={icon} size={22} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.8rem] font-semibold text-muted">
            <span className="inline-flex items-center gap-1">
              <Icon name={state ? "mapPin" : "shield"} size={13} />
              {place}
            </span>
            {reviewed && reviewedLabel && (
              <span className="inline-flex items-center gap-1 text-green">
                <Icon name="check" size={13} strokeWidth={2.5} />
                {reviewedLabel}
              </span>
            )}
          </span>
          {localName && <span className="mt-1 block text-[1.05rem] font-bold leading-snug text-brand">{localName}</span>}
          <span className={`block font-bold leading-snug text-pretty ${localName ? "text-[0.95rem] text-muted" : "mt-1 text-[1.08rem]"}`}>
            {name}
          </span>
          {summary && <span className="mt-1.5 line-clamp-2 text-[0.95rem] leading-relaxed text-muted text-pretty">{summary}</span>}
          {children}
        </span>
      </Link>
      <SaveButton slug={slug} name={name} state={state} href={href} labels={saveLabels} className="absolute right-2 top-2 z-10" />
    </li>
  );
}
