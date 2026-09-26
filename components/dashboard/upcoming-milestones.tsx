import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import type { User } from "@/types";

export type UpcomingItem = {
  id: string;
  title: string;
  dueDate: string;
  projectId: string;
  projectName: string;
  owner?: User;
};

const DAY = 86_400_000;
const month = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });

function when(dueIso: string, nowIso: string) {
  const days = Math.round((Date.parse(dueIso.slice(0, 10)) - Date.parse(nowIso.slice(0, 10))) / DAY);
  if (days < 0) return { text: days === -1 ? "1 day late" : `${-days} days late`, late: true };
  if (days === 0) return { text: "Today", late: false };
  if (days === 1) return { text: "Tomorrow", late: false };
  if (days < 7) return { text: `In ${days} days`, late: false };
  const weeks = Math.round(days / 7);
  return { text: weeks === 1 ? "Next week" : `In ${weeks} weeks`, late: false };
}

/** Next milestones across every project, soonest (or overdue) first. */
export function UpcomingMilestones({ items, now }: { items: UpcomingItem[]; now: string }) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-fg-3">Nothing due soon. Enjoy the quiet.</p>;
  }
  return (
    <ol className="-my-1 divide-y divide-line">
      {items.map((m) => {
        const d = new Date(m.dueDate);
        const w = when(m.dueDate, now);
        return (
          <li key={`${m.projectId}-${m.id}`} className="flex items-center gap-4 py-3">
            <div
              className={cn(
                "grid w-11 shrink-0 place-items-center rounded-md border py-1.5 leading-none",
                w.late ? "border-caution/40 bg-caution-soft text-caution" : "border-line bg-canvas-3 text-fg",
              )}
            >
              <span className="font-display text-base font-medium tabular">{d.getUTCDate()}</span>
              <span className="mt-1 text-[10px] uppercase tracking-wide text-fg-3">{month.format(d)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] text-fg">{m.title}</p>
              <p className="mt-0.5 truncate text-xs text-fg-3">
                <Link href={`/app/projects/${m.projectId}`} className="transition-colors hover:text-fg">
                  {m.projectName}
                </Link>
                <span aria-hidden="true"> · </span>
                <span className={cn(w.late && "text-caution")}>{w.text}</span>
              </p>
            </div>
            {m.owner && <Avatar initials={m.owner.initials} name={m.owner.name} size="xs" />}
          </li>
        );
      })}
    </ol>
  );
}
