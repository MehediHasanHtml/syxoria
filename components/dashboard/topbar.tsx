"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Menu as MenuIcon, Search, Settings, UserRound } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Menu } from "@/components/ui/menu";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/format";
import { REFERENCE_NOW } from "@/lib/mock-data/series";
import type { Notification, User } from "@/types";

const NOW = new Date(REFERENCE_NOW);

export function Topbar({ user, notifications, onOpenMenu }: { user: User; notifications: Notification[]; onOpenMenu: () => void }) {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K focuses search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim() ?? "";
    router.push(q ? `/app/projects?q=${encodeURIComponent(q)}` : "/app/projects");
  }

  return (
    <header className="sticky top-0 z-(--z-sticky) border-b border-line bg-canvas/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-10">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation"
          className="-ml-1.5 grid size-9 place-items-center rounded-md text-fg-2 hover:bg-white/5 hover:text-fg lg:hidden"
        >
          <MenuIcon className="size-5" aria-hidden="true" />
        </button>

        <form role="search" onSubmit={onSearch} className="relative max-w-md flex-1">
          <label htmlFor="app-search" className="sr-only">
            Search projects
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-3" aria-hidden="true" />
          <input
            ref={searchRef}
            id="app-search"
            name="q"
            type="search"
            placeholder="Search projects…"
            autoComplete="off"
            className="h-9 w-full rounded-md border border-line bg-canvas-2 pl-9 pr-14 text-sm text-fg placeholder:text-fg-3 transition-[border-color,box-shadow] duration-200 hover:border-line-strong focus:border-fg-3 focus:outline-none focus:ring-4 focus:ring-white/[0.04]"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-xs border border-line px-1.5 py-0.5 font-sans text-[10px] text-fg-3 sm:block">
            Ctrl K
          </kbd>
        </form>

        <div className="ml-auto flex items-center gap-1.5">
          <NotificationsMenu notifications={notifications} />
          <Menu
            header={
              <div className="border-b border-line px-2.5 pb-2.5 pt-1.5">
                <p className="text-[13px] font-medium text-fg">{user.name}</p>
                <p className="truncate text-xs text-fg-3">{user.email}</p>
              </div>
            }
            items={[
              { label: "Profile", href: "/app/settings", icon: <UserRound aria-hidden="true" /> },
              { label: "Settings", href: "/app/settings?tab=workspace", icon: <Settings aria-hidden="true" /> },
              { type: "separator" },
              { label: "Sign out", href: "/login", icon: <LogOut aria-hidden="true" /> },
            ]}
            trigger={(props) => (
              <button
                type="button"
                {...props}
                aria-label="Account menu"
                className="flex items-center gap-2 rounded-md p-1 transition-colors hover:bg-white/5 sm:pr-2.5"
              >
                <Avatar initials={user.initials} name={user.name} size="sm" />
                <span className="hidden text-left sm:block">
                  <span className="block text-[13px] leading-tight text-fg">{user.name.split(" ")[0]}</span>
                  <span className="block text-[11px] capitalize leading-tight text-fg-3">{user.role}</span>
                </span>
              </button>
            )}
          />
        </div>
      </div>
    </header>
  );
}

function NotificationsMenu({ notifications }: { notifications: Notification[] }) {
  const [items, setItems] = useState(notifications);
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const unread = items.filter((n) => !n.read).length;

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
        className="relative grid size-9 place-items-center rounded-md text-fg-2 transition-colors hover:bg-white/5 hover:text-fg"
      >
        <Bell className="size-[18px]" aria-hidden="true" />
        {unread > 0 && <span aria-hidden="true" className="absolute right-2 top-2 size-1.5 rounded-full bg-accent ring-2 ring-canvas" />}
      </button>
      <div
        ref={panel}
        id="notifications-panel"
        role="region"
        aria-label="Notifications"
        hidden={!open}
        className="absolute right-0 top-full z-(--z-overlay) mt-2 w-[min(22rem,calc(100vw-2rem))] animate-fade-in rounded-lg border border-line bg-canvas-2/95 shadow-float backdrop-blur-md"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-sm font-medium text-fg">Notifications</p>
          <button
            type="button"
            disabled={unread === 0}
            onClick={() => setItems((list) => list.map((n) => ({ ...n, read: true })))}
            className="text-xs text-fg-3 transition-colors hover:text-fg disabled:opacity-40"
          >
            Mark all as read
          </button>
        </div>
        {items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-fg-3">You are all caught up.</p>
        ) : (
          <ul className="max-h-96 divide-y divide-line overflow-y-auto">
            {items.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.href ?? "/app"}
                  onClick={() => {
                    setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
                    setOpen(false);
                  }}
                  className="flex gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.03]"
                >
                  <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-accent")} aria-hidden="true" />
                  <span className="min-w-0">
                    <span className={cn("block text-[13px]", n.read ? "text-fg-2" : "font-medium text-fg")}>
                      {n.title}
                      {!n.read && <span className="sr-only"> (unread)</span>}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-fg-3">{n.body}</span>
                    <span className="mt-1.5 block text-[11px] text-fg-3">{formatRelative(n.createdAt, NOW)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
