import type { ReactNode } from "react";
import Link from "next/link";
import { GrowthTree } from "@/components/marketing/growth-tree";
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
      <aside aria-hidden="true" className="relative hidden overflow-hidden border-l border-line bg-canvas-2 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_45%,rgb(214_168_113/0.10),transparent)]" />
        <div className="gt absolute inset-x-0 top-1/2 mx-auto w-[min(90%,640px)] -translate-y-1/2" style={{ ["--grow" as string]: 0.7 }}>
          <GrowthTree idPrefix="auth-tree" showLabels={false} />
        </div>
        <p className="absolute inset-x-0 bottom-12 mx-auto max-w-sm text-center font-display font-light text-2xl leading-snug text-fg-2">
          Every company grows from the same place: <span className="font-normal text-accent-strong">its roots.</span>
        </p>
      </aside>
    </div>
  );
}
