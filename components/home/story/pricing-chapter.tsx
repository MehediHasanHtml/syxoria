"use client";

import { Check } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { pricingIntro } from "@/content/home";
import { pricing } from "@/content/marketing";
import { cn } from "@/lib/cn";
import { CoreButton } from "../core-button";
import { COL, Eyebrow, LEFT, Layer, Title } from "./primitives";

type Billing = "monthly" | "yearly";

const eur = (n: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n);

/**
 * 06 — Pricing, as the last scene of the story: the Core at rest in its
 * vitrine and, in front of it, one calm glass panel. One plan is shown at a
 * time (the most chosen first); switching plans or billing rolls the price
 * rather than swapping cards. A soft light follows the cursor across the glass.
 */
export function PricingChapter() {
  const [planId, setPlanId] = useState(() => pricing.plans.find((p) => p.highlighted)?.id ?? pricing.plans[0].id);
  const [billing, setBilling] = useState<Billing>("yearly");
  const index = pricing.plans.findIndex((p) => p.id === planId);
  const plan = pricing.plans[index];
  const price = billing === "yearly" ? plan.price.yearly : plan.price.monthly;
  const panel = useGlassLight<HTMLDivElement>();
  const groupId = useId();

  return (
    <Layer name="pricing" className={LEFT} labelledBy="pricing-title">
      <div className={COL}>
        <Eyebrow data-r>
          {pricingIntro.eyebrow}
        </Eyebrow>
        <Title data-r data-split id="pricing-title" lead={pricingIntro.titleLead} accent={pricingIntro.titleAccent} className="mt-5 side:text-headline short:mt-2 short:text-[1.6rem]" />

        <div data-r ref={panel} className="glass-panel pointer-events-auto relative mt-7 overflow-hidden rounded-[22px] border border-white/10 bg-canvas-2/60 p-2 backdrop-blur-xl short:mt-3">
          {/* the plans: a sliding thumb under the chosen one */}
          <div role="radiogroup" aria-label="Plan" className="relative grid grid-cols-3 rounded-[16px] bg-white/[0.035] p-1">
            <span
              aria-hidden="true"
              className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-[12px] bg-white/[0.09] shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] transition-transform duration-500 ease-out-soft"
              style={{ transform: `translateX(${index * 100}%)` }}
            />
            {pricing.plans.map((p) => (
              <button
                key={p.id}
                id={`${groupId}-${p.id}`}
                type="button"
                role="radio"
                aria-checked={p.id === planId}
                onClick={() => setPlanId(p.id)}
                className={cn(
                  "relative z-10 flex h-10 items-center justify-center gap-2 rounded-[12px] text-[13px] transition-colors duration-300",
                  p.id === planId ? "text-fg" : "text-fg-3 hover:text-fg-2",
                )}
              >
                {p.name}
                {p.highlighted && <span aria-label={pricingIntro.highlight} className="size-1 rounded-full bg-accent" />}
              </button>
            ))}
          </div>

          <div className="px-4 pb-4 pt-6 sm:px-5 short:pt-3">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div>
                <p className="flex items-baseline gap-2" aria-live="polite">
                  {price === null ? (
                    <span key="custom" className="animate-fade-in font-display text-[3.25rem] font-extralight leading-none tracking-[-0.04em] text-fg short:text-[2.5rem]">
                      Custom
                    </span>
                  ) : (
                    <>
                      <RollingNumber value={eur(price)} className="font-display text-[3.25rem] font-extralight leading-none tracking-[-0.04em] text-fg short:text-[2.5rem]" />
                      <span className="text-sm text-fg-3">/ month</span>
                    </>
                  )}
                </p>
                <p className="mt-2.5 text-[12.5px] text-fg-3">
                  {price === null
                    ? "Tailored to your organisation"
                    : billing === "yearly"
                      ? `${eur(price * 12)} billed yearly · excl. VAT`
                      : `Billed monthly · excl. VAT`}
                </p>
              </div>
              <BillingSwitch value={billing} onChange={setBilling} disabled={price === null} />
            </div>

            <p key={plan.id} className="mt-5 animate-fade-in text-[14px] leading-relaxed text-fg-2 short:hidden">
              {plan.description}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 short:mt-3">
              <CoreButton href={plan.cta.href}>
                <span key={plan.id} className="inline-block animate-fade-in">
                  {plan.cta.label}
                </span>
              </CoreButton>
              <span className="text-[12px] text-fg-3">{pricingIntro.notes[1]}</span>
            </div>

            <ul key={`f-${plan.id}`} className="mt-5 grid animate-fade-in grid-cols-1 gap-x-5 gap-y-2 border-t border-white/[0.07] pt-4 text-[12.5px] text-fg-2 max-sm:hidden sm:grid-cols-2 short:hidden">
              {plan.features.slice(0, 4).map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-fg-3" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p data-r className="mt-4 font-label text-label uppercase text-fg-3 max-sm:hidden short:hidden">
          {pricingIntro.notes[0]} · {pricingIntro.notes[2]}
        </p>
      </div>
    </Layer>
  );
}

