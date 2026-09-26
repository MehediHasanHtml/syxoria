import type { Metadata } from "next";
import { Sprout } from "lucide-react";
import { ArrowNudge, ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col px-5 py-6 sm:px-10">
      <Logo />
      <main id="main" className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center text-center">
        <span className="grid size-12 place-items-center rounded-full border border-accent-line bg-accent-soft text-accent">
          <Sprout className="size-5" aria-hidden="true" />
        </span>
        <p className="eyebrow mt-8">Error 404</p>
        <h1 className="mt-3 text-headline font-medium text-fg">
          Nothing has grown <span className="font-display font-light text-accent-strong">here yet.</span>
        </h1>
        <p className="mt-5 text-fg-2">The page you’re looking for doesn’t exist or has moved.</p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/">
            Back to home <ArrowNudge />
          </ButtonLink>
          <ButtonLink href="/app" variant="outline">
            Open workspace
          </ButtonLink>
        </div>
      </main>
    </div>
  );
}
