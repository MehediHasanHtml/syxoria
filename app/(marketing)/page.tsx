import type { Metadata } from "next";
import { Begin } from "@/components/home/closing";
import { FilmProvider } from "@/components/home/film";
import { Genesis } from "@/components/home/genesis";
import { ProductStage } from "@/components/home/product-stage";
import { Trajectory } from "@/components/home/trajectory";
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
 * The homepage is one story in four movements — few words, strong moments:
 * the universe (a tree that grows as you scroll) → progression (a rising line)
 * → the product (a screen that switches on) → a return to the tree, fully grown.
 */
export default function HomePage() {
  return (
    <FilmProvider>
      <JsonLd />
      <Genesis />
      <Trajectory />
      <ProductStage />
      <Begin />
    </FilmProvider>
  );
}
