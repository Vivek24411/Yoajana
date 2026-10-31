import type { ReactNode } from "react";

/** Newspaper section head: heavy rule, red numeral, label, optional link on the right. */
export function SectionHead({ n, title, action, as: Tag = "h2" }: { n?: string; title: string; action?: ReactNode; as?: "h1" | "h2" }) {
  return (
    <div className="section-head">
      {n && <span className="font-display text-xl leading-none text-accent">{n}</span>}
      <Tag className="flex-1 text-[1.15rem] font-bold leading-tight">{title}</Tag>
      {action}
    </div>
  );
}
