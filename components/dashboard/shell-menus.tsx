"use client";

import Link from "next/link";
import { Bell, CircleAlert, CheckCheck, Hand, LogOut, Mail, Plug, ScrollText, Settings, UserRound, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Menu } from "@/components/ui/menu";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/format";
import { WORKSPACE_NOW } from "@/lib/mock-data/overview";
import type { Notification, User } from "@/types";
import type { NotificationKind } from "@/types/workspace";

const NOW = new Date(WORKSPACE_NOW);

/** The account: who is signed in, their profile and settings, signing out */
export function AccountMenu({ user }: { user: User }) {
  return (
    <Menu
      header={
        <div className="border-b border-line px-2.5 pb-2.5 pt-1.5">
          <p className="text-[13px] font-medium text-fg">{user.name}</p>
          <p className="truncate text-xs text-fg-3">{user.email}</p>
        </div>
      }
      items={[
        { label: "Profile", href: "/app/settings?tab=account", icon: <UserRound aria-hidden="true" /> },
        { label: "Settings & Autonomy", href: "/app/settings", icon: <Settings aria-hidden="true" /> },
        { type: "separator" },
        { label: "Sign out", href: "/login", icon: <LogOut aria-hidden="true" /> },
      ]}
      trigger={(props) => (
        <button type="button" {...props} aria-label="Account menu" className="sx-account">
          <Avatar initials={user.initials} name={user.name} size="sm" />
        </button>
      )}
    />
  );
}

const KIND: Record<NotificationKind, LucideIcon> = { urgent: CircleAlert, approval: Hand, reply: Mail, completed: CheckCheck, connection: Plug, briefing: ScrollText };
const FILTERS: { id: "all" | "you" | "reply" | "done"; label: string; kinds: NotificationKind[] }[] = [
  { id: "all", label: "All", kinds: [] },
  { id: "you", label: "Needs you", kinds: ["urgent", "approval", "connection"] },
  { id: "reply", label: "Replies", kinds: ["reply"] },
  { id: "done", label: "Done", kinds: ["completed", "briefing"] },
];

/** Smart notifications: what is urgent, waits for approval, came back from a client, was done, or needs a connection fixed */
export function NotificationsMenu({ notifications }: { notifications: Notification[] }) {
  const [items, setItems] = useState(notifications);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const unread = items.filter((n) => !n.read).length;
  const kinds = FILTERS.find((f) => f.id === filter)?.kinds ?? [];
  const shown = items.filter((n) => filter === "all" || (n.kind && kinds.includes(n.kind)));

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!panel.current?.contains(e.target as Node) && !trigger.current?.contains(e.target as Node)) setOpen(false);
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
    <div className="relative">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls="notifications-panel"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        onClick={() => setOpen((o) => !o)}
        className="gs-icon relative"
      >
        <Bell className="size-[18px]" aria-hidden="true" />
        {unread > 0 && <span aria-hidden="true" className="absolute right-2 top-2 size-1.5 rounded-full bg-accent ring-2 ring-canvas" />}
      </button>
      <div ref={panel} id="notifications-panel" role="region" aria-label="Notifications" hidden={!open} className="gs-pop gs-pop--wide">
        <div className="gs-pop__head gs-pop__head--row">
          <p className="gs-pop__title">Notifications</p>
          <button
            type="button"
            disabled={unread === 0}
            onClick={() => setItems((list) => list.map((n) => ({ ...n, read: true })))}
            className="text-xs text-fg-3 transition-colors hover:text-fg disabled:opacity-40"
          >
            Mark all as read
          </button>
        </div>
        <div className="gs-tabs" role="group" aria-label="Show">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
        {shown.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-fg-3">Nothing here. You are all caught up.</p>
        ) : (
          <ul className="max-h-[26rem] overflow-y-auto">
            {shown.map((n) => {
              const Icon = n.kind ? KIND[n.kind] : Bell;
              return (
                <li key={n.id}>
                  <Link
                    href={n.href ?? "/app"}
                    onClick={() => {
                      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
                      setOpen(false);
                    }}
                    className="gs-note"
                    data-kind={n.kind}
                  >
                    <span className="gs-note__icon" aria-hidden="true">
                      <Icon strokeWidth={1.7} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-[13px]", n.read ? "text-fg-2" : "font-medium text-fg")}>
                        {n.title}
                        {!n.read && <span className="sr-only"> (unread)</span>}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-fg-3">{n.body}</span>
                      <span className="mt-1.5 block text-[11px] text-fg-3">{formatRelative(n.createdAt, NOW)}</span>
                    </span>
                    {!n.read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <div className="gs-pop__foot">
          <Link href="/app/settings?tab=notifications" onClick={() => setOpen(false)} className="text-xs text-fg-3 transition-colors hover:text-fg">
            Choose what reaches you
          </Link>
        </div>
      </div>
    </div>
  );
}
