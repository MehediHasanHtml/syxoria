import { BrainCircuit, Clock3, Compass, MessagesSquare, Target, Zap, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ModuleKey } from "@/types";

export const moduleIcons: Record<ModuleKey, LucideIcon> = {
  lume: MessagesSquare,
  nexo: BrainCircuit,
  volt: Zap,
  kairo: Target,
  zento: Clock3,
  orion: Compass,
};

type ModuleIconProps = {
  module: ModuleKey;
  className?: string;
  /** Render inside a square frame. Use `tone`/`size` (not className) to vary the frame. */
  framed?: boolean;
  tone?: "default" | "accent";
  size?: "sm" | "md";
};

export function ModuleIcon({ module, className, framed = false, tone = "default", size = "md" }: ModuleIconProps) {
  const Icon = moduleIcons[module];
  if (!framed) return <Icon aria-hidden="true" className={cn("size-4", className)} strokeWidth={1.5} />;
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-md border bg-surface-2",
        size === "md" ? "size-8" : "size-7",
        tone === "accent" ? "border-accent-line text-accent" : "border-line text-fg-2",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-4" strokeWidth={1.5} />
    </span>
  );
}
