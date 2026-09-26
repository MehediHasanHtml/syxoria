import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/cn";

export type SubmitState = { status: "idle" | "saving" | "saved" | "error"; message?: string };

/** Inline, announced form result (success / error). */
export function FormStatus({ state, className }: { state: SubmitState; className?: string }) {
  return (
    <p role="status" aria-live="polite" className={cn("flex min-h-5 items-center gap-1.5 text-[13px]", className)}>
      {state.status === "saving" && <span className="text-fg-3">{state.message ?? "Saving…"}</span>}
      {state.status === "saved" && (
        <>
          <CircleCheck className="size-4 text-positive" aria-hidden="true" />
          <span className="text-positive">{state.message ?? "Changes saved."}</span>
        </>
      )}
      {state.status === "error" && (
        <>
          <CircleAlert className="size-4 text-negative" aria-hidden="true" />
          <span className="text-negative">{state.message ?? "Something went wrong."}</span>
        </>
      )}
    </p>
  );
}
