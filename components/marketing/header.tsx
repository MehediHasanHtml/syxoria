"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu as MenuIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useActiveSection } from "@/components/home/use-active-section";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/cn";
import { marketingNav } from "@/lib/site-config";

/**
 * Immersive header: transparent over the hero, gains a surface + hairline once
 * the page scrolls (sentinel IntersectionObserver — no scroll listener).
 * On the homepage, the link to the section being viewed is marked with the
 * Core's light (see useActiveSection).
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const section = useActiveSection();
  const home = usePathname() === "/";
  const isActive = (href: string) => home && section !== null && href === `/#${section}`;

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // Close the mobile sheet if the viewport grows to desktop.
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mql.matches && setOpen(false);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="absolute inset-x-0 top-0 h-6" />
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-(--z-header) transition-[background-color,border-color,backdrop-filter,opacity] duration-500 ease-out-soft",
          scrolled ? "border-b border-line/60 bg-canvas/75 backdrop-blur-xl" : "border-b border-transparent bg-transparent",
        )}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-10 focus:rounded-md focus:bg-fg focus:px-3 focus:py-2 focus:text-sm focus:text-canvas"
        >
          Skip to content
        </a>
        <div className="container-page flex h-(--header-h) items-center justify-between gap-6">
          <Logo />
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {marketingNav.map((item) => {
                const on = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={on ? "location" : undefined}
                      className={cn(
                        "relative block rounded-md px-3.5 py-2 text-[13.5px] transition-[color,text-shadow] duration-300 ease-out-soft",
                        // a fine line of the Core's light under the label: drawn faintly on hover, lit when current
                        "after:absolute after:inset-x-3.5 after:bottom-1 after:h-px after:origin-left after:rounded-full after:transition-[transform,background-color,box-shadow] after:duration-500 after:ease-out-soft",
                        on
                          ? "text-fg after:scale-x-100 after:bg-accent-strong after:shadow-[0_0_10px_1px_rgb(79_174_134/0.5)]"
                          : "text-fg-2 after:scale-x-0 after:bg-accent/55 hover:text-fg hover:[text-shadow:0_0_16px_rgb(79_174_134/0.35)] hover:after:scale-x-100",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden rounded-md px-3 py-2 text-[13.5px] text-fg-2 transition-colors hover:text-fg sm:block">
              Sign in
            </Link>
            {/* wrapper owns responsive visibility so it never fights the button's display */}
            <Link
              href="/signup"
              className="hidden h-9 items-center rounded-full bg-fg px-4 text-[13px] font-medium text-canvas transition-colors hover:bg-white sm:inline-flex"
            >
              Start free
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              className="grid size-10 place-items-center rounded-md text-fg-2 transition-colors hover:bg-white/5 hover:text-fg lg:hidden"
            >
              <MenuIcon className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile navigation — native modal dialog (focus trap + Esc for free) */}
      <dialog
        ref={dialogRef}
        aria-label="Menu"
        onClose={() => setOpen(false)}
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        className="mobile-sheet m-0 ml-auto h-dvh max-h-none w-full max-w-sm bg-canvas-2 p-0 text-fg sm:border-l sm:border-line"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-(--header-h) items-center justify-between px-5">
            <Logo />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="grid size-10 place-items-center rounded-md text-fg-2 hover:bg-white/5 hover:text-fg"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 pt-4">
            <ul className="divide-y divide-line border-y border-line">
              {marketingNav.map((item, i) => {
                const on = isActive(item.href);
                return (
                  <li key={item.href} className="mobile-sheet-item" style={{ transitionDelay: `${80 + i * 40}ms` }}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={on ? "location" : undefined}
                      className={cn("group flex items-center justify-between gap-4 py-4 font-display text-lg tracking-tight transition-colors hover:text-fg", on ? "text-fg" : "text-fg-2")}
                    >
                      <span className="flex items-center gap-3">
                        {/* the current section: a point of the Core's light */}
                        <span aria-hidden="true" className={cn("size-1.5 rounded-full transition-[background-color,box-shadow] duration-300", on ? "bg-accent-strong shadow-[0_0_8px_rgb(79_174_134/0.7)]" : "bg-line-strong")} />
                        {item.label}
                      </span>
                      <ArrowRight className={cn("size-4 transition-[transform,color] duration-300 group-hover:translate-x-0.5 group-hover:text-accent", on ? "text-accent" : "text-fg-3")} aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="grid gap-2 p-5">
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="inline-flex h-12 items-center justify-center rounded-full bg-fg text-sm font-medium text-canvas"
            >
              Start free
            </Link>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="inline-flex h-12 items-center justify-center rounded-full border border-line-strong text-sm text-fg"
            >
              Sign in
            </Link>
          </div>
        </div>
      </dialog>
    </>
  );
}
