import { Lock } from "lucide-react";
import type { CSSProperties } from "react";
import { autonomy as copy } from "@/content/onboarding";
import type { PermissionMode } from "@/types";

export type ReachRow = { id: string; label: string; mode: PermissionMode; /** no mode ever makes it automatic */ locked?: string };

const rank: Record<PermissionMode, number> = { auto: 0, ask: 1, off: 2 };
const said: Record<PermissionMode, string> = { auto: copy.auto, ask: copy.ask, off: copy.off };

/**
 * What a mode allows, exactly: every action Syxoria may take, always in the same place, and one
 * line across them — the user's boundary. Above it Syxoria acts on its own; from it on, it asks
 * first. Changing mode moves nothing but that line (and the marks it passes), so the difference
 * between two modes is seen, not read; the actions no mode ever frees stay below it, locked.
 * Rows keep their order in the document and are placed by their state, so an action adjusted by
 * hand simply glides to the side of the line it now belongs to.
 * Styles: "Mandate" in globals.css.
 */
export function AutonomyReach({ rows, onFocus }: { rows: ReachRow[]; /** an action pointed at — its arc answers in the ring */ onFocus?: (position: number | null) => void }) {
  // where each action sits: on its own first, then asked, then off — otherwise in the policy's order
  const order = rows.map((r, i) => ({ id: r.id, key: rank[r.mode] * rows.length + i })).sort((a, b) => a.key - b.key);
  const position = (id: string) => order.findIndex((o) => o.id === id);
  const auto = rows.filter((r) => r.mode === "auto").length;

  return (
    <div className="onb-reach" style={{ "--auto": auto } as CSSProperties} onPointerLeave={() => onFocus?.(null)}>
      <p className="onb-reach__head font-label text-label uppercase">
        <span aria-hidden="true" className="onb-mark" data-mode="auto" />
        {copy.auto}
      </p>
      <ul className="onb-reach__rows">
        {rows.map((r) => {
          const pos = position(r.id);
          return (
            <li key={r.id} className="onb-reach__row" data-mode={r.mode} style={{ "--pos": pos, "--below": pos >= auto ? 1 : 0 } as CSSProperties} onPointerEnter={() => onFocus?.(pos)}>
              <span aria-hidden="true" className="onb-mark" data-mode={r.mode} />
              <span className="min-w-0 truncate">{r.label}</span>
              <span className="sr-only">: {said[r.mode]}</span>
              {r.locked && (
                <span className="onb-reach__lock" title={r.locked}>
                  <Lock className="size-3" aria-hidden="true" />
                  <span className="sr-only">{copy.always}</span>
                </span>
              )}
              {r.mode === "off" && <span className="onb-reach__off">{copy.off}</span>}
            </li>
          );
        })}
        <li className="onb-reach__boundary" aria-hidden="true">
          <span className="onb-boundary__name">{copy.boundary}</span>
          <span className="onb-boundary__line" />
          <span className="onb-boundary__note">{copy.beyond}</span>
        </li>
      </ul>
    </div>
  );
}
