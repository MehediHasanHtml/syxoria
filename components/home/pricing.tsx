"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useId, useState } from "react";
import { pricingIntro } from "@/content/home";
import { pricing } from "@/content/marketing";
import { cn } from "@/lib/cn";
import type { PricingPlan } from "@/types";
import { PRICING_SECTION } from "./chapters";
import { ScrollReveal } from "./scroll-reveal";

type Billing = "monthly" | "yearly";

const eur = (n: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n);

/**
 * 06 — Pricing: a destination of its own after the Core story. Plenty of air,
 * the three plans side by side (stacked on phones), one billing switch.
 */
export function Pricing() {
  const [billing, setBilling] = useState<Billing>("yearly");
  return (
    <section id={PRICING_SECTION.id} data-nav-start={PRICING_SECTION.id} data-nav-offset="0.5" aria-labelledby="pricing-title" className="relative py-28 sm:py-36 lg:py-44">
      <div className="container-story">
        <ScrollReveal as="header" className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-fg-3">{pricingIntro.eyebrow}</p>
          <h2 id="pricing-title" className="mt-6 font-display text-display font-light text-fg">
            {pricingIntro.titleLead} <em className="font-serif text-[1.08em] font-normal italic tracking-normal">{pricingIntro.titleAccent}</em>
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-[15px] leading-relaxed text-fg-2 sm:text-base">{pricing.body}</p>
          <BillingSwitch value={billing} onChange={setBilling} />
        </ScrollReveal>

        <ul className="mx-auto mt-14 grid max-w-lg gap-5 pt-4 sm:mt-16 md:max-w-none md:grid-cols-3 lg:gap-6">
          {pricing.plans.map((plan, i) => (
            <ScrollReveal as="li" key={plan.id} delay={i * 90}>
              <PricingCard plan={plan} billing={billing} />
            </ScrollReveal>
          ))}
        </ul>

        <ScrollReveal>
          <ul className="mt-12 grid gap-x-8 gap-y-3 border-t border-line pt-8 text-[13px] text-fg-2 sm:grid-cols-2 lg:grid-cols-4">
            {pricingIntro.notes.map((n) => (
              <li key={n} className="flex items-center gap-2.5">
                <Check className="size-3.5 shrink-0 text-fg-3" aria-hidden="true" />
                {n}
              </li>
            ))}
          </ul>
        </ScrollReveal>
      </div>
    </section>
  );
}

function BillingSwitch({ value, onChange }: { value: Billing; onChange: (b: Billing) => void }) {
  const id = useId();
  const options: { id: Billing; label: string }[] = [
    { id: "monthly", label: pricingIntro.billing.monthly },
    { id: "yearly", label: pricingIntro.billing.yearly },
  ];
  return (
    <div className="mt-10 flex items-center justify-center gap-4">
      <div role="radiogroup" aria-label="Billing period" className="relative inline-grid grid-cols-2 rounded-full border border-line bg-surface/50 p-1">
        {/* the sliding thumb */}
        <span
          aria-hidden="true"
          className={cn("absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-fg transition-transform duration-300 ease-out-soft", value === "yearly" && "translate-x-full")}
        />
        {options.map((o) => (
          <button
            key={o.id}
            id={`${id}-${o.id}`}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            onClick={() => onChange(o.id)}
            className={cn("relative z-10 h-9 rounded-full px-5 text-[13px] transition-colors duration-300", value === o.id ? "text-canvas" : "text-fg-2 hover:text-fg")}
          >
            {o.label}
          </button>
        ))}
      </div>
      <span className={cn("text-[12px] text-accent transition-opacity duration-300", value === "yearly" ? "opacity-100" : "opacity-50")}>{pricingIntro.billing.save}</span>
    </div>
  );
}

export function PricingCard({ plan, billing }: { plan: PricingPlan; billing: Billing }) {
  const price = billing === "yearly" ? plan.price.yearly : plan.price.monthly;
  const custom = price === null;
  const featured = plan.highlighted;
  return (
    <article
      aria-labelledby={`plan-${plan.id}`}
      className={cn(
        "group relative flex h-full flex-col rounded-2xl border p-6 transition-[transform,border-color,background-color] duration-500 ease-out-soft hover:-translate-y-1 sm:p-8 md:p-6 lg:p-8",
        featured ? "border-line-strong bg-surface" : "border-line bg-canvas-2/60 hover:border-line-strong",
      )}
    >
      <div className="flex h-7 items-center justify-between gap-3">
        <h3 id={`plan-${plan.id}`} className="text-[12px] font-medium uppercase tracking-[0.24em] text-fg">
          {plan.name}
        </h3>
        {featured && <span className="rounded-full border border-accent-line px-2.5 py-1 text-[10.5px] uppercase tracking-[0.18em] text-accent">{pricingIntro.highlight}</span>}
      </div>
      <p className="mt-3 text-[14px] md:min-h-[2.75rem] leading-relaxed text-fg-2">{plan.description}</p>

      <div className="mt-8 md:min-h-[5.5rem]">
        {custom ? (
          <p className="font-display text-[2.75rem] font-extralight leading-none tracking-tight text-fg">Custom</p>
        ) : (
          <p className="flex items-baseline gap-2">
            <span key={billing} className="tabular animate-fade-in font-display text-[2.75rem] font-extralight leading-none tracking-tight text-fg lg:text-[3.25rem]">
              {eur(price)}
            </span>
            <span className="text-sm text-fg-3">/ month</span>
          </p>
        )}
        <p className="mt-3 text-[12.5px] text-fg-3">
          {custom
            ? "Tailored to your organisation"
            : billing === "yearly"
              ? `${eur(price * 12)} billed yearly`
              : `Billed monthly${plan.price.yearly !== null ? ` · ${eur(plan.price.yearly)}/mo yearly` : ""}`}
        </p>
      </div>

      <Link
        href={plan.cta.href}
        className={cn(
          "mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-medium transition-[background-color,border-color,gap] duration-300 ease-out-soft hover:gap-3",
          featured ? "bg-fg text-canvas hover:bg-white" : "border border-line-strong text-fg hover:border-fg-3",
        )}
      >
        {plan.cta.label}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>

      <ul className="mt-8 grid gap-3 border-t border-line pt-7 text-[13.5px] text-fg-2">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <Check className={cn("mt-0.5 size-3.5 shrink-0", featured ? "text-accent" : "text-fg-3")} aria-hidden="true" />
            {f}
          </li>
        ))}
      </ul>
    </article>
  );
}
