import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeProfile, HomeVoice, SavedStrip } from "@/components/home-client";
import { Icon } from "@/components/icons";
import { CATEGORIES } from "@/lib/categories";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { POPULAR, POPULAR_ORDER } from "@/lib/popular";
import { allSchemes, states } from "@/lib/schemes";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const total = allSchemes().length.toLocaleString("en-IN");
  const popular = POPULAR_ORDER.slice(0, 10).map((slug) => ({ slug, ...POPULAR[slug] }));

  return (
    <div className="flex flex-col gap-9">
      {/* Hero: speaking is the front door. */}
      <section className="enter relative overflow-hidden rounded-[1.75rem] bg-hero px-5 pb-6 pt-7 text-hero-ink shadow-[0_24px_60px_-30px_rgba(13,68,52,0.7)]">
        <HeroArt />
        <div className="relative">
          <p className="font-display text-lg text-accent">{t.home.greeting}</p>
          <h1 className="mt-1 max-w-[16ch] font-display text-[2.1rem] font-semibold leading-[1.12] text-balance sm:text-[2.6rem]">
            {t.home.heroTitle}
          </h1>
          <p className="mt-3 max-w-md text-[1.02rem] leading-relaxed text-hero-ink/80 text-pretty">{t.home.heroBody}</p>
        </div>
        <div className="relative mt-7">
          <HomeVoice lang={lang} t={t} />
        </div>
        <form action={`/${lang}/schemes`} className="relative mt-5" role="search">
          <Icon name="search" size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            name="q"
            placeholder={t.home.searchPlaceholder}
            aria-label={t.home.searchPlaceholder}
            enterKeyHint="search"
            className="h-14 w-full rounded-full border-0 bg-surface pl-12 pr-4 text-text outline-none ring-accent/60 placeholder:text-muted focus:ring-4"
          />
        </form>
        <p className="relative mt-5 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-hero-ink/75">
          <span>
            <b className="text-hero-ink">{total}</b> {t.home.statSchemes}
          </span>
          <span>
            <b className="text-hero-ink">{states().length}</b> {t.home.statStates}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="shield" size={15} className="text-accent" />
            {t.home.statFree}
          </span>
        </p>
      </section>

      <HomeProfile lang={lang} t={t} />

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-[1.45rem] font-semibold">{t.home.topics}</h2>
        <ul className="grid grid-cols-3 gap-2.5">
          {CATEGORIES.slice(0, 9).map((c, i) => (
            <li key={c.id} className="enter" style={{ "--i": i + 2 } as React.CSSProperties}>
              <Link
                href={`/${lang}/schemes?cat=${c.id}`}
                className="card pressable lift flex h-full flex-col items-center gap-2 px-2 py-4 text-center"
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
                  <Icon name={c.icon} size={26} />
                </span>
                <span className="text-[0.88rem] font-semibold leading-tight">{c.label[lang]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <SavedStrip lang={lang} t={t} />

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-[1.45rem] font-semibold">{t.home.popular}</h2>
          <Link href={`/${lang}/schemes`} className="text-sm font-bold text-brand">
            {t.common.seeAll}
          </Link>
        </div>
        <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
          {popular.map((p) => (
            <li key={p.slug} className="snap-start">
              <Link
                href={`/${lang}/schemes/${p.slug}`}
                className="card pressable lift flex h-full w-60 flex-col gap-3 p-4"
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent">
                  <Icon name={p.icon} size={24} />
                </span>
                <span className="font-bold leading-snug">{p[lang].name}</span>
                <span className="text-[0.92rem] leading-relaxed text-muted">{p[lang].line}</span>
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-brand">
                  {t.common.more}
                  <Icon name="arrowRight" size={16} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="card relative overflow-hidden border-amber/30 bg-amber-soft p-5">
        <div className="flex items-start gap-3.5">
          <span className="grid size-11 flex-none place-items-center rounded-2xl bg-surface text-amber">
            <Icon name="shield" size={24} />
          </span>
          <div>
            <h2 className="text-lg font-bold">{t.home.safetyTitle}</h2>
            <p className="mt-1 text-[0.98rem] leading-relaxed">{t.home.safety}</p>
            <a href="tel:1930" className="btn btn-ghost pressable mt-3 min-h-11 border-amber/50 text-base">
              <Icon name="phone" size={18} />
              {t.home.safetyCall}
            </a>
          </div>
        </div>
      </section>

      <Link href={`/${lang}/help`} className="card pressable lift group flex items-center gap-4 p-5">
        <span className="grid size-12 flex-none place-items-center rounded-2xl bg-brand-soft text-brand">
          <Icon name="mapPin" size={26} />
        </span>
        <span className="flex-1">
          <span className="block text-lg font-bold">{t.home.helpTitle}</span>
          <span className="block text-[0.95rem] text-muted">{t.home.helpBody}</span>
        </span>
        <Icon name="chevronRight" size={22} className="text-muted transition-transform duration-300 group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

/** A rising marigold sun over ploughed fields: drawn, not downloaded. */
function HeroArt() {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 400 520" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="hero-glow" cx="85%" cy="8%" r="60%">
          <stop offset="0" stopColor="var(--accent)" stopOpacity=".35" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="520" fill="url(#hero-glow)" />
      <g style={{ transformOrigin: "340px 60px", animation: "sun-turn 90s linear infinite" }} stroke="var(--accent)" strokeOpacity=".35" strokeWidth="2" strokeLinecap="round">
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return <line key={i} x1={340 + Math.cos(a) * 44} y1={60 + Math.sin(a) * 44} x2={340 + Math.cos(a) * 58} y2={60 + Math.sin(a) * 58} />;
        })}
      </g>
      <circle cx="340" cy="60" r="34" fill="var(--accent)" fillOpacity=".9" />
      <g fill="none" stroke="var(--hero-ink)" strokeOpacity=".07" strokeWidth="1.5">
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={`M-20 ${400 + i * 16} Q 200 ${360 + i * 22} 420 ${392 + i * 14}`} />
        ))}
      </g>
    </svg>
  );
}
