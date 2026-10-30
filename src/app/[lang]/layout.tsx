import type { Metadata, Viewport } from "next";
import { Fraunces, Noto_Sans, Noto_Sans_Devanagari, Tiro_Devanagari_Hindi } from "next/font/google";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Pwa } from "@/components/pwa";
import { SiteFooter, TabBar } from "@/components/tab-bar";
import { getDictionary, hasLocale, LOCALES } from "@/lib/i18n";
import "../globals.css";

const noto = Noto_Sans({ subsets: ["latin"], variable: "--font-noto", display: "swap" });
const notoDeva = Noto_Sans_Devanagari({ subsets: ["devanagari"], variable: "--font-noto-deva", display: "swap" });
// Display faces for headings only: an editorial serif for Latin, a calligraphic Devanagari to match.
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", axes: ["opsz"] });
const tiro = Tiro_Devanagari_Hindi({ subsets: ["devanagari"], weight: "400", variable: "--font-tiro", display: "swap" });

// Runs before first paint so a saved text size or theme never flashes the default.
const PREFS_SCRIPT = `try{var p=JSON.parse(localStorage.getItem("yojana-prefs-v1")||"{}"),r=document.documentElement;if(p.size)r.dataset.size=p.size;if(p.theme&&p.theme!=="system")r.dataset.theme=p.theme}catch(e){}`;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const t = getDictionary(hasLocale(lang) ? lang : "hi");
  return {
    title: { default: t.appName, template: `%s · ${t.appName}` },
    description: t.tagline,
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, title: t.appName, statusBarStyle: "default" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e7" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1210" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  return (
    <html
      lang={lang}
      suppressHydrationWarning
      className={`${noto.variable} ${notoDeva.variable} ${fraunces.variable} ${tiro.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFS_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col font-sans">
        <Header lang={lang} t={t} />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-10 pt-5 sm:pb-16">{children}</main>
        <SiteFooter text={t.footer} />
        <TabBar lang={lang} labels={t.nav} />
        <Pwa labels={t.status} />
      </body>
    </html>
  );
}
