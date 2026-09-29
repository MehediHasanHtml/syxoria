import type { Metadata } from "next";
import { CoreStory } from "@/components/home/core-story";
import { FilmProvider } from "@/components/home/film";
import { pricing } from "@/content/marketing";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** Structured data: organisation and software product with offers. */
function JsonLd() {
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: `${siteConfig.url}/icon.svg`,
      email: siteConfig.contactEmail,
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: siteConfig.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, iOS, Android",
      description: siteConfig.description,
      offers: pricing.plans
        .filter((p) => p.price.monthly !== null)
        .map((p) => ({ "@type": "Offer", name: p.name, price: p.price.monthly, priceCurrency: "EUR" })),
    },
  ];
  return (
    <script
      type="application/ld+json"
      // JSON-LD must be inlined; content is static and escaped.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/**
 * The homepage is one continuous scene around the Core — see CoreStory for
 * the chapters (genesis → growth → pulse → modules → workspace → connections → access).
 */
export default function HomePage() {
  return (
    <FilmProvider>
      <JsonLd />
      <CoreStory />
    </FilmProvider>
  );
}
