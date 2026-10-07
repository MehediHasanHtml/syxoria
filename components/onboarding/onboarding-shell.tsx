import type { CSSProperties, ReactNode } from "react";
import { OnboardingProgress } from "./onboarding-progress";

export type ShellLayout = "focus" | "split" | "briefing";

type Props = {
  layout: ShellLayout;
  /** How much room "What Syxoria knows" takes: wide while it details, narrow once it understands */
  density?: "detailed" | "compact";
  bar: Parameters<typeof OnboardingProgress>[0];
  /** How awake the system is, 0–1: the environment's light follows it */
  awake: number;
  announcement: string;
  memory?: ReactNode;
  strip?: ReactNode;
  children: ReactNode;
};

/**
 * The one environment every onboarding moment happens in — one desktop viewport per moment. Its
 * layout morphs rather than navigates: focused and centred while Syxoria knows nothing; the
 * conversation beside its memory once it knows the company; one wide sheet for the briefing.
 */
export function OnboardingShell({ layout, density = "detailed", bar, awake, announcement, memory, strip, children }: Props) {
  return (
    <div data-theme="dark" data-layout={layout} data-density={density} className="onb relative min-h-dvh bg-canvas text-fg" style={{ "--awake": awake } as CSSProperties}>
      <a
        href="#onb-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-(--z-toast) focus:rounded-md focus:bg-fg focus:px-3 focus:py-2 focus:text-sm focus:text-canvas"
      >
        Skip to content
      </a>
      {/* the environment's light: almost nothing at first, a little more as Syxoria wakes */}
      <div aria-hidden="true" className="onb-atmosphere pointer-events-none fixed inset-0" />
      <OnboardingProgress {...bar} />

      <div className="relative pt-16">
        {layout === "split" && strip && <div className="sticky top-16 z-(--z-sticky) lg:hidden">{strip}</div>}
        <div className="onb-stage mx-auto w-full max-w-[86rem] px-(--gutter)">
          <main id="onb-main" tabIndex={-1} className="onb-conversation min-w-0 outline-none">
            {children}
          </main>
          {layout === "split" && memory && <div className="onb-memory-slot hidden lg:block">{memory}</div>}
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
