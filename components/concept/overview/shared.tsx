"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AutomationProvider } from "@/components/dashboard/automation/automation-provider";
import { overviewConcepts as copy } from "@/content/overview-concepts";
import type { OverviewConceptData } from "./data";

export * from "@/components/dashboard/overview/parts";

/* ---------- The six spaces ---------- */

export type SpaceId = keyof typeof copy.spaces;
/** Where each space lives today: the current pages, until the chosen direction reaches them */
export const SPACES: { id: SpaceId; href: string }[] = [
  { id: "overview", href: "" },
  { id: "business", href: "/app/business/sales" },
  { id: "assistant", href: "/app/assistant" },
  { id: "actions", href: "/app/actions" },
  { id: "workspace", href: "/app/documents" },
  { id: "settings", href: "/app/settings" },
];

/* ---------- The frame: holds, review links ---------- */

/** What both concepts sit in: the same automation holds as the workspace, and the review strip on top */
export function ConceptFrame({ automation, first, children }: { automation: OverviewConceptData["automation"]; first: boolean; children: ReactNode }) {
  return (
    <AutomationProvider ctx={automation}>
      <ReviewStrip first={first} />
      {children}
    </AutomationProvider>
  );
}

export function ReviewStrip({ first, toggle = true }: { first: boolean; toggle?: boolean }) {
  const path = usePathname();
  const q = first ? "?first=1" : "";
  const items = [
    { href: "/concept/overview/command-center", tag: copy.review.a, name: copy.review.aName },
    { href: "/concept/overview/living", tag: copy.review.b, name: copy.review.bName },
  ];
  return (
    <nav className="cx-review" aria-label={copy.review.label}>
      <span className="cx-review__label">{copy.review.label}</span>
      {items.map((i) => (
        <Link key={i.href} href={i.href + q} aria-current={path === i.href ? "page" : undefined} className="cx-review__item">
          <span>{i.tag}</span>
          <span className="cx-review__name">{i.name}</span>
        </Link>
      ))}
      <Link href="/concept/overview" aria-current={path === "/concept/overview" ? "page" : undefined} className="cx-review__item">
        {copy.review.notes}
      </Link>
      {toggle && (
        <Link href={path + (first ? "" : "?first=1")} className="cx-review__item cx-review__toggle">
          {first ? copy.review.usual : copy.review.first}
        </Link>
      )}
      <span className="cx-review__note">{copy.review.simulated}</span>
    </nav>
  );
}

