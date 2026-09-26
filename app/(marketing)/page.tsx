import type { Metadata } from "next";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { IntegrationsBand } from "@/components/marketing/integrations-band";
import { Manifesto } from "@/components/marketing/manifesto";
import { ProductSection } from "@/components/marketing/product-section";
import { Faq } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/final-cta";
import { GrowthCurveSection } from "@/components/marketing/growth-curve-section";
import { MobileApp } from "@/components/marketing/mobile-app";
import { ModulesSection } from "@/components/marketing/modules-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { Security } from "@/components/marketing/security";
import { Testimonial } from "@/components/marketing/testimonial";
import { UseCases } from "@/components/marketing/use-cases";
import { faqs, pricing } from "@/content/marketing";
import { siteConfig } from "@/lib/site-config";
import { getPreviewData } from "@/services/preview";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** Structured data: organisation, software product with offers, FAQ. */
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
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.title, acceptedAnswer: { "@type": "Answer", text: f.content } })),
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

export default async function HomePage() {
  const preview = await getPreviewData();
  return (
    <>
      <JsonLd />
      <Hero data={preview} />
      <ProductSection data={preview} />
      <IntegrationsBand integrations={preview.integrations} />
      <Manifesto />
      <HowItWorks />
      <ModulesSection data={preview} />
      <GrowthCurveSection />
      <UseCases />
      <Testimonial />
      <Security />
      <MobileApp />
      <PricingSection />
      <Faq />
      <FinalCta />
    </>
  );
}
