import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SystemBar } from "./system-bar";

export type ShellLayout = "focus" | "split" | "briefing";

type Props = {
  layout: ShellLayout;
  bar: Parameters<typeof SystemBar>[0];
  /** How awake the system is, 0–1: the environment's light follows it */
  awake: number;
  announcement: string;
  memory?: ReactNode;
  strip?: ReactNode;
  children: ReactNode;
};

/**
 * The one environment every onboarding moment happens in. Its layout morphs rather than
 * navigates: focused and centred while the system knows nothing; the conversation beside the
 * system's memory once it knows the company; one wide sheet for the briefing.
 */
export function OnboardingShell({ layout, bar, awake, announcement, memory, strip, children }: Props) {
  return (
    <div data-theme="dark" data-layout={layout} className="onb relative min-h-dvh bg-canvas text-fg" style={{ "--awake": awake } as CSSProperties}>
      <a
        href="#onb-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-(--z-toast) focus:rounded-md focus:bg-fg focus:px-3 focus:py-2 focus:text-sm focus:text-canvas"
      >
        Skip to content
      </a>
      {/* the environment's light: almost nothing at first, a little more as the system wakes */}
      <div aria-hidden="true" className="onb-atmosphere pointer-events-none fixed inset-0" />
      <SystemBar {...bar} />

      <div className="relative pt-16">
        {layout === "split" && strip && <div className="sticky top-16 z-(--z-sticky) lg:hidden">{strip}</div>}
        <div className={cn("onb-stage mx-auto w-full max-w-[84rem] px-(--gutter)")}>
          <main id="onb-main" tabIndex={-1} className="onb-conversation min-w-0 outline-none">
            {children}
          </main>
          {layout === "split" && memory && <div className="hidden lg:block">{memory}</div>}
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
