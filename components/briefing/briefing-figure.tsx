import { CalendarClock, Check } from "lucide-react";
import { dailyBriefing as copy } from "@/content/briefing";
import type { BriefingMetric } from "@/types";
import { DirectionMark, SeverityMark } from "./marks";

/**
 * What a step leads with, set for what it is. In the centre of the dial (`FigureCentre`): money and
 * counts as a figure, a rise or a fall with its direction and where it came from, a deadline with
 * its date, progress with how far along (the dial draws the arc), a result with its check, and a
 * client's issue or an alert as a few words with their source and urgency, never as a number.
 * On the cards (`FigureLine`): the same, in one line.
 */
export function FigureCentre({ metric }: { metric: BriefingMetric }) {
  if (metric.kind === "message")
    return (
      <>
        <p className="bd-center__urgency">
          <SeverityMark level={metric.urgency} />
          {copy.severity[metric.urgency]}
        </p>
        <p className="bd-center__message">{metric.value}</p>
        <p className="bd-center__caption">{metric.caption}</p>
      </>
    );

  return (
    <>
      <p className="bd-center__metric tabular" data-kind={metric.kind}>
        {metric.kind === "change" && <DirectionMark direction={metric.direction} className="bd-center__mark" />}
        {metric.kind === "result" && <Check aria-hidden="true" className="bd-center__mark" strokeWidth={1.6} />}
        {metric.value}
        {metric.kind === "change" && <span className="sr-only"> ({copy.figure[metric.direction]})</span>}
      </p>
      <p className="bd-center__caption">{metric.caption}</p>
      {metric.kind === "change" && metric.from && <p className="bd-center__meta tabular">{copy.figure.from(metric.from)}</p>}
      {metric.kind === "deadline" && (
        <p className="bd-center__meta">
          <CalendarClock aria-hidden="true" className="size-3" strokeWidth={1.8} />
          {copy.figure.due(metric.due)}
        </p>
      )}
    </>
  );
}

export function FigureLine({ metric }: { metric: BriefingMetric }) {
  if (metric.kind === "message")
    return (
      <span className="bd-figure" data-kind="message">
        <SeverityMark level={metric.urgency} />
        <span className="bd-figure__quote">{metric.value}</span>
      </span>
    );
  return (
    <span className="bd-figure" data-kind={metric.kind}>
      {metric.kind === "change" && <DirectionMark direction={metric.direction} className="size-3.5" />}
      {metric.kind === "result" && <Check aria-hidden="true" className="size-3.5" strokeWidth={2} />}
      <strong className="bd-figure__value tabular">{metric.value}</strong>
      <span className="bd-figure__caption">{metric.caption}</span>
    </span>
  );
}
