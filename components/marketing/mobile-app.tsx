import { Smartphone } from "lucide-react";
import { LogoMark } from "@/components/shared/logo";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { siteConfig } from "@/lib/site-config";

function StoreBadge({ store, href }: { store: "ios" | "android"; href: string | null }) {
  const label = store === "ios" ? "App Store" : "Google Play";
  const caption = href ? (store === "ios" ? "Download on the" : "Get it on") : "Coming soon to";
  const content = (
    <>
      <Smartphone className="size-5 text-fg-2" strokeWidth={1.5} aria-hidden="true" />
      <span className="text-left">
        <span className="block text-[10px] uppercase tracking-label text-fg-3">{caption}</span>
        <span className="block text-sm font-medium text-fg">{label}</span>
      </span>
    </>
  );
  const cls = "inline-flex h-14 items-center gap-3 rounded-md border border-line-strong px-4 transition-colors";
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${cls} hover:border-fg-3 hover:bg-white/[0.03]`}>
      {content}
    </a>
  ) : (
    <span className={`${cls} cursor-default opacity-80`} aria-label={`${label} — coming soon`}>
      {content}
    </span>
  );
}

export function MobileApp() {
  return (
    <section aria-labelledby="mobile-title" className="relative overflow-hidden border-t border-line py-20 sm:py-28">
      <div className="container-page grid items-center gap-14 lg:grid-cols-2">
        <Reveal className="relative order-2 mx-auto w-full max-w-[290px] lg:order-1">
          <div aria-hidden="true" className="absolute inset-x-[-40%] top-1/3 h-1/2 bg-[radial-gradient(closest-side,rgb(214_168_113/0.14),transparent)]" />
          {/* Phone frame with live, simplified UI */}
          <div className="relative rotate-[-4deg] rounded-[2.4rem] border border-line-strong bg-canvas p-2.5 shadow-float transition-transform duration-700 ease-out-soft hover:rotate-0">
            <div className="overflow-hidden rounded-[1.9rem] border border-line bg-canvas-2">
              <div className="flex items-center justify-between px-5 pb-2 pt-3 text-[10px] text-fg-2" aria-hidden="true">
                <span className="tabular">9:41</span>
                <span className="h-4 w-16 rounded-full bg-canvas" />
                <span>●●●</span>
              </div>
              <div className="space-y-3 px-4 pb-6 pt-2" aria-hidden="true">
                <div className="flex items-center justify-between">
                  <LogoMark className="size-5 text-fg" />
                  <span className="grid size-6 place-items-center rounded-full border border-line-strong text-[9px] text-fg-2">ML</span>
                </div>
                <p className="pt-2 font-display font-light text-2xl leading-tight text-fg">
                  Good morning, <span className="font-normal text-accent-strong">Maël.</span>
                </p>
                <p className="text-[11px] text-fg-3">3 things need you today</p>
                {["4 invoices ready to follow up", "Atelier Rive kickoff to confirm", "Thursday is overloaded"].map((t, i) => (
                  <div key={t} className="flex items-center gap-2.5 rounded-lg border border-line bg-surface/70 p-3">
                    <span className={i === 0 ? "size-1.5 rounded-full bg-accent" : "size-1.5 rounded-full bg-fg-3"} />
                    <span className="text-[11px] text-fg-2">{t}</span>
                  </div>
                ))}
                <div className="rounded-lg border border-line bg-surface/70 p-3">
                  <p className="text-[10px] text-fg-3">Recovered this month</p>
                  <p className="tabular mt-1 text-lg font-medium text-fg">€18,420</p>
                  <svg viewBox="0 0 100 24" className="mt-1 h-6 w-full" preserveAspectRatio="none">
                    <path d="M0 22 C 20 20, 35 18, 50 13 S 80 4, 100 2" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
        <div className="order-1 lg:order-2">
          <SectionHeading id="mobile-title" eyebrow="Mobile" title="Your workspace," accent="wherever you are." body="Approve automations, answer what matters and follow your numbers from your phone. Everything else keeps running quietly." />
          <Reveal delay={140} className="mt-8 flex flex-wrap gap-3">
            <StoreBadge store="ios" href={siteConfig.appLinks.ios} />
            <StoreBadge store="android" href={siteConfig.appLinks.android} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
