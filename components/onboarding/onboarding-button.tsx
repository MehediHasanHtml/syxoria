import { ArrowRight } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Props = ComponentProps<"button"> & {
  /** Working: the label stays, a line of light runs under it */
  busy?: boolean;
  /** "primary": bone on dark — the one obvious next step. "emerald": the final step into the product. */
  tone?: "primary" | "emerald";
};

/**
 * The onboarding's call to action — deliberately not the landing page's stone button: a clean,
 * quiet slab with one arrow, so the next step is obvious without spectacle. Styles: "ONBOARDING
 * BUTTON" in globals.css.
 */
export function OnbButton({ busy, tone = "primary", className, children, disabled, type = "button", ...rest }: Props) {
  return (
    <button type={type} disabled={disabled || busy} aria-busy={busy || undefined} data-tone={tone} className={cn("onb-btn", className)} {...rest}>
      <span className="onb-btn__label">{children}</span>
      <ArrowRight aria-hidden="true" className="onb-btn__arrow size-4" />
      {busy && <span aria-hidden="true" className="onb-btn__progress" />}
    </button>
  );
}
