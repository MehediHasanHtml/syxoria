import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SourceConnection } from "@/types";

/**
 * A source's state, in words and one mark: neutral when not connected, a slow line of light
 * while connecting, the Core's emerald once connected, a calm dot (never alarm red) on error.
 */
export function ConnectionStatus({ connection }: { connection: SourceConnection | undefined }) {
  const status = connection?.status ?? "idle";
  return (
    <span className={cn("inline-flex items-center gap-2 text-[12.5px]", status === "connected" ? "text-accent-strong" : status === "error" ? "text-fg-2" : "text-fg-3")}>
      {status === "connected" ? (
        <span aria-hidden="true" className="onb-pop grid size-4 place-items-center rounded-full bg-accent-soft ring-1 ring-accent-line">
          <Check className="size-2.5" strokeWidth={3} />
        </span>
      ) : (
        <span
          aria-hidden="true"
          className={cn("size-1.5 rounded-full", status === "connecting" ? "animate-pulse-soft bg-accent-strong" : status === "error" ? "bg-negative/70" : "bg-white/20")}
        />
      )}
      {status === "connected" ? "Connected" : status === "connecting" ? "Connecting" : status === "error" ? "Not connected" : "Not connected"}
    </span>
  );
}
