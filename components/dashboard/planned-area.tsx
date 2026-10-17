import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { ReactNode } from "react";
import { planned as copy, type PlannedArea } from "@/content/areas";

/**
 * An area of the workspace that arrives in a later phase, said for what it is: its name, what it
 * will hold, and where its information can already be seen. Never a fake screen. `children` adds
 * what already exists for it (a section switcher, a read only preview from the briefing).
 * Styles: "PLANNED AREA" in globals.css, in the home's language.
 */
export function PlannedAreaView({ area, nav, children }: { area: Pick<PlannedArea, "title" | "phase" | "intro" | "holds" | "today">; nav?: ReactNode; children?: ReactNode }) {
  return (
    <div className="hm pa">
      <header className="hm-head">
        <div className="min-w-0">
          <p className="bd-label">
            <span aria-hidden="true" className="pa-dot" />
            {copy.phase(area.phase)}
          </p>
          <h1 className="hm-title">{area.title}</h1>
          <p className="hm-lead">{area.intro}</p>
        </div>
      </header>
      {nav}
      <div className="pa-grid">
        {area.holds.length > 0 && (
          <section aria-label={copy.holds} className="hm-panel">
            <div className="hm-panel__head">
              <h2 className="bd-label">{copy.holds}</h2>
            </div>
            <ul className="pa-holds">
              {area.holds.map((h) => (
                <li key={h}>
                  <Check aria-hidden="true" className="size-3.5" strokeWidth={2} />
                  {h}
                </li>
              ))}
            </ul>
          </section>
        )}
        {area.today && area.today.length > 0 && (
          <section aria-label={copy.today} className="hm-panel">
            <div className="hm-panel__head">
              <h2 className="bd-label">{copy.today}</h2>
            </div>
            <ul className="pa-links">
              {area.today.map((t) => (
                <li key={t.href + t.label}>
                  <Link href={t.href} className="hm-link">
                    {t.label}
                    <ArrowRight aria-hidden="true" className="size-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      {children}
    </div>
  );
}
