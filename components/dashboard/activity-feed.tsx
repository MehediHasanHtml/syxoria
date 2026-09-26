import Link from "next/link";
import { Bot } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ModuleIcon } from "@/components/shared/module-icon";
import { EmptyState } from "@/components/shared/states";
import { cn } from "@/lib/cn";
import { formatRelative, formatTime } from "@/lib/format";
import { REFERENCE_NOW } from "@/lib/mock-data/series";
import type { ActivityItem, User } from "@/types";

const NOW = new Date(REFERENCE_NOW);

export function ActivityFeed({
  items,
  users,
  showTime = false,
  className,
}: {
  items: ActivityItem[];
  users: User[];
  showTime?: boolean;
  className?: string;
}) {
  if (!items.length) {
    return <EmptyState compact title="No activity yet" description="Actions from your team and automations will appear here." />;
  }
  const byId = new Map(users.map((u) => [u.id, u]));

  return (
    <ol className={cn("relative", className)}>
      {items.map((a, i) => {
        const actor = a.actorId === "system" ? null : byId.get(a.actorId);
        const body = (
          <>
            <span className="text-fg">{actor ? actor.name : "Syxoria"}</span> <span className="text-fg-3">{a.message}</span>{" "}
            <span className="text-fg-2">{a.target}</span>
          </>
        );
        return (
          <li key={a.id} className="relative flex gap-3.5 pb-5 last:pb-0">
            {i < items.length - 1 && <span aria-hidden="true" className="absolute left-3.5 top-8 h-[calc(100%-26px)] w-px bg-line" />}
            {actor ? (
              <Avatar initials={actor.initials} name={actor.name} size="sm" />
            ) : (
              <span className="grid size-7 shrink-0 place-items-center rounded-full border border-accent-line bg-accent-soft text-accent">
                <Bot className="size-3.5" aria-label="Automation" />
              </span>
            )}
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[13px] leading-snug">
                {a.projectId ? (
                  <Link href={`/app/projects/${a.projectId}`} className="transition-opacity hover:opacity-80">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-fg-3">
                <ModuleIcon module={a.module} className="size-3" />
                <span className="capitalize">{a.module}</span>
                <span aria-hidden="true">·</span>
                <time dateTime={a.createdAt}>{showTime ? formatTime(a.createdAt) : formatRelative(a.createdAt, NOW)}</time>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
