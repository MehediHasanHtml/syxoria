"use client";

import { usePathname, useRouter } from "next/navigation";
import { CircleAlert, CirclePause, Plug, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useAutomation } from "@/components/dashboard/automation/automation-provider";
import { Chip, KpiRow, Panel, WsHead, type ChipTone } from "@/components/dashboard/ws/kit";
import { IntegrationLogo } from "@/components/shared/integration-logo";
import { Button } from "@/components/ui/button";
import { holdFor } from "@/lib/automation";
import type { ToolStatus, WorkspaceTool } from "@/types/workspace";

const STATUS: Record<ToolStatus, { word: string; tone: ChipTone }> = {
  connected: { word: "Connected", tone: "emerald" },
  syncing: { word: "Syncing", tone: "neutral" },
  attention: { word: "Renew soon", tone: "owner" },
  error: { word: "Reconnect", tone: "warn" },
  available: { word: "Available", tone: "faint" },
  planned: { word: "Planned", tone: "faint" },
};
const CATS = ["All", "Email", "Calendar", "Storage", "CRM", "Finance", "Communication"] as const;
const LEVEL = { read: "Read", write: "Act", off: "Off" } as const;

/**
 * Integrations: the tools Syxoria reads and acts in. Each connected tool with its account, how
 * current it is, what it allows (read, act, off) and its recent sync log, with the controls to
 * reconnect, sync, pause what Syxoria does in it, or disconnect it; then the tools supported today
 * and, apart, those planned for later. Connecting here is a preview.
 */
