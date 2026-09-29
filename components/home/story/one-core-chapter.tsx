import { oneCore } from "@/content/home";
import { COL, Eyebrow, LEFT, Layer, Title } from "./primitives";

/**
 * 02 — What problem it solves and how it works. As the visitor scrolls the
 * Core wakes, and the three steps light up one after another (`data-step`).
 */
export function OneCoreChapter() {
  return (
    <Layer name="one-core" className={LEFT}>
      <div className={COL}>
        <Eyebrow data-r>{oneCore.eyebrow}</Eyebrow>
        <div data-r className="mt-6 short:mt-3">
          <Title lead={oneCore.titleLead} accent={oneCore.titleAccent} />
        </div>
        <p data-r className="mt-5 max-w-[26rem] text-[15px] leading-relaxed text-fg-2 short:hidden">
          {oneCore.body}
        </p>
        <ol data-r className="mt-8 grid grid-cols-3 gap-4 short:mt-4 side:max-w-[27rem] sm:gap-6">
          {oneCore.steps.map((s, i) => (
            <li key={s.title} data-step className="opacity-30">
              <span className="relative block h-px overflow-hidden bg-line">
                <span data-step-line className="absolute inset-0 origin-left scale-x-0 bg-fg-2" />
              </span>
              <p className="mt-3 flex items-baseline gap-2 text-[13px] text-fg">
                <span className="tabular text-[11px] text-fg-3">{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </p>
              <p className="mt-1.5 text-[12.5px] leading-snug text-fg-3 max-sm:hidden short:hidden">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </Layer>
  );
}
