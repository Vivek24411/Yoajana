import Link from "next/link";
import { Icon } from "@/components/icons";

// Rendered without route params, so speak both languages.
export default function NotFound() {
  return (
    <div className="enter flex flex-col items-center gap-4 py-16 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-surface-2 text-muted">
        <Icon name="search" size={30} />
      </span>
      <h1 className="font-display text-2xl font-semibold">यह पेज नहीं मिला · Page not found</h1>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/hi/schemes" className="btn btn-primary pressable">
          सभी योजनाएँ
        </Link>
        <Link href="/en" className="btn btn-ghost pressable">
          Home
        </Link>
      </div>
    </div>
  );
}
