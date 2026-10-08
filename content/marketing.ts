import type { PricingPlan } from "@/types";

/**
 * Pricing — shared by the homepage ("Begin") and signup. Homepage story copy
 * lives in content/home.ts.
 */
export const pricing: { title: string; body: string; plans: PricingPlan[] } = {
  title: "Simple plans that grow with you.",
  body: "Every plan includes all six modules. Prices exclude VAT and are billed per workspace.",
  plans: [
    {
      id: "starter",
      name: "Starter",
      description: "For founders and small teams getting organised.",
      price: { monthly: 29, yearly: 24 },
      highlighted: false,
      cta: { label: "Start free", href: "/onboarding?plan=starter" },
      features: ["Up to 3 members", "5 integrations", "Core automations", "Weekly digest"],
    },
    {
      id: "growth",
      name: "Growth",
      description: "For teams ready to run the company on Syxoria.",
      price: { monthly: 69.99, yearly: 58 },
      highlighted: true,
      cta: { label: "Create my account", href: "/onboarding?plan=growth" },
      features: ["Up to 10 members", "Unlimited integrations", "Nexo insights & recommendations", "Advanced automations with approvals", "Mobile app"],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "For organisations with advanced security needs.",
      price: { monthly: null, yearly: null },
      highlighted: false,
      cta: { label: "Talk to us", href: "mailto:hello@syxoria.com?subject=Enterprise" },
      features: ["Unlimited members", "SSO / SAML & audit exports", "Orion Advanced", "Dedicated success manager", "Custom data residency"],
    },
  ],
};
