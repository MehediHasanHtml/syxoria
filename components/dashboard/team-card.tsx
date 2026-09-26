import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import type { Presence, PresenceState, User } from "@/types";

const presenceStyle: Record<PresenceState, { dot: string; label: string }> = {
  online: { dot: "bg-positive", label: "Online" },
  away: { dot: "bg-caution", label: "Away" },
  offline: { dot: "bg-fg-3/60", label: "Offline" },
};

/** Who's around today, with the short status people set for themselves. */
export function TeamList({ members, presence, currentUserId }: { members: User[]; presence: Presence[]; currentUserId: string }) {
  const byUser = new Map(presence.map((p) => [p.userId, p]));
  const people = members.filter((m) => m.id !== currentUserId);
  return (
    <ul className="space-y-4">
      {people.map((m) => {
        const p = byUser.get(m.id);
        const s = presenceStyle[p?.state ?? "offline"];
        return (
          <li key={m.id} className="flex items-start gap-3">
            <span className="relative">
              <Avatar initials={m.initials} name={m.name} size="md" />
              <span
                className={cn("absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-surface", s.dot)}
                aria-hidden="true"
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[13.5px] text-fg">{m.name}</span>
                <span className="shrink-0 text-[11px] text-fg-3">{s.label}</span>
              </p>
              <p className="mt-0.5 truncate text-xs text-fg-3">{p?.note ?? m.title}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
