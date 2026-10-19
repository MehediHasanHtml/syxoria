"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, CirclePause } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { SyxoriaCore } from "@/components/brand/syxoria-core";
import { automation as copy, holdTime } from "@/content/automation";
import { AUTONOMY_HREF } from "@/lib/app-nav";
import { globalHold, heldActions, isHeld } from "@/lib/automation";
import { cn } from "@/lib/cn";
import { useAutomation } from "./automation-provider";

/** The pages where the Core is on stage: the bar gives it up there, as in the onboarding */
const CORE_ON_STAGE = (path: string) => path === "/app" || path.startsWith("/app/assistant") || path.startsWith("/concept/overview/living");

/**
 * The top bar's word on Syxoria: the Core and what it is doing (Active · Suspended · 2 paused).
 * It opens the kill switch's shortcut: the mode, what starts next on its own, and the one
 * control, suspending (or reviewing and resuming). The full controls live in Settings & Autonomy.
 */
export function AutomationControl() {
  const { ctx, state, requestSuspend, requestResume } = useAutomation();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const all = globalHold(state);
  const targeted = state.holds.filter((h) => h.scope !== "global").length;
  const { held, running } = heldActions(state, ctx);
  // what would start next on its own, the held ones first and marked
  const next = [...held, ...running].slice(0, 3);
  const word = all ? copy.status.suspended : targeted ? copy.status.partly(targeted) : copy.status.running;
  const onStage = CORE_ON_STAGE(pathname);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={copy.status.label(word)}
        onClick={() => setOpen((o) => !o)}
        className="ax-trigger"
        data-held={all ? "all" : targeted ? "some" : undefined}
      >
        {onStage ? (
          <span aria-hidden="true" className="ax-trigger__dot" />
        ) : (
          <SyxoriaCore state={all ? "paused" : "active"} detail="mark" label="Syxoria" vtName="syx-core" className="size-7" />
        )}
        <span className="hidden sm:inline">{word}</span>
      </button>

      <div id={panelId} role="region" aria-label={copy.panel.settings} hidden={!open} className="ax-panel">
        <p className="bd-label">{copy.panel.mode(ctx.levelName)}</p>
        <p className="ax-panel__state">{all ? copy.panel.suspended : targeted ? copy.panel.partly : copy.panel.running}</p>
        {all && <p className="ax-panel__since">{copy.since(holdTime(all.since), all.by === "safety")}</p>}

        <div className="ax-panel__next">
          <p className="bd-label">{next.length && next.every((a) => held.includes(a)) ? copy.panel.held : copy.panel.next}</p>
          {next.length ? (
            <ul>
              {next.map((a) => (
                <li key={a.id} data-held={held.includes(a) || undefined}>
                  {held.includes(a) && <CirclePause aria-hidden="true" strokeWidth={1.8} />}
                  <span className="ax-panel__name">
                    {a.name}
                    {held.includes(a) && <span className="sr-only">, {copy.settings.targeted.paused.toLowerCase()}</span>}
                  </span>
                  <span className="ax-panel__time tabular">{a.timing}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ax-panel__muted">{copy.panel.nothingNext}</p>
          )}
        </div>

        {all ? (
          <button
            type="button"
            className="ax-kill"
            data-mode="resume"
            onClick={() => {
              setOpen(false);
              requestResume(all);
            }}
          >
            {copy.panel.review}
          </button>
        ) : (
          <button
            type="button"
            className="ax-kill"
            onClick={() => {
              setOpen(false);
              requestSuspend();
            }}
          >
            <CirclePause aria-hidden="true" strokeWidth={1.8} />
            {copy.panel.suspend}
          </button>
        )}

        <div className="ax-panel__links">
          <Link href={AUTONOMY_HREF} onClick={() => setOpen(false)}>
            {copy.panel.settings}
            <ArrowRight aria-hidden="true" />
          </Link>
          <Link href="/app/briefings" onClick={() => setOpen(false)}>
            {copy.panel.briefings}
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Beside an action's status, on a server page: "Paused" when a hold keeps it from starting */
export function HeldMark({ actionId }: { actionId: string }) {
  const { ctx, state } = useAutomation();
  return isHeld(state, ctx, actionId) ? <span className="ax-held">{copy.settings.targeted.paused}</span> : null;
}

/**
 * While everything Syxoria would start on its own is held: one quiet line across every page,
 * under the top bar, with how many actions it keeps waiting and the way back.
 */
export function AutomationBanner() {
  const { ctx, state, requestResume } = useAutomation();
  const all = globalHold(state);
  if (!all) return null;
  const { held } = heldActions(state, ctx);
  return (
    <div role="status" className="ax-banner">
      <div className="ax-banner__inner">
        <CirclePause aria-hidden="true" className="ax-banner__icon" strokeWidth={1.7} />
        <p className="min-w-0">
          <span className="ax-banner__title">{copy.banner.title}</span>
          <span className="ax-banner__body">
            {copy.sinceShort(holdTime(all.since), all.by === "safety")}. {copy.banner.body}
            {held.length > 0 && <> · {copy.banner.held(held.length)}</>}
          </span>
        </p>
        <button type="button" onClick={() => requestResume(all)} className={cn("ax-banner__action")}>
          {copy.banner.review}
        </button>
      </div>
    </div>
  );
}
