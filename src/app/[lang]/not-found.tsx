import Link from "next/link";
import { Icon } from "@/components/icons";

// Rendered without route params, so speak both languages.
export default function NotFound() {
  return (
    <div className="enter flex flex-col items-start gap-4 border-t-[3px] border-ink py-8">
      <span className="text-accent">
        <Icon name="search" size={30} />
      </span>
      <h1 className="font-display text-3xl">यह पेज नहीं मिला · Page not found</h1>
      <div className="flex flex-wrap gap-2">
        <Link href="/hi/schemes" className="btn btn-ink pressable">
          सभी योजनाएँ
        </Link>
        <Link href="/en" className="btn btn-line pressable">
          Home
        </Link>
      </div>
    </div>
  );
}
