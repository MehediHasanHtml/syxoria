"use client";

import { CircleCheck, CircleSlash } from "lucide-react";
import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { automation as copy } from "@/content/automation";
import { heldActions } from "@/lib/automation";
import { cn } from "@/lib/cn";
import { liftHold, placeHold } from "@/services/automation";
import type { AutomationContext, AutomationHold, AutomationState } from "@/types";

const KEY = "syx.automation";
const EVENT = "syx:automation";

/**
 * The holds as this browser keeps them, for the prototype: the service has no backend yet, so a
 * hold placed here lives in localStorage (and says so). An external store, so every screen reads
 * the same state at once. TODO(api): read the holds from the service and keep them current.
 */
let cache: { raw: string | null; value: AutomationState | null } = { raw: null, value: null };
const store = {
  subscribe(cb: () => void) {
    window.addEventListener("storage", cb);
    window.addEventListener(EVENT, cb);
    return () => {
      window.removeEventListener("storage", cb);
      window.removeEventListener(EVENT, cb);
    };
  },
  get(): AutomationState | null {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(KEY);
    } catch {
      // storage unavailable: what was held in this visit
      return cache.value;
    }
    if (raw !== cache.raw) {
      let value: AutomationState | null = null;
      try {
        value = raw ? (JSON.parse(raw) as AutomationState) : null;
      } catch {
        value = null;
      }
      cache = { raw, value };
    }
    return cache.value;
  },
  set(value: AutomationState) {
    try {
      localStorage.setItem(KEY, JSON.stringify(value));
    } catch {
      /* storage unavailable: the hold lasts until the page is left */
      cache = { raw: cache.raw, value };
    }
    window.dispatchEvent(new Event(EVENT));
  },
};

type AutomationApi = {
  ctx: AutomationContext;
  state: AutomationState;
  /** Opens the kill switch's confirmation */
  requestSuspend: () => void;
  /** Opens the review before a hold is lifted */
  requestResume: (hold: AutomationHold) => void;
  /** Holds one workflow or one tool at once: the safe direction needs no confirmation */
  pause: (scope: "workflow" | "integration", targetId: string) => Promise<void>;
  pausing: string | null;
};

const Ctx = createContext<AutomationApi | null>(null);

export function useAutomation() {
  const api = useContext(Ctx);
  if (!api) throw new Error("useAutomation needs the AutomationProvider (AppShell)");
  return api;
}

/** The same, for what is also shown outside the workspace (the briefing at the end of the onboarding) */
export const useAutomationIfAny = () => useContext(Ctx);

/**
 * Syxoria's execution and the controls over it, for the whole workspace: the top bar's status,
 * the banner while everything is held, Home, Actions & Approvals and Settings & Autonomy all read
 * this one state. Suspending asks for confirmation and says what stops and what carries on;
 * resuming asks for a review. Styles: "AUTOMATION" in globals.css.
 */
export function AutomationProvider({ ctx, children }: { ctx: AutomationContext; children: ReactNode }) {
  const stored = useSyncExternalStore(store.subscribe, store.get, () => null);
  const state = stored ?? ctx.state;
  const [suspending, setSuspending] = useState(false);
  const [resuming, setResuming] = useState<AutomationHold | null>(null);
  const [pausing, setPausing] = useState<string | null>(null);

  const save = (holds: AutomationHold[]) => store.set({ ...state, holds });

  const pause: AutomationApi["pause"] = async (scope, targetId) => {
    setPausing(targetId);
    const hold = await placeHold({ scope, targetId });
    save([...(store.get() ?? state).holds, hold]);
    setPausing(null);
  };

  return (
    <Ctx.Provider value={{ ctx, state, requestSuspend: () => setSuspending(true), requestResume: setResuming, pause, pausing }}>
      {children}
      <SuspendDialog
        open={suspending}
        ctx={ctx}
        state={state}
        onClose={() => setSuspending(false)}
        onConfirm={async (reason) => {
          const hold = await placeHold({ scope: "global", reason });
          save([...(store.get() ?? state).holds.filter((h) => h.scope !== "global"), hold]);
          setSuspending(false);
        }}
      />
      <ResumeDialog
        hold={resuming}
        ctx={ctx}
        state={state}
        onClose={() => setResuming(null)}
        onConfirm={async (hold) => {
          await liftHold(hold.id);
          save((store.get() ?? state).holds.filter((h) => h.id !== hold.id));
          setResuming(null);
        }}
      />
    </Ctx.Provider>
  );
}

