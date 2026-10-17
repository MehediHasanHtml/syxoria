import type { Metadata } from "next";
import { LIFECYCLE, StatusIcon } from "@/components/briefing/marks";
import { HeldMark } from "@/components/dashboard/automation/automation-status";
import { PlannedAreaView } from "@/components/dashboard/planned-area";
import { areas, planned } from "@/content/areas";
import { dailyBriefing as words } from "@/content/briefing";
import { getHomeOverview } from "@/services/overview";
import type { BriefingActionStatus } from "@/types";

export const metadata: Metadata = { title: areas.actions.title };

/** Today's actions, by what they need: the same list, and the same statuses, as the briefing's */
const GROUPS: { title: string; statuses: BriefingActionStatus[] }[] = [
  { title: "Waiting for you", statuses: ["awaiting-approval"] },
  { title: "Needs attention", statuses: ["unsuccessful"] },
  { title: "Prepared or planned", statuses: ["suggested", "drafted", "approved", "scheduled", "in-progress"] },
  { title: "Done", statuses: ["sent", "completed"] },
];

export default async function ActionsPage() {
  const { briefing } = await getHomeOverview();
  return (
    <PlannedAreaView area={areas.actions}>
      <section aria-label={planned.preview} className="hm-panel pa-preview">
        <div className="hm-panel__head">
          <h2 className="bd-label">{planned.preview}</h2>
          <p className="hm-foot !mt-0">Read only. Approving arrives with this area.</p>
        </div>
        {GROUPS.map((g) => {
          const list = briefing.actions.filter((a) => g.statuses.includes(a.status));
          if (!list.length) return null;
          return (
            <div key={g.title} className="pa-group">
              <p className="pa-group__title">{g.title}</p>
              <ul className="hm-rows">
                {list.map((a) => (
                  <li key={a.id}>
                    <div className="hm-row" data-status={a.status}>
                      <StatusIcon status={a.status} />
                      <span className="min-w-0">
                        <span className="hm-row__name">{a.name}</span>
                        <span className="hm-row__meta">
                          <span className="hm-row__status">{words.actions.statuses[a.status]}</span> · {a.timing}
                          {a.next && <> · {a.next}</>}
                        </span>
                      </span>
                      <HeldMark actionId={a.id} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      {/* one lifecycle for every action, on every screen: what each state means, and what it does not */}
      <section aria-labelledby="pa-lifecycle" className="hm-panel pa-preview">
        <div className="hm-panel__head">
          <h2 id="pa-lifecycle" className="bd-label">
            {planned.lifecycle}
          </h2>
        </div>
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
      </section>
    </PlannedAreaView>
  );
}
