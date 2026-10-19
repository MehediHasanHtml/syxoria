"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ApprovalSheet, useDecisions } from "@/components/dashboard/overview/parts";
import type { OverviewData } from "@/components/dashboard/overview/data";
import { ExecutiveOverview } from "@/components/dashboard/overview/executive-overview";
import { centerScenarios, type CenterState } from "@/lib/mock-data/center-scenarios";
import { CoreSample, DecisionCenter, Sculpture, type CenterProps } from "./center-directions";

export type Direction = "decision" | "core" | "sculpture";

const DIRECTIONS: { id: Direction; name: string; line: string; render: (p: CenterProps) => ReactNode }[] = [
  {
    id: "decision",
    name: "Decision centre",
    line: "No permanent object. The centre shows what Syxoria understands, detects, recommends and executes, with the abstract Core as its seal.",
    render: (p) => <DecisionCenter {...p} />,
  },
  {
    id: "core",
    name: "Abstract Core",
    line: "The company as a core sample: one layer per part of the business, Syxoria as the seam through them. Events shift the layers.",
    render: (p) => <CoreSample {...p} />,
  },
  {
    id: "sculpture",
    name: "Sculptural Brain",
    line: "The Brain in dark anthracite, lit like an object in a gallery. Light follows the pointer; events change the light, never the shape.",
    render: (p) => <Sculpture {...p} />,
  },
];

const noop = () => () => {};

/**
 * The centre explorations: the real overview, with its centre replaced by one of three directions,
 * shown in one of four moments. A small panel under the bar switches both, and the address keeps
 * the choice (?direction=…&state=…) so a view can be shared.
 */
export function CenterLab({ data, initialDirection, initialState }: { data: OverviewData; initialDirection?: string; initialState?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [direction, setDirection] = useState<Direction>(DIRECTIONS.some((d) => d.id === initialDirection) ? (initialDirection as Direction) : "decision");
  const [state, setState] = useState<CenterState>(centerScenarios.some((s) => s.state === initialState) ? (initialState as CenterState) : "anomaly");
  const [sheet, setSheet] = useState<string | null>(null);
  const { decided, decide } = useDecisions();
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  const s = centerScenarios.find((x) => x.state === state)!;
  const d = DIRECTIONS.find((x) => x.id === direction)!;
  const action = s.next?.actionId ? data.actions.find((a) => a.id === s.next!.actionId) : undefined;
  const go = (next: { direction?: Direction; state?: CenterState }) => {
    const dir = next.direction ?? direction;
    const st = next.state ?? state;
    if (next.direction) setDirection(dir);
    if (next.state) setState(st);
    router.replace(`${pathname}?direction=${dir}&state=${st}`, { scroll: false });
  };

  const panel = (
    <div className="ce-lab" role="region" aria-label="Centre explorations">
      <span className="ce-lab__title">Centre exploration</span>
      <span className="ce-lab__label">Direction</span>
      <div role="radiogroup" aria-label="Direction" className="ce-lab__seg">
        {DIRECTIONS.map((x) => (
          <button key={x.id} type="button" role="radio" aria-checked={x.id === direction} onClick={() => go({ direction: x.id })}>
            {x.name}
          </button>
        ))}
      </div>
      <span className="ce-lab__label">Moment</span>
      <div role="radiogroup" aria-label="Moment" className="ce-lab__seg">
        {centerScenarios.map((x) => (
          <button key={x.state} type="button" role="radio" aria-checked={x.state === state} onClick={() => go({ state: x.state })} data-state={x.state}>
            {x.name}
          </button>
        ))}
      </div>
      <p className="ce-lab__line" title={d.line}>
        {d.line}
      </p>
    </div>
  );

  return (
    <>
      {mounted && createPortal(panel, document.body)}
      <ExecutiveOverview
        data={data}
        ask={s.ask}
        center={
          <div className="ce" data-direction={direction} aria-live="polite">
            {d.render({ s, action, onReview: setSheet })}
          </div>
        }
      />
      <ApprovalSheet action={data.actions.find((a) => a.id === sheet) ?? null} decided={sheet ? decided[sheet] : undefined} onDecide={(x) => sheet && decide(sheet, x)} onClose={() => setSheet(null)} />
    </>
  );
}
