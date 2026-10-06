"use client";

import { ChevronDown, ShieldCheck } from "lucide-react";
import { useEffect, useRef } from "react";
import { CoreButton } from "@/components/home/core-button";
import { IntegrationLogo } from "@/components/shared/integration-logo";
import { Button } from "@/components/ui/button";
import { connections as copy } from "@/content/onboarding";
import { cn } from "@/lib/cn";
import { ServiceError } from "@/services/_client";
import { connectSource, disconnectSource, importFile, recommendedSources } from "@/services/onboarding";
import type { CompanyProfile, DataSource, SourceConnection } from "@/types";
import { ConnectionStatus } from "./connection-status";
import { Notice, QuietButton, rise, StageHeading } from "./primitives";

type Props = {
  company: CompanyProfile | null;
  sources: DataSource[];
  connections: Record<string, SourceConnection>;
  onChange: (id: string, connection: SourceConnection | null) => void;
  onContinue: () => void;
  onBack: () => void;
};

/**
 * Where the company's data lives. The system suggests the sources that matter for this kind of
 * company first; each one says what it is, why it helps, and exactly what will be read.
 */
export function IntegrationConnection({ company, sources, connections, onChange, onContinue, onBack }: Props) {
  const aborts = useRef(new Map<string, AbortController>());
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const pending = aborts.current;
    return () => pending.forEach((a) => a.abort());
  }, []);

  const suggested = recommendedSources(company);
  const first = sources.filter((s) => suggested.includes(s.id));
  const others = sources.filter((s) => !suggested.includes(s.id));
  const connected = Object.values(connections).filter((c) => c.status === "connected").length;
  const busy = Object.values(connections).some((c) => c.status === "connecting");

  async function connect(source: DataSource) {
    if (source.kind === "file") {
      fileInput.current?.click();
      return;
    }
    const abort = new AbortController();
    aborts.current.set(source.id, abort);
    onChange(source.id, { status: "connecting", note: `Opening ${source.name}…` });
    try {
      const { note } = await connectSource(source.id, (step) => onChange(source.id, { status: "connecting", note: step }), abort.signal);
      if (!abort.signal.aborted) onChange(source.id, { status: "connected", note });
    } catch (e) {
      if (abort.signal.aborted) return;
      onChange(source.id, { status: "error", note: e instanceof ServiceError ? e.message : `${source.name} didn’t answer. Nothing was shared.` });
    } finally {
      aborts.current.delete(source.id);
    }
  }

  function cancel(id: string) {
    aborts.current.get(id)?.abort();
    onChange(id, null);
  }

  async function disconnect(id: string) {
    onChange(id, null);
    await disconnectSource(id);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    onChange("file", { status: "connecting", note: `Reading ${file.name}…` });
    try {
      const { note } = await importFile(file, (step) => onChange("file", { status: "connecting", note: step }));
      onChange("file", { status: "connected", note });
    } catch (e) {
      onChange("file", { status: "error", note: e instanceof ServiceError ? e.message : "We couldn’t read this file. Nothing was imported." });
    }
  }

  const list = (items: DataSource[], offset: number) => (
    <ul className="border-t border-white/[0.07]">
      {items.map((s, i) => (
        <SourceRow
          key={s.id}
          source={s}
          index={offset + i}
          connection={connections[s.id]}
          onConnect={() => connect(s)}
          onCancel={() => cancel(s.id)}
          onDisconnect={() => disconnect(s.id)}
        />
      ))}
    </ul>
  );

  return (
    <div className="w-full max-w-[40rem]">
      <StageHeading lead={copy.ask.lead} accent={copy.ask.accent}>
        {copy.body}
      </StageHeading>

      <section aria-labelledby="src-suggested" className="onb-rise mt-10" style={rise(2)}>
        <h2 id="src-suggested" className="mb-3 flex items-center gap-2.5 font-label text-label uppercase text-fg-3">
          <span aria-hidden="true" className="h-px w-3 bg-accent" />
          {copy.recommended} {company?.sector ?? "company"} like {company?.name ?? "yours"}
        </h2>
        {list(first, 3)}
      </section>

      <section aria-labelledby="src-more" className="onb-rise mt-9" style={rise(3 + first.length)}>
        <h2 id="src-more" className="mb-3 font-label text-label uppercase text-fg-3">
          Also available
        </h2>
        {list(others, 4 + first.length)}
      </section>

      <input ref={fileInput} type="file" accept=".csv,.tsv,.xls,.xlsx" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => onFile(e.target.files?.[0])} />

      <div className="onb-rise mt-10 flex flex-col items-start gap-5" style={rise(5 + sources.length)}>
        {connected === 0 && (
          <p className="text-[13.5px] text-fg-3" role="status">
            {copy.empty}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <CoreButton onClick={onContinue} disabled={connected === 0 || busy}>
            {connected === 0 ? "Connect a source to continue" : `Learn from ${connected === 1 ? "this source" : `these ${connected} sources`}`}
          </CoreButton>
          <QuietButton onClick={onBack}>Back to your company</QuietButton>
        </div>
        {connected > 0 && <p className="text-[12.5px] text-fg-3">You can connect more sources later, from Settings.</p>}
      </div>
    </div>
  );
}

