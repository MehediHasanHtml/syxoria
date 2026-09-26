"use client";

import Link from "next/link";
import { ArrowRight, Menu as MenuIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ArrowNudge, ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/cn";
import { marketingNav } from "@/lib/site-config";

/**
 * Immersive header: transparent over the hero, gains a surface + hairline once
 * the page scrolls (sentinel IntersectionObserver — no scroll listener).
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

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
          "fixed inset-x-0 top-0 z-(--z-header) transition-[background-color,border-color,backdrop-filter] duration-500 ease-out-soft",
          scrolled ? "border-b border-line/70 bg-canvas/80 backdrop-blur-xl" : "border-b border-transparent bg-transparent",
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
              {marketingNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="relative rounded-md px-3.5 py-2 text-[13.5px] text-fg-2 transition-colors duration-200 hover:text-fg after:absolute after:inset-x-3.5 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-accent/70 after:transition-transform after:duration-300 after:ease-out-soft hover:after:scale-x-100"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden rounded-md px-3 py-2 text-[13.5px] text-fg-2 transition-colors hover:text-fg sm:block">
              Sign in
            </Link>
            {/* wrapper owns responsive visibility so it never fights the button's display */}
            <span className="hidden sm:block">
              <ButtonLink href="/signup" size="sm" variant={scrolled ? "primary" : "outline"}>
                Get started
                <ArrowNudge />
              </ButtonLink>
            </span>
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
              {marketingNav.map((item, i) => (
                <li key={item.href} className="mobile-sheet-item" style={{ transitionDelay: `${80 + i * 40}ms` }}>
                  <Link href={item.href} onClick={() => setOpen(false)} className="group flex items-center justify-between gap-4 py-4 font-display text-lg tracking-tight text-fg-2 transition-colors hover:text-fg">
                    {item.label}
                    <ArrowRight className="size-4 text-fg-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="grid gap-2 p-5">
            <ButtonLink href="/signup" size="lg" onClick={() => setOpen(false)}>
              Get started
              <ArrowNudge />
            </ButtonLink>
            <ButtonLink href="/login" size="lg" variant="outline" onClick={() => setOpen(false)}>
              Sign in
            </ButtonLink>
          </div>
        </div>
      </dialog>
    </>
  );
}
