import type { Metadata, Viewport } from "next";
import { Mukta, Rozha_One } from "next/font/google";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Pwa } from "@/components/pwa";
import { SiteFooter, TabBar } from "@/components/tab-bar";
import { getDictionary, hasLocale, LOCALES } from "@/lib/i18n";
import "../globals.css";

// Mukta was drawn for Hindi and English together; Rozha One is a Hindi-newspaper headline face.
const mukta = Mukta({ subsets: ["latin", "devanagari"], weight: ["400", "600", "700"], variable: "--font-mukta", display: "swap" });
const rozha = Rozha_One({ subsets: ["latin", "devanagari"], weight: "400", variable: "--font-rozha", display: "swap" });

// Runs before first paint so a saved text size or theme never flashes the default.
// Light unless the person chose Dark, or chose Auto and their phone is in dark mode.
const PREFS_SCRIPT = `try{var p=JSON.parse(localStorage.getItem("yojana-prefs-v1")||"{}"),r=document.documentElement;if(p.size)r.dataset.size=p.size;if(p.theme==="dark"||(p.theme==="system"&&matchMedia("(prefers-color-scheme: dark)").matches))r.dataset.theme="dark"}catch(e){}`;

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
  themeColor: "#f3eee3",
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
      className={`${mukta.variable} ${rozha.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFS_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col font-sans">
        <Header lang={lang} t={t} />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-10 pt-6 sm:pb-16">{children}</main>
        <SiteFooter text={t.footer} />
        <TabBar lang={lang} labels={t.nav} />
        <Pwa labels={t.status} />
      </body>
    </html>
  );
}