export function IntegrationsView({ tools, initial }: { tools: WorkspaceTool[]; initial?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const automation = useAutomation();
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [state, setState] = useState(tools);
  const [open, setOpen] = useState(initial && tools.some((t) => t.id === initial) ? initial : tools.find((t) => t.status === "error")?.id ?? tools[0].id);
  const [notify, setNotify] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const inCat = (t: WorkspaceTool) => cat === "All" || t.category === cat;
  const connected = state.filter((t) => ["connected", "syncing", "attention", "error"].includes(t.status) && inCat(t));
  const available = state.filter((t) => t.status === "available" && inCat(t));
  const planned = state.filter((t) => t.status === "planned" && inCat(t));
  const tool = state.find((t) => t.id === open) ?? state[0];
  const acting = automation.ctx.integrations.find((i) => i.id === tool.id);
  const hold = acting ? holdFor(automation.state, "integration", tool.id) : null;

  const choose = (id: string) => {
    setOpen(id);
    setMessage(null);
    router.replace(`${pathname}?tool=${id}`, { scroll: false });
  };
  const patch = (id: string, p: Partial<WorkspaceTool>) => setState((s) => s.map((t) => (t.id === id ? { ...t, ...p } : t)));
  const reconnect = (id: string) => {
    patch(id, { status: "syncing", synced: "Reconnecting" });
    window.setTimeout(() => {
      setState((s) => s.map((t) => (t.id === id ? { ...t, status: "connected", synced: "Just now", note: undefined, log: [{ at: "Now", text: "Reconnected, reading the waiting files", ok: true }, ...(t.log ?? [])] } : t)));
      setMessage("Preview: reconnected on this screen. In the product, the tool’s own sign in opens first.");
    }, 1400);
  };
  const errorTool = state.find((t) => t.status === "error");

  return (
    <div className="ws">
      <WsHead eyebrow="System" title="Integrations" lead="The tools Syxoria reads and acts in, what each one allows, and how current the information is." />

      <KpiRow
        label="Integrations at a glance"
        items={[
          { id: "c", label: "Connected tools", value: String(state.filter((t) => ["connected", "syncing", "attention", "error"].includes(t.status)).length), caption: "email, calendar, files, CRM, finance", delta: { text: "Gmail synced 2 minutes ago", direction: "up", good: true } },
          { id: "n", label: "Need you", value: String(state.filter((t) => t.status === "error" || t.status === "attention").length), caption: "one to reconnect, one to renew", delta: { text: "Drive stopped on 12 Oct", direction: "up", good: false } },
          { id: "a", label: "Supported to add", value: String(state.filter((t) => t.status === "available").length), caption: "ready to connect today" },
          { id: "p", label: "Planned", value: String(state.filter((t) => t.status === "planned").length), caption: "coming in a later phase, not operational" },
        ]}
      />

      {errorTool && (
        <div className="ws-alert" role="status">
          <CircleAlert aria-hidden="true" />
          <p className="min-w-0">
            <span className="ws-alert__title">{errorTool.name} needs reconnecting</span>
            <span className="ws-alert__body">{errorTool.note}</span>
          </p>
          <Button size="sm" variant="secondary" onClick={() => reconnect(errorTool.id)}>
            <RefreshCw aria-hidden="true" />
            Reconnect
          </Button>
        </div>
      )}

      <div className="ws-chips" role="group" aria-label="Category">
        {CATS.map((c) => (
          <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="ws-grid ws-grid--split">
        <div className="ws-stack">
          <Panel title="Connected" meta={`${connected.length} tools`}>
            <ul className="ws-tools" role="listbox" aria-label="Open a tool">
              {connected.map((t) => (
                <li key={t.id} role="option" aria-selected={t.id === tool.id}>
                  <button type="button" onClick={() => choose(t.id)} className="ws-tool" data-status={t.status}>
                    <span className="ws-tool__logo" aria-hidden="true">
                      {t.logo ? <IntegrationLogo id={t.logo} size={20} /> : <span>{t.name.charAt(0)}</span>}
                    </span>
                    <span className="min-w-0">
                      <span className="ws-tool__name">{t.name}</span>
                      <span className="ws-tool__sub">
                        {t.category} · {t.account}
                      </span>
                    </span>
                    <span className="ws-tool__sync ws-hide-sm">{t.synced}</span>
                    <Chip tone={STATUS[t.status].tone}>{STATUS[t.status].word}</Chip>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          {available.length > 0 && (
            <Panel title="Supported, ready to connect" meta={`${available.length} tools`}>
              <ul className="ws-tile-grid">
                {available.map((t) => (
                  <li key={t.id} className="ws-tile">
                    <span className="ws-tool__logo" aria-hidden="true">
                      {t.logo ? <IntegrationLogo id={t.logo} size={20} /> : <span>{t.name.charAt(0)}</span>}
                    </span>
                    <span className="ws-tool__name">{t.name}</span>
                    <span className="ws-tool__sub">{t.purpose}</span>
                    <Button size="sm" variant="outline" onClick={() => setMessage(`Preview: connecting ${t.name} opens its own sign in, read only first.`)}>
                      <Plug aria-hidden="true" />
                      Connect
                    </Button>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {planned.length > 0 && (
            <Panel title="Planned for a later phase" meta="Not operational yet">
              <ul className="ws-tile-grid">
                {planned.map((t) => (
                  <li key={t.id} className="ws-tile" data-planned="">
                    <span className="ws-tool__logo" aria-hidden="true">
                      {t.logo ? <IntegrationLogo id={t.logo} size={20} /> : <span>{t.name.charAt(0)}</span>}
                    </span>
                    <span className="ws-tool__name">{t.name}</span>
                    <span className="ws-tool__sub">{t.purpose}</span>
                    <button type="button" className="ws-link" aria-pressed={notify.includes(t.id)} onClick={() => setNotify((n) => (n.includes(t.id) ? n.filter((x) => x !== t.id) : [...n, t.id]))}>
                      {notify.includes(t.id) ? "We will tell you" : "Tell me when it arrives"}
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <Panel title="Tool" meta={tool.category}>
          <article key={tool.id} className="ws-detail">
            <div className="ws-docview">
              <span className="ws-tool__logo ws-tool__logo--lg" aria-hidden="true">
                {tool.logo ? <IntegrationLogo id={tool.logo} size={26} /> : <span>{tool.name.charAt(0)}</span>}
              </span>
              <div className="min-w-0">
                <h2 className="ws-detail__title">{tool.name}</h2>
                <p className="ws-cell-sub">{tool.purpose}</p>
              </div>
              <Chip tone={STATUS[tool.status].tone}>{STATUS[tool.status].word}</Chip>
            </div>

            {tool.note && (
              <p className="ws-outcome" data-kind={tool.status === "error" ? "error" : "held"}>
                <CircleAlert aria-hidden="true" />
                <span>{tool.note}</span>
              </p>
            )}

            {tool.account && (
              <dl className="ws-facts">
                <div>
                  <dt>Account</dt>
                  <dd>{tool.account}</dd>
                </div>
                <div>
                  <dt>Last sync</dt>
                  <dd>{tool.synced}</dd>
                </div>
                <div>
                  <dt>Read so far</dt>
                  <dd>{tool.items}</dd>
                </div>
                <div>
                  <dt>Syxoria acts in it</dt>
                  <dd>{acting ? acting.acts : "Reads only"}</dd>
                </div>
              </dl>
            )}

            {tool.permissions && (
              <section className="ws-detail__block">
                <h3 className="bd-label">What Syxoria may do</h3>
                <ul className="ws-perms">
                  {tool.permissions.map((p) => (
                    <li key={p.label}>
                      <span>{p.label}</span>
                      <span className="ws-perm" data-level={p.level}>
                        {LEVEL[p.level]}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="ws-note">Change these in Settings & Autonomy, under connected tool permissions.</p>
              </section>
            )}

            {tool.log && (
              <section className="ws-detail__block">
                <h3 className="bd-label">Recent sync</h3>
                <ol className="ws-synclog">
                  {tool.log.map((l) => (
                    <li key={l.at + l.text} data-ok={l.ok || undefined}>
                      <span className="tabular">{l.at}</span>
                      {l.text}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {tool.status !== "available" && tool.status !== "planned" && (
              <div className="ws-controls">
                {tool.status === "error" || tool.status === "attention" ? (
                  <Button size="sm" onClick={() => reconnect(tool.id)}>
                    <RefreshCw aria-hidden="true" />
                    {tool.status === "error" ? "Reconnect" : "Renew access"}
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => setMessage(`Preview: ${tool.name} would sync now.`)}>
                    <RefreshCw aria-hidden="true" />
                    Sync now
                  </Button>
                )}
                {acting &&
                  (hold ? (
                    <Button size="sm" variant="secondary" onClick={() => automation.requestResume(hold)}>
                      Resume actions in {tool.name}
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" loading={automation.pausing === tool.id} onClick={() => automation.pause("integration", tool.id)}>
                      <CirclePause aria-hidden="true" />
                      Pause actions in {tool.name}
                    </Button>
                  ))}
                <Button size="sm" variant="ghost" onClick={() => setMessage(`Preview: disconnecting ${tool.name} stops Syxoria reading and acting in it. It asks for confirmation first.`)}>
                  Disconnect
                </Button>
              </div>
            )}
            {message && <p className="ax-preview">{message}</p>}
          </article>
        </Panel>
      </div>
    </div>
  );
}
