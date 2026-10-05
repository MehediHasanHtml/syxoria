import type { ReactNode } from "react";
import Link from "next/link";
import { CoreEmblem } from "@/components/brand/core-emblem";
import { Logo } from "@/components/shared/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    // the entrance to the product: dark, like the product, whichever theme the website shows
    <div data-theme="dark" className="grid min-h-dvh bg-canvas text-fg lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col px-5 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <Logo />
          <Link href="/" className="text-[13px] text-fg-3 transition-colors hover:text-fg">
            Back to website
          </Link>
        </div>
        <main id="main" className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          {children}
        </main>
        <p className="text-xs text-fg-3">
          © 2026 Syxoria ·{" "}
          <Link href="/legal/privacy" className="hover:text-fg">
            Privacy
          </Link>{" "}
          ·{" "}
          <Link href="/legal/terms" className="hover:text-fg">
            Terms
          </Link>
        </p>
      </div>
      <aside aria-hidden="true" className="relative hidden overflow-hidden border-l border-line bg-canvas lg:block">
        <CoreEmblem className="absolute inset-x-0 bottom-28 top-0" />
        <p className="absolute inset-x-0 bottom-12 mx-auto max-w-sm text-center font-display text-2xl font-light leading-snug text-fg-3">
          Every company runs on one thing: <span className="font-serif text-[1.1em] italic text-fg">its core.</span>
        </p>
      </aside>
    </div>
  );
}
