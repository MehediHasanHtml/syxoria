import { CircleAlert, CircleCheck } from "lucide-react";
import { cloneElement, isValidElement, useId, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type FieldState = "default" | "error" | "success";

const control =
  "w-full rounded-md border bg-canvas-2 px-3.5 text-sm text-fg placeholder:text-fg-3 " +
  "transition-[border-color,box-shadow,background-color] duration-200 ease-out-soft " +
  "hover:border-line-strong focus:border-fg-3 focus:bg-canvas-3 focus:outline-none focus:ring-4 focus:ring-white/[0.04] " +
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line";

const stateStyles: Record<FieldState, string> = {
  default: "border-line",
  error: "border-negative/60 hover:border-negative/80 focus:border-negative focus:ring-negative/10",
  success: "border-positive/45 hover:border-positive/60 focus:border-positive/70",
};

export function inputStyles(state: FieldState = "default", className?: string) {
  return cn(control, stateStyles[state], className);
}

export function Input({ state = "default", className, ...props }: ComponentProps<"input"> & { state?: FieldState }) {
  return <input className={inputStyles(state, cn("h-10", className))} aria-invalid={state === "error" || undefined} {...props} />;
}

export function Textarea({ state = "default", className, ...props }: ComponentProps<"textarea"> & { state?: FieldState }) {
  return (
    <textarea
      className={inputStyles(state, cn("min-h-24 resize-y py-2.5 leading-relaxed", className))}
      aria-invalid={state === "error" || undefined}
      {...props}
    />
  );
}

export function Select({ state = "default", className, children, ...props }: ComponentProps<"select"> & { state?: FieldState }) {
  return (
    <div className="relative">
      <select
        className={inputStyles(state, cn("h-10 appearance-none pr-9", className))}
        aria-invalid={state === "error" || undefined}
        {...props}
      >
        {children}
      </select>
      <svg viewBox="0 0 16 16" aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-3">
        <path d="M4.5 6.5 8 10l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

type FieldProps = {
  label: string;
  /** Rendered control; receives id / aria-describedby / state automatically. */
  children: ReactElement<{ id?: string; "aria-describedby"?: string; state?: FieldState }>;
  hint?: ReactNode;
  error?: string | null;
  success?: string | null;
  optional?: boolean;
  className?: string;
  labelAction?: ReactNode;
};

/**
 * Label + control + message. Wires accessibility (for/id, aria-describedby,
 * aria-invalid) so every form gets correct semantics for free.
 */
export function Field({ label, children, hint, error, success, optional, className, labelAction }: FieldProps) {
  const id = useId();
  const messageId = `${id}-msg`;
  const state: FieldState = error ? "error" : success ? "success" : "default";
  const message = error ?? success ?? hint;

  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        state,
        "aria-describedby": message ? messageId : undefined,
      })
    : children;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium text-fg">
          {label}
          {optional && <span className="ml-1.5 font-normal text-fg-3">Optional</span>}
        </label>
        {labelAction}
      </div>
      {control}
      {message && (
        <p
          id={messageId}
          aria-live={error ? "polite" : undefined}
          className={cn(
            "flex items-start gap-1.5 text-[13px] leading-snug",
            error ? "text-negative" : success ? "text-positive" : "text-fg-3",
          )}
        >
          {error && <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />}
          {!error && success && <CircleCheck className="mt-px size-3.5 shrink-0" aria-hidden="true" />}
          <span>{message}</span>
        </p>
      )}
    </div>
  );
}
