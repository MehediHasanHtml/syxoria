import Link from "next/link";
import { SyxoriaCore } from "@/components/brand/syxoria-core";
import { Logo, LogoMark } from "@/components/shared/logo";
import type { CoreState } from "@/lib/core/core-states";
import { cn } from "@/lib/cn";

type Props = {
  core: { state: CoreState; word: string | null; intensity?: number; pulse?: number };
  /** The Core is elsewhere on the screen (sign-in, the understanding moment): the bar leaves it there */
  coreHere: boolean;
  milestones: { id: string; word: string; on: boolean }[];
  email: string | null;
};

/**
 * The top of the environment: the brand, and Syxoria itself — its Core, the one word for what it
 * is now, and a quiet line of marks for what it has become. Before sign-in there is nothing to
 * report: no word, no line. No step numbers: what Syxoria has become is the progress.
 */
export function OnboardingProgress({ core, coreHere, milestones, email }: Props) {
  const awake = Boolean(core.word);
  return (
    <header className="onb-bar fixed inset-x-0 top-0 z-(--z-header) bg-canvas/70 backdrop-blur-xl">
      <div className="mx-auto grid h-16 max-w-[90rem] grid-cols-[1fr_auto_1fr] items-center gap-4 px-(--gutter)">
        <div className="flex items-center">
          <Logo className="hidden sm:inline-flex" />
          <Link href="/" aria-label="Syxoria — home" className="text-fg sm:hidden">
            <LogoMark />
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {coreHere ? (
            <span data-core-target="" className="grid place-items-center">
              <SyxoriaCore state={core.state} detail="mark" intensity={core.intensity} pulse={core.pulse} vtName="syx-core" className="size-9" />
            </span>
          ) : (
            awake && <span aria-hidden="true" className="size-9" />
          )}
          {awake && (
            <div className="flex flex-col gap-1.5">
              <p key={core.word} className="onb-word text-[13px] leading-none text-fg" aria-live="polite">
                {core.word}
              </p>
              <ol aria-label="What Syxoria has become" className="flex items-center gap-1">
                {milestones.map((m) => (
                  <li key={m.id} title={m.word} className={cn("h-px w-3 rounded-full transition-colors duration-700 sm:w-4", m.on ? "bg-accent-strong" : "bg-white/15")}>
                    <span className="sr-only">
                      {m.word}: {m.on ? "yes" : "not yet"}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <p className="hidden justify-self-end truncate text-[13px] text-fg-3 md:block md:max-w-[14rem]">{email ?? ""}</p>
      </div>
    </header>
  );
}
