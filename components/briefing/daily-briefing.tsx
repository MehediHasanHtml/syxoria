"use client";

import { useState } from "react";
import { briefingTime, dailyBriefing as copy } from "@/content/briefing";
import type { BriefingDimension, DailyBriefingSet } from "@/types";
import { ActionTracker } from "./action-tracker";
import { BriefingChanges } from "./briefing-changes";
import { BriefingDial } from "./briefing-dial";
import { BriefingPeriods } from "./briefing-periods";

const dayOf = (date: string) => new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));

/**
 * The executive briefing: one of the day's three briefings (morning, midday, evening), read as one
 * line of reasoning on the dial, with what changed since the one before and what Syxoria is doing
 * about it. Everything comes from the service (DailyBriefingSet); this only holds what is chosen:
 * which briefing, and which step of it is in the centre. The step stays chosen across briefings,
 * so the same question can be compared from one to the next.
 *
 * Layout ("DAILY BRIEFING" in globals.css): the headline and the day's briefings on top, the dial
 * as the focal point, what changed and the actions beside it, the actions bottom right.
 */
export function DailyBriefingView({ set, initial }: { set: DailyBriefingSet; initial?: string }) {
  const [id, setId] = useState(initial && set.briefings.some((b) => b.id === initial) ? initial : set.briefings[0].id);
  const [selected, setSelected] = useState<BriefingDimension>("priority");
  const i = set.briefings.findIndex((b) => b.id === id);
  const briefing = set.briefings[i];
  const previous = i > 0 ? set.briefings[i - 1] : null;
  const since = previous && briefing.changes ? briefingTime(previous.preparedAt) : null;

  return (
    <div className="bd editorial-type @container w-full">
      <div className="bd-grid">
        <header className="bd-head">
          <div className="min-w-0">
            <p className="font-label text-label uppercase text-fg-3">
              {copy.eyebrow} · {dayOf(set.date)} · <span className="tabular">{briefingTime(briefing.preparedAt)}</span>
            </p>
            <h1 key={briefing.id} className="bd-head__title">
              {briefing.headline}
            </h1>
          </div>
          <BriefingPeriods briefings={set.briefings} current={id} onChoose={setId} />
        </header>

        <div className="bd-body">
          <div className="bd-body__dial">
            <BriefingDial briefing={briefing} selected={selected} onSelect={setSelected} since={since} />
          </div>
          <div className="bd-body__side">
            <BriefingChanges key={briefing.id} changes={briefing.changes} since={since} onSelect={setSelected} />
            <ActionTracker
              actions={briefing.actions}
              autonomy={set.autonomy}
              recommendation={{ id: briefing.recommendation.id, title: briefing.recommendation.title }}
              onShowRecommendation={() => setSelected("recommendation")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