/** What a hold is about, in a few words: "autonomous actions" · "Routine replies" · "everything in Gmail" */
export function holdSubject(hold: AutomationHold, ctx: AutomationContext) {
  if (hold.scope === "global") return copy.resume.all;
  if (hold.scope === "workflow") return ctx.workflows.find((w) => w.id === hold.targetId)?.name ?? copy.scopes.workflow;
  const tool = ctx.integrations.find((i) => i.id === hold.targetId)?.name ?? copy.scopes.integration;
  return `everything in ${tool}`;
}

function SuspendDialog({
  open,
  ctx,
  state,
  onClose,
  onConfirm,
}: {
  open: boolean;
  ctx: AutomationContext;
  state: AutomationState;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void>;
}) {
  const [reason, setReason] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const { running } = heldActions(state, ctx);
  const close = () => {
    if (busy) return;
    setReason(undefined);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title={copy.suspend.title}
      size="lg"
      description={copy.suspend.description}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={close} disabled={busy}>
            {copy.suspend.cancel}
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={busy}
            loadingLabel={copy.suspend.busy}
            onClick={async () => {
              setBusy(true);
              await onConfirm(reason);
              setBusy(false);
              setReason(undefined);
            }}
          >
            {copy.suspend.confirm}
          </Button>
        </>
      }
    >
      <div className="ax-split">
        <div>
          <p className="bd-label">{copy.suspend.stops}</p>
          <ul className="ax-list" data-tone="stop">
            <li>
              <CircleSlash aria-hidden="true" strokeWidth={1.8} />
              {copy.suspend.stopsActions}
            </li>
            {running.map((a) => (
              <li key={a.id} className="ax-list__action">
                <span className="ax-list__name">{a.name}</span>
                <span className="ax-list__meta tabular">{a.timing}</span>
              </li>
            ))}
            {ctx.workflows.length > 0 && (
              <li>
                <CircleSlash aria-hidden="true" strokeWidth={1.8} />
                {copy.suspend.stopsWorkflows(ctx.workflows.map((w) => w.name))}
              </li>
            )}
          </ul>
        </div>
        <div>
          <p className="bd-label">{copy.suspend.continues}</p>
          <ul className="ax-list" data-tone="go">
            {copy.suspend.continuesList.map((s) => (
              <li key={s}>
                <CircleCheck aria-hidden="true" strokeWidth={1.8} />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="ax-note">{copy.suspend.inFlight}</p>

      <fieldset className="mt-5">
        <legend className="bd-label">{copy.suspend.reason}</legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {copy.suspend.reasons.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={reason === r}
              onClick={() => setReason(reason === r ? undefined : r)}
              className={cn("ax-chip", reason === r && "is-on")}
            >
              {r}
            </button>
          ))}
        </div>
      </fieldset>
      <p className="ax-preview">{copy.preview}</p>
    </Dialog>
  );
}

function ResumeDialog({
  hold,
  ctx,
  state,
  onClose,
  onConfirm,
}: {
  hold: AutomationHold | null;
  ctx: AutomationContext;
  state: AutomationState;
  onClose: () => void;
  onConfirm: (hold: AutomationHold) => Promise<void>;
}) {
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  // what this hold alone keeps from starting: held now, free once it is lifted
  const after = hold ? heldActions({ ...state, holds: state.holds.filter((h) => h.id !== hold.id) }, ctx) : null;
  const restarts = after ? heldActions(state, ctx).held.filter((a) => after.running.includes(a)) : [];
  const close = () => {
    if (busy) return;
    setChecked(false);
    onClose();
  };

  return (
    <Dialog
      open={hold !== null}
      onClose={close}
      title={copy.resume.title(hold ? holdSubject(hold, ctx) : copy.resume.all)}
      description={copy.resume.description}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={close} disabled={busy}>
            {copy.resume.keep}
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!checked}
            loading={busy}
            loadingLabel={copy.resume.busy}
            onClick={async () => {
              if (!hold) return;
              setBusy(true);
              await onConfirm(hold);
              setBusy(false);
              setChecked(false);
            }}
          >
            {copy.resume.confirm}
          </Button>
        </>
      }
    >
      <p className="bd-label">{copy.resume.restarts}</p>
      {restarts.length > 0 ? (
        <ul className="ax-list" data-tone="go">
          {restarts.map((a) => (
            <li key={a.id} className="ax-list__action">
              <span className="ax-list__name">{a.name}</span>
              <span className="ax-list__meta tabular">{a.timing}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="ax-muted">{copy.resume.nothing}</p>
      )}
      <label className="ax-check">
        <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
        <span>{copy.resume.check}</span>
      </label>
      <p className="ax-preview">{copy.preview}</p>
    </Dialog>
  );
}
