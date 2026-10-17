"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check, CircleAlert, CirclePause, FileText, Link2, Pencil, RotateCcw, ShieldCheck, X } from "lucide-react";
import { useMemo, useState } from "react";
import { LIFECYCLE, StatusIcon } from "@/components/briefing/marks";
import { useAutomation } from "@/components/dashboard/automation/automation-provider";
import { ActionState, Chip, KpiRow, Panel, PriorityTag, WsHead } from "@/components/dashboard/ws/kit";
import { Button } from "@/components/ui/button";
import { dailyBriefing as words } from "@/content/briefing";
import { AUTONOMY_HREF } from "@/lib/app-nav";
import { isHeld } from "@/lib/automation";
import type { BriefingActionStatus } from "@/types";
import type { WorkspaceAction } from "@/types/workspace";

type Tab = "all" | "suggested" | "drafted" | "awaiting-approval" | "planned" | "in-progress" | "done" | "attention";
const TABS: { id: Tab; label: string; statuses: BriefingActionStatus[] }[] = [
  { id: "all", label: "All", statuses: [] },
  { id: "awaiting-approval", label: "Awaiting approval", statuses: ["awaiting-approval"] },
  { id: "suggested", label: "Suggested", statuses: ["suggested"] },
  { id: "drafted", label: "Drafted", statuses: ["drafted"] },
  { id: "planned", label: "Approved or scheduled", statuses: ["approved", "scheduled"] },
  { id: "in-progress", label: "In progress", statuses: ["in-progress"] },
  { id: "done", label: "Completed", statuses: ["sent", "completed"] },
  { id: "attention", label: "Needs attention", statuses: ["unsuccessful"] },
];
const ORDER: BriefingActionStatus[] = ["unsuccessful", "awaiting-approval", "drafted", "approved", "suggested", "scheduled", "in-progress", "sent", "completed"];
const AREAS = ["All areas", "Sales", "Marketing", "Finance", "Clients", "Operations"];

type Local = { status?: BriefingActionStatus; rejected?: boolean; paused?: boolean; body?: string[]; note?: string };

/**
 * Actions & Approvals: everything Syxoria suggests, prepares, waits on, carries out or carried out,
 * by state. One action open in detail: what it does and why, exactly what Syxoria intends to send
 * or change, the permission it runs under, every stage of its execution with its real state, what
 * came of it or why it stopped, and the controls that fit its state. Preparing, sending and
 * achieving a result are kept apart. In this preview, decisions change the screen only.
 */
