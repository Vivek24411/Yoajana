"use client";

import { toggleSaved, useSaved } from "@/lib/storage";
import { Icon } from "./icons";

/** Bookmark a scheme on this phone. Saving also pre-loads the page so it opens without internet. */
export function SaveButton({
  slug,
  name,
  state,
  href,
  labels,
  variant = "icon",
  className = "",
}: {
  slug: string;
  name: string;
  state: string | null;
  href: string;
  labels: { save: string; saved: string };
  variant?: "icon" | "pill";
  className?: string;
}) {
  const saved = useSaved().some((s) => s.slug === slug);

  function onClick() {
    const added = toggleSaved({ slug, name, state });
    if (added) fetch(href, { headers: { accept: "text/html" } }).catch(() => {});
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        className={`pressable inline-flex h-10 items-center gap-2 rounded-md border-[1.5px] px-3 text-[0.95rem] font-bold ${
          saved ? "border-accent bg-accent text-paper" : "border-ink hover:bg-paper-2"
        } ${className}`}
      >
        <Icon
          key={String(saved)}
          name="bookmark"
          size={18}
          className={saved ? "pop" : ""}
          fill={saved ? "currentColor" : "none"}
        />
        {saved ? labels.saved : labels.save}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? labels.saved : labels.save}
      title={saved ? labels.saved : labels.save}
      className={`pressable grid size-11 place-items-center rounded ${saved ? "text-accent" : "text-muted hover:text-ink"} ${className}`}
    >
      <Icon key={String(saved)} name="bookmark" size={21} className={saved ? "pop" : ""} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
