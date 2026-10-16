"use client";

import { useState, type ReactNode, type Ref } from "react";
import { briefingTime, dailyBriefing as copy, sinceOf } from "@/content/briefing";
import type { BriefingDimension, DailyBriefingSet } from "@/types";
import { AutonomyCard } from "./autonomy-card";
import { BriefingChanges } from "./briefing-changes";
import { BriefingDial } from "./briefing-dial";
import { FollowThroughPanel } from "./briefing-follow";
import { BriefingPeriods } from "./briefing-periods";

const dayOf = (date: string) => new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));

/**
 * The executive briefing: one of the day's three briefings (morning, midday, evening). The
 * greeting, the briefing's one sentence and the day's briefings open it; the dial is the focal
 * point, its four steps readable at once around the figure that matters; what changed since the
 * last briefing sits at its right; and along the bottom, what Syxoria is doing about it (the
 * follow through, every action on demand) and the autonomy it does it under. The morning is
 * compared with yesterday evening's briefing; the very first briefing with nothing.
 *
 * Everything comes from the service (DailyBriefingSet); this only holds what is chosen: which
 * briefing, and which step is in the centre. The step stays chosen across briefings, so the same
 * question can be compared from one to the next. Styles: "DAILY BRIEFING" in globals.css.
 *
 * At the end of the onboarding it arrives step by step (`revealed`: priority, insight,
 * recommendation, action, then what Syxoria is doing), and ends on the way in (`cta`).
 */
export function DailyBriefingView({
  set,
  initial,
  revealed = 5,
  cta,
  headingRef,
}: {
  set: DailyBriefingSet;
  initial?: string;
  /** How much has been said so far: 1 to 4 the steps of the dial in order, 5 everything */
  revealed?: number;
  /** The way on, at the end of the autonomy card */
  cta?: ReactNode;
  /** The greeting, to receive the focus when the briefing arrives */
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  const [id, setId] = useState(initial && set.briefings.some((b) => b.id === initial) ? initial : set.briefings[0].id);
  const [selected, setSelected] = useState<BriefingDimension>("priority");
  const i = set.briefings.findIndex((b) => b.id === id);
  const briefing = set.briefings[i];
  const since = briefing.changes ? sinceOf(briefing) : null;
  const compared = briefing.comparedWith;
  // the thread moved on from the previous briefing of the same day
  const previous = i > 0 && compared && set.briefings[i - 1].preparedAt === compared.preparedAt ? set.briefings[i - 1] : null;
  const against = since && compared ? copy.changes.against(copy.periods[compared.period], briefingTime(compared.preparedAt), compared.preparedAt.slice(0, 10) !== briefing.preparedAt.slice(0, 10)) : null;
  const doing = revealed >= 4;

  return (
    <div className="bd editorial-type @container w-full">
      <div className="bd-grid">
        <div className="bd-stage">
          <header className="bd-greet">
            <p className="bd-label">
              {copy.eyebrow} · {dayOf(set.date)} · <span className="tabular">{briefingTime(briefing.preparedAt)}</span>
            </p>
            <h1 ref={headingRef} tabIndex={headingRef ? -1 : undefined} className="bd-greet__title outline-none">
              {copy.greeting[briefing.period]}
              {set.owner.firstName ? (
                <>
                  , <em className="bd-greet__name">{set.owner.firstName}.</em>
                </>
              ) : (
                "."
              )}
            </h1>
            <p key={briefing.id} className="bd-greet__line">
              {briefing.headline}
            </p>
            <div className="bd-greet__periods">
              <BriefingPeriods briefings={set.briefings} upcoming={set.upcoming} current={id} onChoose={setId} />
            </div>
          </header>
          <div className="bd-stage__dial">
            <BriefingDial briefing={briefing} selected={selected} onSelect={setSelected} since={since} revealed={revealed} />
          </div>
          <div className="bd-stage__changes" data-pending={!doing || undefined} inert={!doing || undefined}>
            <BriefingChanges key={briefing.id} changes={briefing.changes} actions={briefing.actions} against={against} onSelect={setSelected} />
          </div>
        </div>

        <div className="bd-bottom" data-pending={!doing || undefined} inert={!doing || undefined}>
          <FollowThroughPanel briefing={briefing} previous={previous?.followThrough.steps} since={previous ? since : null} onShowRecommendation={() => setSelected("recommendation")} />
          <AutonomyCard autonomy={set.autonomy}>{cta}</AutonomyCard>
        </div>
      </div>
    </div>
  );
}
