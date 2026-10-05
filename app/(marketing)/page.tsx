import type { Metadata } from "next";
import { CoreExperience } from "@/components/home/core-experience";
import { FilmProvider } from "@/components/home/film";
import { SectionNavigation } from "@/components/home/section-navigation";
import { SmoothScrollProvider } from "@/components/home/smooth-scroll";
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
 * The homepage: one pinned scene around the Core that the visitor scrolls
 * through and explores — core → one core → modules → workspace →
 * integrations → pricing (see CoreExperience). The section navigation jumps
 * to any of them.
 */
export default function HomePage() {
  return (
    <SmoothScrollProvider>
      <FilmProvider>
        <JsonLd />
        <CoreExperience />
        <SectionNavigation />
      </FilmProvider>
    </SmoothScrollProvider>
  );
}
