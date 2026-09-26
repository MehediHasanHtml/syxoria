"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
};

/** Accessible switch (role="switch") with label + description. */
export function Switch({ checked, onCheckedChange, label, description, disabled, className }: SwitchProps) {
  const id = useId();
  return (
    <div className={cn("flex items-start justify-between gap-6", disabled && "opacity-50", className)}>
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
        </label>
        {description && (
          <p id={`${id}-d`} className="mt-1 text-[13px] leading-snug text-fg-3">
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-d` : undefined}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-5.5 w-9.5 shrink-0 items-center rounded-full border transition-colors duration-200 ease-out-soft",
          checked ? "border-accent/60 bg-accent/80" : "border-line-strong bg-surface-3",
          "disabled:cursor-not-allowed",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "size-4 rounded-full bg-fg shadow transition-transform duration-200 ease-spring",
            checked ? "translate-x-[18px] bg-white" : "translate-x-[2px]",
          )}
        />
      </button>
    </div>
  );
}
