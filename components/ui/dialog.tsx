"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  /** Visually hide the header (title stays available to screen readers). */
  hideHeader?: boolean;
  className?: string;
};

const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-5xl" };

/**
 * Built on the native <dialog> element: focus trapping, Esc to close,
 * inert background and top-layer rendering come from the platform.
 */
export function Dialog({ open, onClose, title, description, children, footer, size = "md", hideHeader, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // Click on the backdrop (the dialog element itself) closes.
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn(
        "dialog-motion m-auto max-h-[min(90dvh,56rem)] w-[calc(100%-2rem)] overflow-visible bg-transparent p-0 text-fg",
        sizes[size],
      )}
    >
      <div
        className={cn(
          "flex max-h-[min(90dvh,56rem)] flex-col overflow-hidden rounded-xl border border-line bg-canvas-2 shadow-float",
          className,
        )}
      >
        <div className={cn("flex items-start justify-between gap-4 px-6 pt-6", hideHeader && "absolute right-0 top-0 z-10 p-3")}>
          <div className={cn(hideHeader && "sr-only")}>
            <h2 id={titleId} className="text-lg font-medium tracking-tight">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1.5 text-sm leading-relaxed text-fg-2">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-2 -mt-1 grid size-9 shrink-0 place-items-center rounded-md text-fg-3 transition-colors duration-200 hover:bg-white/5 hover:text-fg"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className={cn("min-h-0 flex-1 overflow-y-auto", hideHeader ? "" : "px-6 pb-6 pt-5")}>{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-canvas-3/60 px-6 py-4">{footer}</div>}
      </div>
    </dialog>
  );
}
