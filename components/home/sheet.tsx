"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * A panel sliding in from the right — native modal <dialog>, so focus is
 * trapped, Esc closes it and focus returns to what opened it. A click on the
 * backdrop closes it too.
 */
export function Sheet({ open, onClose, label, header, children }: { open: boolean; onClose: () => void; label: string; header?: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="sheet-motion m-0 ml-auto h-dvh max-h-none w-full max-w-[30rem] bg-canvas-2 p-0 text-fg sm:border-l sm:border-line"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-(--header-h) shrink-0 items-center justify-between gap-4 border-b border-line px-6">
          <div className="min-w-0 text-[11px] uppercase tracking-[0.28em] text-fg-3">{header}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-fg-2 transition-colors hover:border-fg-3 hover:text-fg"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-10 pt-8">{children}</div>
      </div>
    </dialog>
  );
}
