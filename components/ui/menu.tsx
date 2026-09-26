"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode, type Ref } from "react";
import { cn } from "@/lib/cn";

export type MenuItem =
  | { type?: "item"; label: string; icon?: ReactNode; href?: string; onSelect?: () => void; disabled?: boolean; danger?: boolean }
  | { type: "separator" }
  | { type: "label"; label: string };

type MenuProps = {
  /** Render prop so the trigger can be any styled button. */
  trigger: (props: {
    ref: Ref<HTMLButtonElement>;
    "aria-haspopup": "menu";
    "aria-expanded": boolean;
    "aria-controls": string;
    onClick: () => void;
    onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
  }) => ReactNode;
  items: MenuItem[];
  align?: "start" | "end";
  side?: "bottom" | "top";
  className?: string;
  header?: ReactNode;
};

/** WAI-ARIA menu button: arrow keys, Home/End, Esc, outside click. */
export function Menu({ trigger, items, align = "end", side = "bottom", className, header }: MenuProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const focusItem = (index: number) => {
    const els = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])');
    if (!els?.length) return;
    els[(index + els.length) % els.length].focus();
  };

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !triggerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  function onMenuKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const els = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? []);
    const idx = els.indexOf(document.activeElement as HTMLElement);
    const moves: Record<string, () => void> = {
      ArrowDown: () => focusItem(idx + 1),
      ArrowUp: () => focusItem(idx - 1),
      Home: () => focusItem(0),
      End: () => focusItem(-1),
      Escape: () => close(),
    };
    if (e.key === "Tab") return close(false);
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      move();
    }
  }

  const itemClass = (danger?: boolean) =>
    cn(
      "flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-[13px] outline-none transition-colors",
      "focus-visible:bg-white/[0.06] hover:bg-white/[0.05] aria-disabled:opacity-40 aria-disabled:pointer-events-none [&_svg]:size-4 [&_svg]:text-fg-3",
      danger ? "text-negative" : "text-fg-2 hover:text-fg focus-visible:text-fg",
    );

  return (
    <div className={cn("relative", className)}>
      {trigger({
        ref: triggerRef,
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-controls": id,
        onClick: () => {
          setOpen((o) => !o);
          if (!open) requestAnimationFrame(() => focusItem(0));
        },
        onKeyDown: (e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
            requestAnimationFrame(() => focusItem(e.key === "ArrowDown" ? 0 : -1));
          }
        },
      })}
      <div
        ref={menuRef}
        id={id}
        role="menu"
        hidden={!open}
        onKeyDown={onMenuKeyDown}
        className={cn(
          "absolute z-(--z-overlay) min-w-56 origin-top animate-fade-in rounded-lg border border-line bg-canvas-2/95 p-1.5 shadow-float backdrop-blur-md",
          align === "end" ? "right-0" : "left-0",
          side === "bottom" ? "top-full mt-2" : "bottom-full mb-2",
        )}
      >
        {header}
        {items.map((item, i) => {
          if (item.type === "separator") return <div key={i} role="separator" className="my-1.5 h-px bg-line" />;
          if (item.type === "label")
            return (
              <div key={i} className="px-2.5 pb-1 pt-2 eyebrow">
                {item.label}
              </div>
            );
          const content = (
            <>
              {item.icon}
              <span>{item.label}</span>
            </>
          );
          return item.href ? (
            <Link
              key={i}
              href={item.href}
              role="menuitem"
              tabIndex={-1}
              aria-disabled={item.disabled || undefined}
              className={itemClass(item.danger)}
              onClick={() => close(false)}
            >
              {content}
            </Link>
          ) : (
            <button
              key={i}
              type="button"
              role="menuitem"
              tabIndex={-1}
              aria-disabled={item.disabled || undefined}
              className={itemClass(item.danger)}
              onClick={() => {
                item.onSelect?.();
                close();
              }}
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
