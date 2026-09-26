"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { ArrowNudge, ButtonLink } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import type { BillingCycle, PricingPlan } from "@/types";

export function PricingTable({ plans }: { plans: PricingPlan[] }) {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  return (
    <div>
      <div className="flex justify-center">
        <Tabs
          label="Billing cycle"
          value={cycle}
          onValueChange={setCycle}
          items={[
            { value: "monthly", label: "Monthly" },
            {
              value: "yearly",
              label: (
                <>
                  Yearly <span className="text-[11px] text-accent">−17%</span>
                </>
              ),
            },
          ]}
        />
      </div>
      <ul className="mt-12 grid gap-4 lg:grid-cols-3 lg:gap-0">
        {plans.map((plan) => {
          const price = plan.price[cycle];
          return (
            <li
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-xl border p-7 transition-colors duration-300 sm:p-8",
                plan.highlighted
                  ? "z-[1] border-line-strong bg-surface shadow-float lg:-my-4 lg:py-12"
                  : "border-line bg-canvas-2/60 hover:border-line-strong lg:first:rounded-r-none lg:first:border-r-0 lg:last:rounded-l-none lg:last:border-l-0",
              )}
            >
              {plan.highlighted && (
                <>
                  <span aria-hidden="true" className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
                  <span className="absolute right-6 top-6 rounded-sm border border-accent-line bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-strong">
                    Most chosen
                  </span>
                </>
              )}
              <h3 className="text-lg font-medium text-fg">{plan.name}</h3>
              <p className="mt-2 min-h-10 text-sm text-fg-3">{plan.description}</p>
              <p className="mt-8 flex items-baseline gap-2">
                {price === null ? (
                  <span className="text-4xl font-medium tracking-tight text-fg">Custom</span>
                ) : (
                  <>
                    <span key={`${plan.id}-${cycle}`} className="tabular animate-fade-in text-5xl font-medium tracking-tight text-fg">
                      {formatCurrency(price, !Number.isInteger(price))}
                    </span>
                    <span className="text-sm text-fg-3">excl. VAT / month</span>
                  </>
                )}
              </p>
              <p className="mt-2 h-5 text-xs text-fg-3">{price !== null && cycle === "yearly" ? "Billed yearly" : price !== null ? "Billed monthly · cancel anytime" : "Annual agreement"}</p>
              <ButtonLink href={plan.cta.href} variant={plan.highlighted ? "primary" : "outline"} size="lg" className="mt-8 w-full">
                {plan.cta.label}
                <ArrowNudge />
              </ButtonLink>
              <ul className="mt-8 space-y-3 border-t border-line pt-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-fg-2">
                    <Check className={cn("mt-0.5 size-4 shrink-0", plan.highlighted ? "text-accent" : "text-fg-3")} aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
