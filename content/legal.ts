/**
 * Legal pages — PLACEHOLDER copy. Replace with text reviewed by counsel
 * before launch. Kept as data so a CMS can supply it later.
 */
export type LegalDoc = { slug: string; title: string; updated: string; sections: { heading: string; body: string }[] };

export const legalDocs: LegalDoc[] = [
  {
    slug: "notice",
    title: "Legal notice",
    updated: "2026-09-01",
    sections: [
      { heading: "Publisher", body: "Syxoria SAS — company details, registered address and registration number to be provided." },
      { heading: "Hosting", body: "Hosting provider name and address to be provided." },
      { heading: "Contact", body: "hello@syxoria.com" },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy policy",
    updated: "2026-09-01",
    sections: [
      { heading: "What we collect", body: "Account information you provide, workspace content you connect, and technical data needed to operate the service." },
      { heading: "How we use it", body: "To provide and improve Syxoria. Workspace data is never used to train shared models." },
      { heading: "Where it lives", body: "In the EU by default, encrypted in transit and at rest." },
      { heading: "Your rights", body: "Access, rectification, erasure, portability and objection — contact privacy@syxoria.com." },
    ],
  },
  {
    slug: "terms",
    title: "Terms of service",
    updated: "2026-09-01",
    sections: [
      { heading: "The service", body: "Syxoria provides a workspace that connects your tools and helps automate operations." },
      { heading: "Your account", body: "You are responsible for activity in your workspace and for keeping credentials secure." },
      { heading: "Billing", body: "Plans are billed monthly or yearly, excluding VAT. You can cancel at any time." },
      { heading: "Liability", body: "Full terms to be provided before launch." },
    ],
  },
];
