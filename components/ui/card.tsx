import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardProps = ComponentProps<"div"> & {
  /** interactive: hover elevation · selected: accent outline · disabled: dimmed */
  interactive?: boolean;
  selected?: boolean;
  disabled?: boolean;
};

export function Card({ interactive, selected, disabled, className, ...props }: CardProps) {
  return (
    <div
      aria-disabled={disabled || undefined}
      className={cn(
        "relative rounded-lg border bg-surface/70 shadow-panel",
        selected ? "border-accent-line" : "border-line",
        interactive &&
          "transition-[transform,border-color,background-color] duration-300 ease-out-soft hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
  as: Heading = "h2",
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  as?: "h2" | "h3";
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6", className)}>
      <div className="min-w-0">
        <Heading className="text-[15px] font-medium tracking-tight text-fg">{title}</Heading>
        {description && <p className="mt-1 text-[13px] leading-snug text-fg-3">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("px-5 pb-5 pt-4 sm:px-6 sm:pb-6", className)} {...props} />;
}
