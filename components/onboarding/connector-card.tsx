"use client";

import { Check, Eye } from "lucide-react";
import { forwardRef, type CSSProperties } from "react";
import { IntegrationLogo } from "@/components/shared/integration-logo";
import { connections as copy } from "@/content/onboarding";
import { cn } from "@/lib/cn";
import type { ConnectorState, DataSource, SourceConnection } from "@/types";

/** A connection's state, in the one model every connector uses */
export const connectorState = (c: SourceConnection | undefined): ConnectorState => c?.status ?? "available";

type Props = {
  source: DataSource;
  state: ConnectorState;
  /** Connecting: the step in progress · connected: what it holds · error/reconnect: what happened */
  note?: string;
  onConnect: () => void;
  onCancel: () => void;
  onDisconnect: () => void;
  /** "card" in the recommended grid · "row" in the list of more integrations */
  variant?: "card" | "row";
  className?: string;
  style?: CSSProperties;
};

/**
 * One tool, in any of its states — available, connecting, connected, error, reconnect. Its
 * logo tile is where information leaves for the Core once it connects (`data-flow-from`).
 * Styles: "CONNECTORS" in globals.css.
 */
export const ConnectorCard = forwardRef<HTMLDivElement, Props>(function ConnectorCard({ source, state, note, onConnect, onCancel, onDisconnect, variant = "card", className, style }, ref) {
  const line = state === "available" ? source.purpose : note ?? source.purpose;
  const action =
    state === "available" ? (
      <button type="button" onClick={onConnect} className="onb-connector__action" aria-label={`Connect ${source.name}`}>
        {source.kind === "file" ? "Choose file" : "Connect"}
      </button>
    ) : state === "connecting" ? (
      <button type="button" onClick={onCancel} disabled={source.kind === "file"} className="onb-connector__action onb-connector__action--quiet" aria-label={`Cancel connecting ${source.name}`}>
        Cancel
      </button>
    ) : state === "connected" ? (
      <button type="button" onClick={onDisconnect} className="onb-connector__action onb-connector__action--quiet onb-connector__disconnect" aria-label={`Disconnect ${source.name}`}>
        Disconnect
      </button>
    ) : (
      <button type="button" onClick={onConnect} className="onb-connector__action" aria-label={`${state === "reconnect" ? "Reconnect" : "Try connecting"} ${source.name} again`}>
        {state === "reconnect" ? "Reconnect" : "Try again"}
      </button>
    );

  return (
    <div ref={ref} data-state={state} data-variant={variant} className={cn("onb-connector group/conn relative flex flex-col", className)} style={style}>
      <div className="flex items-start gap-3.5">
        <span data-flow-from="" aria-hidden="true" className="onb-connector__tile grid size-10 shrink-0 place-items-center rounded-lg">
          {source.logo ? <IntegrationLogo id={source.logo} size={20} /> : null}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[14.5px] text-fg">
            {source.name}
            <ConnectorBadge state={state} />
          </p>
          <p className={cn("mt-1 text-[12.5px] leading-snug", state === "connected" ? "text-fg-2" : state === "error" || state === "reconnect" ? "text-fg-2" : "text-fg-3")} aria-live={state === "connecting" ? "polite" : undefined}>
            {line}
            {state === "connected" && <span className="text-fg-3"> · read-only</span>}
          </p>
        </div>
        {variant === "row" && <div className="shrink-0 self-center">{action}</div>}
      </div>

      {variant === "card" && (
        <div className="mt-auto flex items-center justify-between gap-3 pl-[3.375rem] pt-3.5">
          {/* exactly what will be read — before and after connecting */}
          <span className="onb-see">
            <button type="button" className="inline-flex items-center gap-1.5 rounded-sm text-[12px] text-fg-3 transition-colors hover:text-fg" aria-describedby={`see-${source.id}`}>
              <Eye className="size-3.5" aria-hidden="true" />
              What it reads
            </button>
            <span role="tooltip" id={`see-${source.id}`} className="onb-connector__reads">
              {source.reads.join(" · ")}
            </span>
          </span>
          {action}
        </div>
      )}

      {/* connecting: a slow line of the Core's light along the card's edge */}
      {state === "connecting" && <span aria-hidden="true" className="onb-connecting absolute inset-x-4 bottom-0 h-px" />}
    </div>
  );
});

function ConnectorBadge({ state }: { state: ConnectorState }) {
  if (state === "available") return <span className="sr-only">{copy.states.available}</span>;
  if (state === "connected")
    return (
      <span className="onb-pop inline-flex items-center gap-1 text-[11.5px] text-accent-strong">
        <span aria-hidden="true" className="grid size-3.5 place-items-center rounded-full bg-accent-soft ring-1 ring-accent-line">
          <Check className="size-2" strokeWidth={3.5} />
        </span>
        {copy.states.connected}
      </span>
    );
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11.5px]", state === "connecting" ? "text-fg-3" : "text-fg-2")}>
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", state === "connecting" ? "animate-pulse-soft bg-accent-strong" : "bg-caution/80")} />
      {copy.states[state]}
    </span>
  );
}
