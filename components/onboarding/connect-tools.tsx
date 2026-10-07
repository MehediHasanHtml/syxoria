"use client";

import { Plus, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Sheet } from "@/components/home/sheet";
import { connections as copy } from "@/content/onboarding";
import { ServiceError } from "@/services/_client";
import { connectSource, disconnectSource, importFile, recommendedSources } from "@/services/onboarding";
import type { CompanyProfile, DataSource, SourceConnection } from "@/types";
import { ConnectorCard, connectorState } from "./connector-card";
import { flowToCore } from "./flow-to-core";
import { OnbButton } from "./onboarding-button";
import { QuietButton, rise, StageHeading } from "./primitives";

type Props = {
  company: CompanyProfile | null;
  sources: DataSource[];
  connections: Record<string, SourceConnection>;
  onChange: (id: string, connection: SourceConnection | null) => void;
  onPulse: () => void;
  onContinue: () => void;
  onBack: () => void;
};

/**
 * Where the company's work lives. Only the connectors that matter for this kind of company are
 * shown; everything else waits behind "Add another tool". Connecting is a small sequence: the tool
 * answers → its information travels to the Core → the Core reacts → "Sources" updates.
 */
export function ConnectTools({ company, sources, connections, onChange, onPulse, onContinue, onBack }: Props) {
  const aborts = useRef(new Map<string, AbortController>());
  const cards = useRef(new Map<string, HTMLDivElement>());
  const fileInput = useRef<HTMLInputElement>(null);
  const moreButton = useRef<HTMLButtonElement>(null);
  const [more, setMore] = useState(false);
  // connected, its information still travelling to the Core — shown as connected on its card meanwhile
  const [arriving, setArriving] = useState<Record<string, SourceConnection>>({});
  useEffect(() => {
    const pending = aborts.current;
    return () => pending.forEach((a) => a.abort());
  }, []);

  const suggested = recommendedSources(company);
  const recommended = sources.filter((s) => suggested.includes(s.id));
  const others = sources.filter((s) => !suggested.includes(s.id));
  const view = (id: string) => arriving[id] ?? connections[id];
  const connected = Object.values(connections).filter((c) => c.status === "connected").length;
  const busy = Object.values(connections).some((c) => c.status === "connecting") || Object.keys(arriving).length > 0;
  const extra = others.filter((s) => connectorState(view(s.id)) !== "available");

  async function land(id: string, connection: SourceConnection) {
    setArriving((a) => ({ ...a, [id]: connection }));
    let from: Element | null = cards.current.get(id)?.querySelector("[data-flow-from]") ?? null;
    // from the sheet of more tools: it closes first, and the information leaves from where it opened
    if (from?.closest("dialog")) {
      setMore(false);
      await new Promise((r) => setTimeout(r, 420));
      from = moreButton.current;
    }
    await flowToCore(from);
    onChange(id, connection);
    onPulse();
    setArriving((a) => Object.fromEntries(Object.entries(a).filter(([k]) => k !== id)));
  }

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
      if (!abort.signal.aborted) await land(source.id, { status: "connected", note });
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
      await land("file", { status: "connected", note });
    } catch (e) {
      onChange("file", { status: "error", note: e instanceof ServiceError ? e.message : "We couldn’t read this file. Nothing was imported." });
    }
  }

  const card = (s: DataSource, variant: "card" | "row", i = 0) => {
    const c = view(s.id);
    return (
      <ConnectorCard
        key={s.id}
        ref={(el) => {
          if (el) cards.current.set(s.id, el);
          else cards.current.delete(s.id);
        }}
        source={s}
        state={connectorState(c)}
        note={c?.note}
        variant={variant}
        onConnect={() => connect(s)}
        onCancel={() => cancel(s.id)}
        onDisconnect={() => disconnect(s.id)}
        className={variant === "card" ? "onb-rise" : undefined}
        {...(variant === "card" ? { style: rise(3 + i) } : {})}
      />
    );
  };

  return (
    <div className="w-full max-w-[44rem]">
      <StageHeading lead={copy.ask.lead} accent={copy.ask.accent}>
        {copy.body}
      </StageHeading>

      <section aria-labelledby="src-recommended" className="mt-8 tight:mt-5">
        <h2 id="src-recommended" className="onb-rise mb-3.5 flex items-center gap-2.5 font-label text-label uppercase text-fg-3" style={rise(2)}>
          <span aria-hidden="true" className="h-px w-3 bg-accent" />
          {copy.recommended} {company ? `a ${company.sector}` : "you"}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">{recommended.map((s, i) => card(s, "card", i))}</div>

        <div className="onb-rise mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-2" style={rise(8)}>
          <button
            ref={moreButton}
            type="button"
            onClick={() => setMore(true)}
            aria-haspopup="dialog"
            className="inline-flex items-center gap-2 rounded-md py-1 text-[13px] text-fg-2 transition-colors hover:text-fg"
          >
            <span aria-hidden="true" className="grid size-5 place-items-center rounded-full ring-1 ring-white/15">
              <Plus className="size-3" />
            </span>
            {copy.more}
          </button>
          {extra.length > 0 && <p className="text-[12.5px] text-fg-3">Also: {extra.map((s) => s.name).join(", ")}</p>}
        </div>
      </section>

      <p className="onb-rise mt-6 flex max-w-[36rem] gap-2.5 text-[12.5px] leading-snug text-fg-3 tight:mt-3.5" style={rise(9)}>
        <ShieldCheck className="mt-px size-3.5 shrink-0 text-accent-strong" aria-hidden="true" />
        {copy.readOnly}
      </p>

      <div className="onb-rise mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 tight:mt-5" style={rise(10)}>
        <OnbButton onClick={onContinue} disabled={connected === 0 || busy}>
          {connected === 0 ? "Connect a tool to continue" : `Learn from ${connected === 1 ? "this tool" : `these ${connected} tools`}`}
        </OnbButton>
        <QuietButton onClick={onBack}>Back to your company</QuietButton>
      </div>

      <input ref={fileInput} type="file" accept=".csv,.tsv,.xls,.xlsx" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => onFile(e.target.files?.[0])} />

      <Sheet open={more} onClose={() => setMore(false)} label={copy.moreTitle} header={copy.moreTitle}>
        <p className="text-[13.5px] leading-relaxed text-fg-2">Everything else Syxoria can read today. You can add more later, from Settings.</p>
        <div className="mt-6 grid gap-2">{others.map((s) => card(s, "row"))}</div>
      </Sheet>
    </div>
  );
}
