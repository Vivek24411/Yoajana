import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeProfile, HomeVoice } from "@/components/home-client";
import { Icon } from "@/components/icons";
import { SectionHead } from "@/components/section-head";
import { CATEGORIES } from "@/lib/categories";
import { getDictionary, hasLocale, numeral } from "@/lib/i18n";
import { FIGURE, POPULAR, POPULAR_ORDER } from "@/lib/popular";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const popular = POPULAR_ORDER.slice(0, 6);

  return (
    <div className="flex flex-col gap-11">
      <section className="enter flex flex-col">
        <p className="kicker">{t.home.greeting}</p>
        <h1 className="mt-2 font-display text-[2.7rem] leading-[1.05] text-balance sm:text-[3.4rem]">{t.home.heroTitle}</h1>
        <p className="mt-3 max-w-md text-[1.05rem] leading-relaxed text-muted text-pretty">{t.home.heroBody}</p>
        <div className="mt-7">
          <HomeVoice lang={lang} t={t} />
        </div>
        <form action={`/${lang}/schemes`} role="search" className="relative mt-6">
          <Icon name="search" size={20} className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 text-muted" />
          <input
            name="q"
            placeholder={t.home.searchPlaceholder}
            aria-label={t.home.searchPlaceholder}
            enterKeyHint="search"
            className="field pl-9"
          />
        </form>
      </section>

      <section className="enter flex flex-col" style={{ "--i": 2 } as React.CSSProperties}>
        <SectionHead n={numeral(1, lang)} title={t.nav.find} />
        <HomeProfile lang={lang} t={t} />
      </section>

      <section className="enter flex flex-col" style={{ "--i": 3 } as React.CSSProperties}>
        <SectionHead n={numeral(2, lang)} title={t.home.topics} />
        <ul className="grid grid-cols-2 gap-x-6">
          {CATEGORIES.map((c) => (
            <li key={c.id}>
              <Link href={`/${lang}/schemes?cat=${c.id}`} className="group flex items-center gap-3 border-b border-rule py-3.5 font-bold">
                <Icon name={c.icon} size={21} className="flex-none text-accent" />
                <span className="flex-1 leading-tight">{c.label[lang]}</span>
                <Icon name="chevronRight" size={17} className="flex-none text-muted transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="enter flex flex-col" style={{ "--i": 4 } as React.CSSProperties}>
        <SectionHead
          n={numeral(3, lang)}
          title={t.home.popular}
          action={
            <Link href={`/${lang}/schemes`} className="text-sm font-bold text-accent">
              {t.common.seeAll}
            </Link>
          }
        />
        <ul>
          {popular.map((slug) => (
            <li key={slug}>
              <Link href={`/${lang}/schemes/${slug}`} className="group flex items-baseline gap-2 border-b border-rule py-3.5">
                <span className="font-bold leading-snug group-hover:text-accent">{POPULAR[slug][lang].name}</span>
                <span className="leaders" aria-hidden />
                <span className="whitespace-nowrap font-display text-[1.05rem] text-accent">{FIGURE[slug][lang]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <aside className="notice">
        <p className="font-display text-2xl leading-none text-accent">{t.home.safetyTitle}</p>
        <p className="mt-2 leading-relaxed">{t.home.safety}</p>
        <a href="tel:1930" className="mt-3 inline-flex items-center gap-2 font-bold underline decoration-accent decoration-2 underline-offset-4">
          <Icon name="phone" size={18} />
          {t.home.safetyCall}
        </a>
      </aside>
    </div>
  );
}