function BillingSwitch({ value, onChange, disabled }: { value: Billing; onChange: (b: Billing) => void; disabled?: boolean }) {
  const options: { id: Billing; label: string }[] = [
    { id: "monthly", label: pricingIntro.billing.monthly },
    { id: "yearly", label: pricingIntro.billing.yearly },
  ];
  return (
    <div className={cn("flex items-center gap-3 transition-opacity duration-300", disabled && "pointer-events-none opacity-30")}>
      <div role="radiogroup" aria-label="Billing period" className="relative inline-grid grid-cols-2 rounded-full border border-white/10 p-0.5">
        <span
          aria-hidden="true"
          className="absolute inset-y-0.5 left-0.5 w-[calc(50%-0.125rem)] rounded-full bg-fg transition-transform duration-500 ease-out-soft"
          style={{ transform: value === "yearly" ? "translateX(100%)" : undefined }}
        />
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            disabled={disabled}
            onClick={() => onChange(o.id)}
            className={cn("relative z-10 h-8 rounded-full px-3.5 text-[12px] transition-colors duration-300", value === o.id ? "text-canvas" : "text-fg-2 hover:text-fg")}
          >
            {o.label}
          </button>
        ))}
      </div>
      <span className={cn("text-[11.5px] text-accent transition-opacity duration-300", value === "yearly" ? "opacity-100" : "opacity-40")}>{pricingIntro.billing.save}</span>
    </div>
  );
}

/** A price whose digits roll to their new value (each digit is a column 0–9). */
function RollingNumber({ value, className }: { value: string; className?: string }) {
  const chars = [...value];
  return (
    <span className={cn("tabular inline-flex overflow-hidden", className)} aria-label={value}>
      {chars.map((ch, i) => {
        // keyed from the right, so units stay units when the length changes
        const key = chars.length - i;
        if (!/\d/.test(ch))
          return (
            <span key={`s${key}`} aria-hidden="true">
              {ch}
            </span>
          );
        return (
          <span key={`d${key}`} aria-hidden="true" className="relative inline-block h-[1em] overflow-hidden leading-none">
            <span className="invisible">0</span>
            <span className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-700 ease-out-soft" style={{ transform: `translateY(${-Number(ch) * 10}%)` }}>
              {"0123456789".split("").map((d) => (
                <span key={d} className="block h-[1em] leading-none">
                  {d}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

/**
 * A soft light that follows the cursor across the glass — eased every frame
 * (never snapping to the pointer) and fading out when the cursor leaves.
 */
function useGlassLight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let x = 0.5;
    let y = 0;
    let o = 0;
    let tx = x;
    let ty = y;
    let to = 0;
    let raf = 0;
    const loop = () => {
      x += (tx - x) * 0.09;
      y += (ty - y) * 0.09;
      o += (to - o) * 0.07;
      el.style.setProperty("--gx", `${(x * 100).toFixed(2)}%`);
      el.style.setProperty("--gy", `${(y * 100).toFixed(2)}%`);
      el.style.setProperty("--go", o.toFixed(3));
      raf = Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(to - o) > 0.001 ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width;
      ty = (e.clientY - r.top) / r.height;
      to = 1;
      kick();
    };
    const leave = () => {
      to = 0;
      kick();
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);
  return ref;
}
