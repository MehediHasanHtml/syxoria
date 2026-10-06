import Link from "next/link";
import { Logo, LogoMark } from "@/components/shared/logo";
import { cn } from "@/lib/cn";
import { CoreMark } from "./core-mark";

type Props = {
  states: { id: string; word: string; on: boolean }[];
  word: string;
  level: number;
  working: boolean;
  email: string | null;
};

/**
 * The top of the environment: the brand, and the system itself — its Core, the word for what
 * it is now (Unknown → … → Ready) and a quiet line of marks for the states it has reached.
 * No step numbers: the system's state is the progress.
 */
export function SystemBar({ states, word, level, working, email }: Props) {
  // "Unknown" is where everything starts: the line is empty there, full at "Ready"
  const progress = (states.filter((s) => s.on).length - 1) / (states.length - 1);
  return (
    <header className="onb-bar fixed inset-x-0 top-0 z-(--z-header) border-b border-white/[0.06] bg-canvas/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[90rem] items-center gap-4 px-(--gutter)">
        <Logo className="hidden sm:inline-flex" />
        <Link href="/" aria-label="Syxoria — home" className="text-fg sm:hidden">
          <LogoMark />
        </Link>

        <div className="mx-auto flex items-center gap-3 sm:absolute sm:left-1/2 sm:-translate-x-1/2">
          <CoreMark level={level} working={working} className="size-8" />
          <div className="min-w-[6.5rem]">
            <p className="font-label text-[0.625rem] uppercase leading-none tracking-(--label-tracking) text-fg-3">System</p>
            <p key={word} className="onb-word mt-1 text-[13.5px] leading-none text-fg">
              {word}
            </p>
          </div>
          <ol aria-label="What the system has become" className="flex items-center gap-1">
            {states.map((s) => (
              <li key={s.id} title={s.word} className={cn("h-px w-2.5 rounded-full transition-colors duration-700 sm:w-3.5", s.on ? "bg-accent-strong" : "bg-white/15")}>
                <span className="sr-only">
                  {s.word}: {s.on ? "reached" : "not yet"}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <p className="ml-auto hidden max-w-[14rem] truncate text-[13px] text-fg-3 md:block">{email ?? ""}</p>
      </div>
      {/* the system's progress, as a hairline of its light along the bar's edge */}
      <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-px origin-left bg-[linear-gradient(90deg,transparent,var(--color-accent)_40%,var(--color-accent-strong))] transition-transform duration-1000 ease-out-soft" style={{ transform: `scaleX(${progress})` }} />
    </header>
  );
}
