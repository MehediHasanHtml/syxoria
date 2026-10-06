import { useId } from "react";
import { cn } from "@/lib/cn";

/** The fissures, from the heart outwards — lit one by one as the system learns. */
const FISSURES = [
  "M50 52 L45 41 L47 31 L41 19",
  "M50 52 L62 46 L70 39 L81 35",
  "M50 52 L63 59 L71 68 L81 71",
  "M50 52 L54 65 L50 77 L54 87",
  "M50 52 L38 60 L30 69 L21 73",
  "M50 52 L37 48 L27 45 L15 47",
  "M50 52 L56 41 L60 29 L67 20",
];
const ROCK = "M50 6 L71 11 L88 29 L94 51 L87 73 L69 89 L45 94 L24 86 L10 67 L7 43 L19 21 L33 10 Z";
const FACETS = "M33 10 L41 30 L19 21 M71 11 L62 30 L88 29 M94 51 L76 54 L87 73 M45 94 L49 76 L24 86 M7 43 L27 50 L10 67 M41 30 L62 30 L76 54 L49 76 L27 50 Z";

/**
 * The Core, as the onboarding carries it: a small faceted stone whose fissures light up
 * — deep emerald — as the system comes to know the company. `level` 0–7 is how many are
 * lit; `working` makes its light breathe while it reads.
 */
export function CoreMark({ level, working = false, className }: { level: number; working?: boolean; className?: string }) {
  const id = useId().replace(/:/g, "");
  const awake = Math.max(0, Math.min(1, level / FISSURES.length));
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={cn("core-mark overflow-visible", working && "core-mark--working", className)} style={{ ["--awake" as string]: awake }}>
      <defs>
        <radialGradient id={`${id}-stone`} cx="36%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#323334" />
          <stop offset="48%" stopColor="#161718" />
          <stop offset="100%" stopColor="#060607" />
        </radialGradient>
        <radialGradient id={`${id}-heart`}>
          <stop offset="0%" stopColor="#d6f5e6" stopOpacity="0.95" />
          <stop offset="30%" stopColor="var(--core-light)" stopOpacity="0.85" />
          <stop offset="100%" stopColor="var(--core-light)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-aura`}>
          <stop offset="40%" stopColor="var(--core-light)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--core-light)" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <clipPath id={`${id}-clip`}>
          <path d={ROCK} />
        </clipPath>
      </defs>
      <circle className="core-mark__aura" cx="50" cy="52" r="62" fill={`url(#${id}-aura)`} />
      <path d={ROCK} fill={`url(#${id}-stone)`} stroke="rgb(255 255 255 / 0.07)" strokeWidth="0.8" strokeLinejoin="round" />
      <g clipPath={`url(#${id}-clip)`}>
        <path d={FACETS} fill="none" stroke="rgb(255 255 255 / 0.045)" strokeWidth="0.7" strokeLinejoin="round" />
        {FISSURES.map((d, i) => (
          <path key={`c${i}`} d={d} fill="none" stroke="rgb(0 0 0 / 0.75)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {FISSURES.map((d, i) => (
          <g key={i} className="core-mark__fissure" data-lit={i < level || undefined} style={{ transitionDelay: `${(i % 3) * 60}ms` }}>
            <path d={d} fill="none" stroke="var(--core-light)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${id}-glow)`} />
            <path d={d} fill="none" stroke="#9fe0c2" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}
        <circle className="core-mark__heart" cx="50" cy="52" r="16" fill={`url(#${id}-heart)`} />
      </g>
    </svg>
  );
}
