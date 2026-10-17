"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type KeyboardEvent } from "react";
import { WsHead } from "@/components/dashboard/ws/kit";
import type { Period, PeriodId } from "@/types/workspace";

export type BusinessSection = "sales" | "marketing" | "finance" | "goals";

const SECTIONS: { id: BusinessSection; label: string; lead: string }[] = [
  { id: "sales", label: "Sales", lead: "Revenue, the pipeline and the deals that need you, from first contact to signature." },
  { id: "marketing", label: "Marketing", lead: "Campaigns, channels and what brings you the clients worth having." },
  { id: "finance", label: "Finance", lead: "Revenue, expenses, cash and what is owed to you, with what to do about it." },
  { id: "goals", label: "Goals & KPIs", lead: "Your objectives, how far each has come, and what would close the gap." },
];

/** The reporting period, kept in the address so it follows from one category to the next */
export function usePeriod(initial: PeriodId) {
  const router = useRouter();
  const pathname = usePathname();
  const [period, setPeriod] = useState<PeriodId>(initial);
  const choose = (p: PeriodId) => {
    setPeriod(p);
    router.replace(`${pathname}?period=${p}`, { scroll: false });
  };
  return [period, choose] as const;
}

/**
 * Business Management's one frame: the four categories as quiet secondary navigation under the
 * heading, and the reporting period beside it. Each category keeps its own interface below.
 */
export function BusinessHeader({ section, periods, period, onPeriod }: { section: BusinessSection; periods: Period[]; period: PeriodId; onPeriod: (p: PeriodId) => void }) {
  const current = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];
  const onKey = (e: KeyboardEvent) => {
    const go = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!go) return;
    e.preventDefault();
    const i = periods.findIndex((p) => p.id === period);
    const next = periods[(i + go + periods.length) % periods.length];
    onPeriod(next.id);
    document.getElementById(`period-${next.id}`)?.focus();
  };
  return (
    <>
      <WsHead eyebrow="Business Management" title={current.label} lead={current.lead}>
        <div role="radiogroup" aria-label="Reporting period" className="ws-seg" onKeyDown={onKey}>
          {periods.map((p) => (
            <button
              key={p.id}
              id={`period-${p.id}`}
              type="button"
              role="radio"
              aria-checked={p.id === period}
              tabIndex={p.id === period ? 0 : -1}
              onClick={() => onPeriod(p.id)}
              className="ws-seg__item"
            >
              {p.label}
            </button>
          ))}
        </div>
      </WsHead>
      <nav aria-label="Business Management" className="ws-subnav">
        {SECTIONS.map((s) => (
          <Link key={s.id} href={`/app/business/${s.id}?period=${period}`} aria-current={s.id === section ? "page" : undefined}>
            {s.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
