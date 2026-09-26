/**
 * Global site configuration. Values that differ per environment come from
 * PUBLIC env vars only — never put secrets here (this file ships to the client).
 */
export const siteConfig = {
  name: "Syxoria",
  tagline: "The operating system for growing companies",
  description:
    "Syxoria connects your tools, understands your operations and turns every signal into measurable progress — one calm workspace for the way your company grows.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://syxoria.com",
  locale: "en_GB",
  twitter: "@syxoria",
  /** Set to real store URLs when the mobile apps ship; `null` renders a "coming soon" state. */
  appLinks: {
    ios: null as string | null,
    android: null as string | null,
  },
  contactEmail: "hello@syxoria.com",
} as const;

export type NavLink = { label: string; href: string };

export const marketingNav: NavLink[] = [
  { label: "Product", href: "/#product" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Solutions", href: "/#solutions" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Resources", href: "/#faq" },
];

export const footerNav: { title: string; links: NavLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "/#product" },
      { label: "Modules", href: "/#modules" },
      { label: "Integrations", href: "/#integrations" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Open workspace", href: "/app" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Solutions", href: "/#solutions" },
      { label: "Customers", href: "/#customers" },
      { label: "Security", href: "/#security" },
      { label: "Contact", href: `mailto:hello@syxoria.com` },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "FAQ", href: "/#faq" },
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/signup" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Legal notice", href: "/legal/notice" },
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Terms", href: "/legal/terms" },
    ],
  },
];
