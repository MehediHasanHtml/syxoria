import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Syxoria mark: a prism (the "dimension") enclosing a branching stem —
 * the tree/growth motif reduced to three strokes.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={cn("size-7", className)}>
      <path d="M16 3.5 29 27.5H3L16 3.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M16 27.5V17.2M16 17.2 10.4 11M16 17.2 21.6 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="16" cy="17.2" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function Logo({ className, href = "/", compact = false }: { className?: string; href?: string; compact?: boolean }) {
  return (
    <Link
      href={href}
      aria-label="Syxoria — home"
      className={cn("group inline-flex items-center gap-3 text-fg transition-opacity hover:opacity-85", className)}
    >
      <LogoMark className="transition-transform duration-500 ease-out-soft group-hover:-translate-y-px" />
      {!compact && <span className="text-[15px] font-medium uppercase tracking-brand">Syxoria</span>}
    </Link>
  );
}
