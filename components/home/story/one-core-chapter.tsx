import { oneCore } from "@/content/home";
import { COL, Eyebrow, LOW, Layer, Title } from "./primitives";

/**
 * 02 — How the brain works. The words stay low and short; the three steps
 * themselves are shown on the Core, at the zone where each happens (see
 * CoreOverlay). Here, only their progress: one line per step, filling as the
 * visitor scrolls (`data-step`).
 */
export function OneCoreChapter() {
  return (
    <Layer name="one-core" className={LOW} labelledBy="one-core-title">
      <div className={COL}>
        <Eyebrow data-r index={2}>
          {oneCore.eyebrow}
        </Eyebrow>
        <Title data-r data-split id="one-core-title" lead={oneCore.titleLead} accent={oneCore.titleAccent} className="mt-5 short:mt-3" />
        <ol data-r aria-label="How it works" className="mt-7 grid max-w-[24rem] grid-cols-3 gap-3 short:mt-4 sm:gap-5">
          {oneCore.steps.map((s, i) => (
            <li key={s.title} data-step className="opacity-40">
              <span className="relative block h-px overflow-hidden bg-line">
                <span data-step-line className="absolute inset-0 origin-left scale-x-0 bg-fg" />
              </span>
              <p className="mt-2.5 flex items-baseline gap-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-fg">
                <span className="tabular text-fg-3">{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </p>
              {/* the full sentence is shown on the Core, at its zone; kept here for assistive tech */}
              <p className="sr-only">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </Layer>
  );
}