export function ActionsView({ actions, initial }: { actions: WorkspaceAction[]; initial?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const automation = useAutomation();
  const [tab, setTab] = useState<Tab>("all");
  const [area, setArea] = useState(AREAS[0]);
  const [local, setLocal] = useState<Record<string, Local>>({});
  const [open, setOpen] = useState(initial && actions.some((a) => a.id === initial) ? initial : actions.find((a) => a.status === "awaiting-approval")?.id ?? actions[0].id);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const merged = useMemo(() => actions.map((a) => ({ ...a, status: local[a.id]?.status ?? a.status, local: local[a.id] ?? {} })), [actions, local]);
  const held = (a: (typeof merged)[number]) => a.local.paused || isHeld(automation.state, automation.ctx, a.id);
  const list = merged
    .filter((a) => (tab === "all" || TABS.find((t) => t.id === tab)?.statuses.includes(a.status)) && (area === AREAS[0] || a.area === area))
    .sort((x, y) => ORDER.indexOf(x.status) - ORDER.indexOf(y.status));
  const action = merged.find((a) => a.id === open) ?? merged[0];
  const count = (t: (typeof TABS)[number]) => (t.id === "all" ? merged.length : merged.filter((a) => t.statuses.includes(a.status)).length);
  const by = (s: BriefingActionStatus[]) => merged.filter((a) => s.includes(a.status)).length;

  const choose = (id: string) => {
    setOpen(id);
    setEditing(false);
    router.replace(`${pathname}?action=${id}`, { scroll: false });
  };
  const set = (id: string, patch: Local) => setLocal((l) => ({ ...l, [id]: { ...l[id], ...patch } }));

  return (
    <div className="ws">
      <WsHead eyebrow="Execution" title="Actions & Approvals" lead="Everything Syxoria suggests, prepares, waits on or carries out, and what came of it. What needs you never happens without you.">
        <Link href={AUTONOMY_HREF} className="ws-mode">
          <ShieldCheck aria-hidden="true" />
          {automation.ctx.levelName} mode
          <span className="ws-mode__sub">Change what may run on its own</span>
        </Link>
      </WsHead>

      <KpiRow
        label="Actions at a glance"
        items={[
          { id: "w", label: "Waiting for you", value: String(by(["awaiting-approval"])), caption: `and ${by(["drafted"])} drafted, shown when due`, delta: { text: "Oldest since 9:20", direction: "up", good: false } },
          { id: "p", label: "Approved or scheduled", value: String(by(["approved", "scheduled"])), caption: "set for a time, not running yet", delta: { text: "Next: tomorrow 9:00", direction: "up", good: true } },
          { id: "d", label: "Completed today", value: String(by(["completed", "sent"])), caption: "sent, logged or prepared", delta: { text: "4 of 5 went through", direction: "up", good: true } },
          { id: "a", label: "Needs attention", value: String(by(["unsuccessful"])), caption: "failed, stays here until resolved", delta: { text: "1 waits on a call", direction: "up", good: false } },
        ]}
      />

      <div className="ws-toolbar">
        <div role="tablist" aria-label="Show actions" className="ws-subnav ws-subnav--flat">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
              <span className="ws-count">{count(t)}</span>
            </button>
          ))}
        </div>
        <div className="ws-toolbar__tools">
          <label className="ws-select">
            <span className="sr-only">Area</span>
            <select value={area} onChange={(e) => setArea(e.target.value)}>
              {AREAS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="ws-grid ws-grid--split">
        <Panel title="Actions" meta={`${list.length} shown`}>
          {list.length === 0 ? (
            <p className="ws-empty">No action in this state right now.</p>
          ) : (
            <ul className="ws-actions" role="listbox" aria-label="Open an action">
              {list.map((a) => (
                <li key={a.id} role="option" aria-selected={a.id === action.id} data-rejected={a.local.rejected || undefined}>
                  <button type="button" onClick={() => choose(a.id)} className="ws-act">
                    <StatusIcon status={a.status} />
                    <span className="min-w-0">
                      <span className="ws-act__title">{a.title}</span>
                      <span className="ws-act__purpose">{a.purpose}</span>
                      <span className="ws-act__meta">
                        <ActionState status={a.status} held={held(a)} />
                        {a.local.rejected && <Chip tone="faint">Rejected</Chip>}
                        <PriorityTag level={a.priority} />
                        <span>{a.client ?? a.area}</span>
                        <span className="ws-hide-sm">{a.local.note ?? a.updated}</span>
                      </span>
                    </span>
                    {a.needsApproval && (a.status === "awaiting-approval" || a.status === "drafted") && !a.local.rejected && <span className="ws-act__asks">Needs you</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Action in detail" meta={action.area}>
          <article key={action.id} className="ws-detail">
            <div className="ws-detail__chips">
              <ActionState status={action.status} held={held(action)} />
              <PriorityTag level={action.priority} />
              {action.client && action.clientId && (
                <Link href={`/app/clients?client=${action.clientId}`} className="ws-link">
                  {action.client}
                </Link>
              )}
            </div>
            <h2 className="ws-detail__title">{action.title}</h2>
            <p className="ws-detail__purpose">{action.purpose}</p>
            <p className="ws-detail__why">
              <span className="bd-label">Why</span>
              {action.why}
            </p>

            {action.preview && (
              <section className="ws-detail__block">
                <h3 className="bd-label">What Syxoria intends to {action.status === "completed" || action.status === "sent" ? "have done" : "do"}</h3>
                <div className="ws-preview" data-kind={action.preview.kind}>
                  {action.preview.to && (
                    <p className="ws-preview__line">
                      <span>To</span>
                      {action.preview.to}
                    </p>
                  )}
                  {action.preview.subject && (
                    <p className="ws-preview__line">
                      <span>Subject</span>
                      {action.preview.subject}
                    </p>
                  )}
                  {action.preview.body &&
                    (editing ? (
                      <div className="ws-preview__edit">
                        <label className="sr-only" htmlFor="ws-edit">
                          Message
                        </label>
                        <textarea id="ws-edit" value={draft} onChange={(e) => setDraft(e.target.value)} rows={8} />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              set(action.id, { body: draft.split(/\n{2,}/), note: "Edited by you just now" });
                              setEditing(false);
                            }}
                          >
                            Save the changes
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="ws-preview__body">
                        {(action.local.body ?? action.preview.body).map((p) => (
                          <p key={p}>{p}</p>
                        ))}
                      </div>
                    ))}
                  {action.preview.fields && (
                    <dl className="ws-preview__fields">
                      {action.preview.fields.map((f) => (
                        <div key={f.label}>
                          <dt>{f.label}</dt>
                          <dd>{f.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              </section>
            )}

            <section className="ws-detail__block">
              <h3 className="bd-label">Permission</h3>
              <p className="ws-permission">
                <span>{action.permission.rule}</span>
                <Chip tone={action.permission.mode === "auto" ? "emerald" : "owner"}>{action.permission.mode === "auto" ? "On its own" : "Asks you first"}</Chip>
              </p>
              <p className="ws-cell-sub">{action.permission.reason}</p>
            </section>

            <section className="ws-detail__block">
              <h3 className="bd-label">Execution</h3>
              <ol className="ws-stages">
                {action.stages.map((s, i) => {
                  const approvedNow = action.local.status === "approved" && s.label === "Approval requested";
                  const state = approvedNow ? "done" : s.state;
                  return (
                    <li key={s.label + i} data-state={state}>
                      <span aria-hidden="true" className="ws-stages__node">
                        {state === "done" && <Check className="size-2.5" strokeWidth={3} />}
                        {state === "failed" && <X className="size-2.5" strokeWidth={3} />}
                      </span>
                      <span className="ws-stages__label">{approvedNow ? "Approved by you" : s.label}</span>
                      <span className="ws-stages__at tabular">{approvedNow ? "Just now" : s.at}</span>
                      {s.note && !approvedNow && <span className="ws-stages__note">{s.note}</span>}
                      <span className="sr-only">, {state === "done" ? "done" : state === "now" ? "in progress" : state === "failed" ? "failed" : state === "waiting" ? "waiting" : "to come"}</span>
                    </li>
                  );
                })}
              </ol>
            </section>

            {action.result && (
              <p className="ws-outcome" data-kind="result">
                <Check aria-hidden="true" />
                <span>
                  <span className="bd-label">Result</span>
                  {action.result}
                </span>
              </p>
            )}
            {action.error && (
              <p className="ws-outcome" data-kind="error">
                <CircleAlert aria-hidden="true" />
                <span>
                  <span className="bd-label">Why it stopped</span>
                  {action.error}
                </span>
              </p>
            )}
            {held(action) && (
              <p className="ws-outcome" data-kind="held">
                <CirclePause aria-hidden="true" />
                <span>
                  <span className="bd-label">Paused</span>
                  {action.local.paused ? "You paused this action. Nothing starts until you resume it." : "Held by a pause in Autonomy & safety. Nothing starts until it is lifted."}
                </span>
              </p>
            )}
            {action.dependsOn && (
              <p className="ws-depends">
                <Link2 aria-hidden="true" />
                Waits on{" "}
                <button type="button" className="ws-link" onClick={() => choose(action.dependsOn as string)}>
                  {actions.find((a) => a.id === action.dependsOn)?.title}
                </button>
              </p>
            )}

            <section className="ws-detail__block">
              <h3 className="bd-label">Based on</h3>
              <ul className="ws-sources">
                {action.sources.map((s) => (
                  <li key={s}>
                    <FileText aria-hidden="true" />
                    {s}
                  </li>
                ))}
              </ul>
            </section>

            <Controls
              action={action}
              held={held(action)}
              onApprove={() => set(action.id, { status: "approved", note: "Approved by you just now" })}
              onReject={() => set(action.id, { rejected: true, note: "Rejected by you just now" })}
              onEdit={() => {
                setDraft((action.local.body ?? action.preview?.body ?? []).join("\n\n"));
                setEditing(true);
              }}
              onPrepare={() => set(action.id, { status: "drafted", note: "Drafted just now" })}
              onPause={() => set(action.id, { paused: !action.local.paused, note: action.local.paused ? "Resumed by you" : "Paused by you" })}
            />
            <p className="ax-preview">Preview: decisions here change this screen only. Nothing is sent or changed.</p>
          </article>
        </Panel>
      </div>

      <Panel title="How an action moves" meta="The same states on every screen">
        <ol className="pa-lifecycle">
          {LIFECYCLE.map((s) => (
            <li key={s}>
              <StatusIcon status={s} />
              <span className="min-w-0">
                <span className="pa-lifecycle__name">{words.actions.statuses[s]}</span>
                <span className="pa-lifecycle__means">{words.actions.meanings[s]}</span>
              </span>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}

function Controls({
  action,
  held,
  onApprove,
  onReject,
  onEdit,
  onPrepare,
  onPause,
}: {
  action: WorkspaceAction & { local: Local };
  held: boolean;
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
  onPrepare: () => void;
  onPause: () => void;
}) {
  if (action.local.rejected) return <p className="ws-cell-sub mt-4">Rejected. Syxoria will not bring it back unless something changes.</p>;
  const s = action.status;
  const waitingDep = Boolean(action.dependsOn);
  return (
    <div className="ws-controls">
      {(s === "awaiting-approval" || (s === "drafted" && action.needsApproval)) && (
        <>
          <Button size="sm" onClick={onApprove}>
            <Check aria-hidden="true" />
            Approve
          </Button>
          {action.preview?.body && (
            <Button size="sm" variant="secondary" onClick={onEdit}>
              <Pencil aria-hidden="true" />
              Edit
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onReject}>
            Reject
          </Button>
        </>
      )}
      {s === "suggested" && (
        <>
          <Button size="sm" variant="secondary" onClick={onPrepare}>
            Prepare it
          </Button>
          <Button size="sm" variant="ghost" onClick={onReject}>
            Dismiss
          </Button>
        </>
      )}
      {(s === "approved" || s === "scheduled" || s === "in-progress") && (
        <Button size="sm" variant="secondary" onClick={onPause}>
          <CirclePause aria-hidden="true" />
          {action.local.paused ? "Resume" : held ? "Paused" : "Pause"}
        </Button>
      )}
      {s === "unsuccessful" && (
        <>
          <Button size="sm" variant="secondary" disabled={waitingDep} title={waitingDep ? "Waits on the step it depends on" : undefined}>
            <RotateCcw aria-hidden="true" />
            Retry
          </Button>
          {waitingDep && <span className="ws-cell-sub">Retry opens once the step it waits on is done.</span>}
        </>
      )}
      {(s === "completed" || s === "sent") && <span className="ws-cell-sub">Done. The outcome is recorded in History & Reports.</span>}
    </div>
  );
}