function SourceRow({
  source,
  index,
  connection,
  onConnect,
  onCancel,
  onDisconnect,
}: {
  source: DataSource;
  index: number;
  connection: SourceConnection | undefined;
  onConnect: () => void;
  onCancel: () => void;
  onDisconnect: () => void;
}) {
  const status = connection?.status ?? "idle";
  return (
    <li className="onb-rise relative border-b border-white/[0.07] py-4" style={rise(index)}>
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-lg border bg-white/[0.02] transition-[border-color,box-shadow] duration-700",
            status === "connected" ? "border-accent-line shadow-[0_0_18px_-6px_var(--core-glow)]" : "border-white/[0.08]",
          )}
        >
          {source.logo ? <IntegrationLogo id={source.logo} size={20} /> : null}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14.5px] text-fg">
            {source.name}
            <ConnectionStatus connection={connection} />
          </p>
          <p className={cn("mt-1 text-[13px] leading-snug", status === "connected" ? "text-fg-2" : "text-fg-3")} aria-live={status === "connecting" ? "polite" : undefined}>
            {status === "idle" || status === "error" ? source.purpose : connection?.note}
            {status === "connected" && <span className="text-fg-3"> · read-only</span>}
          </p>
        </div>
        <div className="shrink-0">
          {status === "idle" && (
            <Button size="sm" variant="secondary" onClick={onConnect} aria-label={`Connect ${source.name}`}>
              {source.kind === "file" ? "Choose file" : "Connect"}
            </Button>
          )}
          {status === "connecting" && (
            <Button size="sm" variant="ghost" onClick={onCancel} aria-label={`Cancel connecting ${source.name}`} disabled={source.kind === "file"}>
              Cancel
            </Button>
          )}
          {status === "connected" && (
            <Button size="sm" variant="ghost" onClick={onDisconnect} aria-label={`Disconnect ${source.name}`} className="text-fg-3">
              Disconnect
            </Button>
          )}
        </div>
      </div>

      {status === "error" && (
        <Notice
          tone="error"
          className="mt-3.5 sm:ml-14"
          action={
            <Button size="sm" variant="secondary" onClick={onConnect}>
              Try again
            </Button>
          }
        >
          {connection?.note}
        </Notice>
      )}

      {/* what will be read — always available, before and after connecting */}
      <details className="group mt-2.5 sm:ml-14">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-sm text-[12.5px] text-fg-3 transition-colors hover:text-fg [&::-webkit-details-marker]:hidden">
          What Syxoria will see
          <ChevronDown className="size-3.5 transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="onb-rise mt-3 flex gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 text-[13px]">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent-strong" aria-hidden="true" />
          <div>
            <ul className="grid gap-1 text-fg-2">
              {source.reads.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className="mt-2 text-fg-3">Read-only. Syxoria never changes or sends anything from here. Disconnect at any time.</p>
          </div>
        </div>
      </details>

      {/* connecting: a slow line of the Core's light along the row */}
      {status === "connecting" && <span aria-hidden="true" className="onb-connecting absolute inset-x-0 -bottom-px h-px" />}
    </li>
  );
}
