import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Hanken_Grotesk, Instrument_Serif, Schibsted_Grotesk, Sora, Spectral } from "next/font/google";
import { siteConfig } from "@/lib/site-config";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

// The brand's type (see "Typography" in globals.css): Spectral for headlines and their italic
// accent, Schibsted Grotesk for text and labels
const spectral = Spectral({ variable: "--font-spectral", weight: ["200", "300", "400"], style: ["normal", "italic"], subsets: ["latin"], display: "swap" });
const schibsted = Schibsted_Grotesk({ variable: "--font-schibsted", subsets: ["latin"], display: "swap" });
// The product (dashboard) keeps its own type: Geist, with Sora headings
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });
const sora = Sora({ variable: "--font-sora", subsets: ["latin"], display: "swap", preload: false });
// Only for comparing directions on the homepage (?compare): downloaded if shown, never preloaded
const hanken = Hanken_Grotesk({ variable: "--font-hanken", subsets: ["latin"], display: "swap", preload: false });
const serif = Instrument_Serif({ variable: "--font-instrument", weight: "400", style: ["normal", "italic"], subsets: ["latin"], display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    url: "/",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    site: siteConfig.twitter,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#08090a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      // the inline script may switch data-theme (and the type to compare) before React hydrates
      suppressHydrationWarning
      className={`${spectral.variable} ${schibsted.variable} ${geistSans.variable} ${geistMono.variable} ${sora.variable} ${hanken.variable} ${serif.variable} antialiased`}
    >
      <head>
        {/* the visitor's light / dark choice, applied before the first paint */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        {children}
      </body>
    </html>
  );
}
