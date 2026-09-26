import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "./reveal";

/** Editorial section heading: gold hairline + eyebrow, H2, optional lead. */
export function SectionHeading({
  eyebrow,
  title,
  accent,
  body,
  align = "left",
  id,
  className,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  /** Optional second line set in the editorial serif */
  accent?: ReactNode;
  body?: ReactNode;
  align?: "left" | "center";
  id?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Reveal className={cn(align === "center" && "mx-auto text-center", "max-w-3xl", className)}>
      {eyebrow && (
        <div className={cn("flex items-center gap-3", align === "center" && "justify-center")}>
          <span aria-hidden="true" className="h-px w-8 bg-accent" />
          <p className="eyebrow">{eyebrow}</p>
        </div>
      )}
      <h2 id={id} className="mt-6 text-headline font-medium text-fg text-balance">
        {title}
        {accent && (
          <>
            {" "}
            <span className="block font-display font-light text-accent-strong">{accent}</span>
          </>
        )}
      </h2>
      {body && <p className={cn("mt-6 max-w-2xl text-lead text-fg-2 text-pretty", align === "center" && "mx-auto")}>{body}</p>}
      {children}
    </Reveal>
  );
}
