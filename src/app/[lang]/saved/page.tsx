import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SavedList } from "@/components/help-client";
import { getDictionary, hasLocale } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/saved">): Promise<Metadata> {
  const { lang } = await params;
  return { title: getDictionary(hasLocale(lang) ? lang : "hi").saved.title };
}

export default async function SavedPage({ params }: PageProps<"/[lang]/saved">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  return (
    <div className="flex flex-col gap-5">
      <h1 className="enter font-display text-[2rem] font-semibold leading-tight">{t.saved.title}</h1>
      <SavedList lang={lang} t={t} />
    </div>
  );
}
