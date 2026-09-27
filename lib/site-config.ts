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
  contactEmail: "hello@syxoria.com",
  /**
   * Product film (MP4/WebM URL). While `null`, the homepage plays a preview
   * sequence built from real product screenshots.
   */
  productFilm: null as string | null,
} as const;

export type NavLink = { label: string; href: string };

export const marketingNav: NavLink[] = [
  { label: "Evolution", href: "/#evolution" },
  { label: "Progression", href: "/#progression" },
  { label: "Product", href: "/#product" },
];

/** The footer is one quiet line: the essentials, nothing to scan. */
export const footerNav: NavLink[] = [
  { label: "Workspace", href: "/app" },
  { label: "Contact", href: "mailto:hello@syxoria.com" },
  { label: "Legal notice", href: "/legal/notice" },
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Terms", href: "/legal/terms" },
];
