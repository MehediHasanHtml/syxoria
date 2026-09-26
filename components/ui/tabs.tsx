"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TabItem<T extends string> = { value: T; label: ReactNode; disabled?: boolean };

type TabsProps<T extends string> = {
  items: TabItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  label: string;
  /** "segmented" = pill control; "underline" = editorial tabs */
  variant?: "segmented" | "underline";
  size?: "sm" | "md";
  /** When tabs control panels, pass the panel id prefix: panels must use `${idPrefix}-panel-${value}`. */
  idPrefix?: string;
  className?: string;
};

/**
 * WAI-ARIA tablist with roving tabindex, arrow/Home/End keys and a
 * sliding indicator (transform-only animation).
 */
export function Tabs<T extends string>({
  items,
  value,
  onValueChange,
  label,
  variant = "segmented",
  size = "md",
  idPrefix,
  className,
}: TabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ x: number; w: number } | null>(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const active = list.querySelector<HTMLElement>('[aria-selected="true"]');
      if (active) setIndicator({ x: active.offsetLeft, w: active.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => ro.disconnect();
  }, [value, items.length]);

  const enabled = items.filter((i) => !i.disabled);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const idx = enabled.findIndex((i) => i.value === value);
    let next: TabItem<T> | undefined;
    if (e.key === "ArrowRight") next = enabled[(idx + 1) % enabled.length];
    if (e.key === "ArrowLeft") next = enabled[(idx - 1 + enabled.length) % enabled.length];
    if (e.key === "Home") next = enabled[0];
    if (e.key === "End") next = enabled[enabled.length - 1];
    if (!next) return;
    e.preventDefault();
    onValueChange(next.value);
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLElement>(`[data-value="${next!.value}"]`)?.focus());
  }

  const segmented = variant === "segmented";

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        "relative inline-flex max-w-full items-center overflow-x-auto scrollbar-none",
        segmented ? "gap-0.5 rounded-md border border-line bg-canvas-2 p-0.5" : "gap-6 border-b border-line",
        className,
      )}
    >
      {indicator && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute left-0 transition-[transform,width] duration-300 ease-out-soft",
            segmented ? "inset-y-0.5 rounded-[5px] bg-surface-3 shadow-[0_1px_0_0_rgb(255_255_255/0.05)_inset]" : "-bottom-px h-px bg-fg",
          )}
          style={{ transform: `translateX(${indicator.x}px)`, width: indicator.w }}
        />
      )}
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            data-value={item.value}
            id={idPrefix ? `${idPrefix}-tab-${item.value}` : undefined}
            aria-controls={idPrefix ? `${idPrefix}-panel-${item.value}` : undefined}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onValueChange(item.value)}
            className={cn(
              "relative z-[1] inline-flex shrink-0 items-center gap-2 whitespace-nowrap font-medium transition-colors duration-200",
              "disabled:cursor-not-allowed disabled:opacity-40",
              segmented
                ? cn("rounded-[5px]", size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-[13px]")
                : cn("pb-3 pt-1", size === "sm" ? "text-[13px]" : "text-sm"),
              selected ? "text-fg" : "text-fg-3 hover:text-fg-2",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
