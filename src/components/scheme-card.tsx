import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./icons";
import { SaveButton } from "./save-button";

/**
 * One scheme in a list, set as a ruled row: where it applies, the name, two lines of summary.
 * The row is a link (stretched ::after) with the save button layered above it,
 * so a button is never nested inside an anchor.
 */
export function SchemeCard({
  href,
  slug,
  name,
  localName,
  state,
  place,
  summary,
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
  tags?: string[];
  reviewed?: boolean;
  reviewedLabel?: string;
  saveLabels: { save: string; saved: string };
  index?: number;
  children?: ReactNode;
}) {
  return (
    <li className="enter group relative border-b border-rule" style={{ "--i": Math.min(index, 10) } as React.CSSProperties}>
      <Link href={href} className="block py-4 pr-12 after:absolute after:inset-0 after:content-['']">
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[0.8rem] font-bold uppercase tracking-wide text-muted">
          <span>{place}</span>
          {reviewed && reviewedLabel && (
            <span className="inline-flex items-center gap-1 normal-case tracking-normal text-stamp">
              <Icon name="check" size={13} strokeWidth={3} />
              {reviewedLabel}
            </span>
          )}
        </span>
        {localName && <span className="mt-1 block font-display text-[1.3rem] leading-tight group-hover:text-accent">{localName}</span>}
        <span
          className={`block leading-snug text-pretty ${
            localName ? "text-[0.95rem] font-semibold text-muted" : "mt-1 text-[1.1rem] font-bold group-hover:text-accent"
          }`}
        >
          {name}
        </span>
        {summary && <span className="mt-1 line-clamp-2 text-[0.95rem] leading-relaxed text-muted text-pretty">{summary}</span>}
        {children}
      </Link>
      <SaveButton slug={slug} name={name} state={state} href={href} labels={saveLabels} className="absolute right-0 top-3 z-10" />
    </li>
  );
}
