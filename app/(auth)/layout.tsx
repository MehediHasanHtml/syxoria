import type { ReactNode } from "react";
import Link from "next/link";
import { LivingTree } from "@/components/brand/living-tree";
import { Logo } from "@/components/shared/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
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
        <LivingTree growth={0.86} className="absolute inset-x-8 bottom-32 top-10" />
        <p className="absolute inset-x-0 bottom-12 mx-auto max-w-sm text-center font-display text-2xl font-light leading-snug text-fg-3">
          Every company grows from the same place: <span className="text-fg">its roots.</span>
        </p>
      </aside>
    </div>
  );
}
