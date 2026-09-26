import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { growthCurve } from "@/content/marketing";
import { ProgressCurve } from "./progress-curve";

export function GrowthCurveSection() {
  return (
    <section id="progress" aria-labelledby="progress-title" className="relative overflow-hidden py-20 sm:py-32">
      <div className="container-page">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <SectionHeading id="progress-title" className="lg:col-span-7" eyebrow={growthCurve.eyebrow} title={growthCurve.title} accent={growthCurve.accent} />
          <Reveal delay={100} className="lg:col-span-5">
            <p className="text-lead text-fg-2">{growthCurve.body}</p>
            <p className="mt-5 flex items-center gap-5 text-xs text-fg-3">
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className="h-0.5 w-5 rounded-full bg-accent" /> With Syxoria
              </span>
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className="w-5 border-t border-dashed border-fg-3" /> Linear effort
              </span>
            </p>
          </Reveal>
        </div>
        <ProgressCurve className="mt-14 sm:mt-20" points={growthCurve.points} baseline={growthCurve.baseline} stages={growthCurve.stages} />
      </div>
    </section>
  );
}
