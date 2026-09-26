import { cn } from "@/lib/cn";

const sizes = { xs: "size-6 text-[10px]", sm: "size-7 text-[11px]", md: "size-9 text-xs", lg: "size-12 text-sm" };

/** Initials avatar. Swap for <Image> when user photos exist. */
export function Avatar({
  initials,
  name,
  size = "sm",
  className,
}: {
  initials: string;
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={name}
      title={name}
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full border border-line-strong bg-gradient-to-b from-surface-3 to-surface font-medium tracking-wide text-fg-2",
        sizes[size],
        className,
      )}
    >
      {initials}
    </span>
  );
}

export function AvatarStack({ people, max = 3, size = "xs" }: { people: { initials: string; name: string }[]; max?: number; size?: keyof typeof sizes }) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <div className="flex -space-x-1.5">
      {shown.map((p) => (
        <Avatar key={p.name} initials={p.initials} name={p.name} size={size} className="ring-2 ring-canvas-2" />
      ))}
      {rest > 0 && (
        <span className={cn("inline-grid place-items-center rounded-full bg-surface-3 text-fg-3 ring-2 ring-canvas-2", sizes[size])}>+{rest}</span>
      )}
    </div>
  );
}
