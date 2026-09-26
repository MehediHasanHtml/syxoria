import { CircleAlert, Lock, Sprout } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "@/components/ui/spinner";

type StateProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
};

function StateFrame({
  icon,
  title,
  description,
  action,
  className,
  compact,
  tone = "neutral",
  role,
}: StateProps & { icon: ReactNode; tone?: "neutral" | "negative" | "accent"; role?: "alert" | "status" }) {
  return (
    <div
      role={role}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-3 px-4 py-8" : "gap-4 px-6 py-16",
        className,
      )}
    >
      <div
        className={cn(
          "grid size-11 place-items-center rounded-full border [&_svg]:size-[18px]",
          tone === "negative" && "border-negative/30 bg-negative-soft text-negative",
          tone === "accent" && "border-accent-line bg-accent-soft text-accent",
          tone === "neutral" && "border-line-strong bg-surface-2 text-fg-2",
        )}
      >
        {icon}
      </div>
      <div className="max-w-sm">
        <p className="text-[15px] font-medium text-fg">{title}</p>
        {description && <p className="mt-1.5 text-[13px] leading-relaxed text-fg-3">{description}</p>}
      </div>
      {action && <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

/** Nothing here yet. The seedling reinforces the growth story. */
export function EmptyState(props: StateProps & { icon?: ReactNode }) {
  return <StateFrame icon={props.icon ?? <Sprout aria-hidden="true" />} {...props} role="status" />;
}

export function ErrorState(props: StateProps) {
  return <StateFrame icon={<CircleAlert aria-hidden="true" />} tone="negative" role="alert" {...props} />;
}

export function LockedState(props: StateProps) {
  return <StateFrame icon={<Lock aria-hidden="true" />} tone="accent" {...props} />;
}

export function LoadingState({ label = "Loading", className }: { label?: string; className?: string }) {
  return (
    <div role="status" className={cn("flex items-center justify-center gap-3 py-16 text-sm text-fg-3", className)}>
      <Spinner />
      <span>{label}…</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("skeleton", className)} />;
}
