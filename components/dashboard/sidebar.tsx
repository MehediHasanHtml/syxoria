"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type FocusEvent, type MouseEvent } from "react";
import { ArrowUpRight, ChevronLeft, LifeBuoy, Plus } from "lucide-react";
import { Logo, LogoMark } from "@/components/shared/logo";
import { Progress } from "@/components/ui/progress";
import { appNav, isActive } from "@/lib/app-nav";
import { cn } from "@/lib/cn";
import type { ProjectStatus, Workspace } from "@/types";

export type SidebarProject = { id: string; name: string; status: ProjectStatus };

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
  badges: { insights: number };
  workspace: Workspace;
  projects: SidebarProject[];
};

const statusDot: Record<ProjectStatus, string> = {
  "on-track": "bg-positive",
  "at-risk": "bg-caution",
  blocked: "bg-negative",
  completed: "bg-fg-3",
  paused: "bg-fg-3",
};

type Tip = { label: string; top: number; left: number };

export function Sidebar({ collapsed, onToggleCollapsed, onNavigate, badges, workspace, projects }: SidebarProps) {
  const pathname = usePathname();
  // Collapsed labels float outside the scroll container, so they're positioned
  // against the viewport instead of relying on overflow-visible parents.
  const [tip, setTip] = useState<Tip | null>(null);
  const tipProps = (label: string) =>
    collapsed
      ? {
          onMouseEnter: (e: MouseEvent<HTMLElement>) => showTip(label, e.currentTarget),
          onFocus: (e: FocusEvent<HTMLElement>) => showTip(label, e.currentTarget),
          onMouseLeave: () => setTip(null),
          onBlur: () => setTip(null),
        }
      : {};
  function showTip(label: string, el: HTMLElement) {
    const r = el.getBoundingClientRect();
    setTip({ label, top: r.top + r.height / 2, left: r.right + 12 });
  }

  const itemBase = "group relative flex items-center rounded-md transition-[background-color,color] duration-200";

  return (
    <div className="flex h-full flex-col">
      {/* Top: brand + collapse control */}
      <div className={cn("flex h-16 shrink-0 items-center border-b border-line", collapsed ? "justify-center" : "justify-between pl-5 pr-3")}>
        {collapsed ? (
          <Link href="/app" aria-label="Syxoria overview" className="text-fg">
            <LogoMark />
          </Link>
        ) : (
          <Logo href="/app" />
        )}
        {onToggleCollapsed && !collapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Collapse sidebar"
            aria-expanded="true"
            className="grid size-8 place-items-center rounded-md border border-line text-fg-3 transition-colors hover:border-line-strong hover:bg-white/5 hover:text-fg"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
      {onToggleCollapsed && collapsed && (
        <div className="flex shrink-0 justify-center border-b border-line py-2.5">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Expand sidebar"
            aria-expanded="false"
            {...tipProps("Expand sidebar")}
            className="grid size-8 place-items-center rounded-md border border-line text-fg-3 transition-colors hover:border-line-strong hover:bg-white/5 hover:text-fg"
          >
            <ChevronLeft className="size-4 rotate-180" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Everything between the top bar and the footer scrolls */}
      <div onScroll={() => setTip(null)} className="sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain py-4">
        <div className={cn(collapsed ? "flex justify-center" : "px-3")}>
          {collapsed ? (
            <span
              tabIndex={0}
              aria-label={`${workspace.name}, ${workspace.plan} plan`}
              {...tipProps(workspace.name)}
              className="grid size-9 place-items-center rounded-md border border-line bg-surface font-display text-[13px] font-medium text-accent-strong outline-none"
            >
              {workspace.name.charAt(0)}
            </span>
          ) : (
            <div className="flex items-center gap-3 rounded-md border border-line bg-surface/50 px-3 py-2.5">
              <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-sm bg-accent-soft font-display text-[13px] font-medium text-accent-strong">
                {workspace.name.charAt(0)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-fg">{workspace.name}</p>
                <p className="mt-0.5 text-[11px] capitalize text-fg-3">{workspace.plan} plan</p>
              </div>
            </div>
          )}
        </div>

        <nav aria-label="Application" className={cn("mt-5", collapsed ? "px-0" : "px-3")}>
          {appNav.map((group) => (
            <div key={group.group} className="mb-5">
              {collapsed ? (
                <div aria-hidden="true" className="mx-auto mb-2 h-px w-6 bg-line" />
              ) : (
                <p className="mb-1.5 px-3 text-[11px] font-medium text-fg-3">{group.group}</p>
              )}
              <ul className={cn("space-y-0.5", collapsed && "flex flex-col items-center")}>
                {group.items.map((item) => {
                  const active = isActive(pathname, item);
                  const Icon = item.icon;
                  const badge = item.badgeKey ? badges[item.badgeKey] : 0;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        aria-label={collapsed ? `${item.label}${badge ? `, ${badge} new` : ""}` : undefined}
                        {...tipProps(item.label)}
                        className={cn(
                          itemBase,
                          "h-9 text-[13.5px]",
                          collapsed ? "w-10 justify-center" : "gap-3 px-3",
                          active ? "bg-white/[0.06] text-fg" : "text-fg-2 hover:bg-white/[0.03] hover:text-fg",
                        )}
                      >
                        {!collapsed && (
                          <span
                            aria-hidden="true"
                            className={cn(
                              "absolute -left-3 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-accent transition-[opacity,transform] duration-300 ease-out-soft",
                              active ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0",
                            )}
                          />
                        )}
                        <Icon className={cn("size-[17px] shrink-0", active ? "text-accent-strong" : "text-fg-3 group-hover:text-fg-2")} strokeWidth={1.6} aria-hidden="true" />
                        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                        {badge > 0 &&
                          (collapsed ? (
                            <span aria-hidden="true" className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-accent" />
                          ) : (
                            <span className="tabular rounded-sm bg-accent-soft px-1.5 text-[11px] text-accent-strong">{badge}</span>
                          ))}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Active projects — quick jumps */}
          <div className="mb-2">
            {collapsed ? (
              <div aria-hidden="true" className="mx-auto mb-2 h-px w-6 bg-line" />
            ) : (
              <div className="mb-1.5 flex items-center justify-between pl-3 pr-1">
                <p className="text-[11px] font-medium text-fg-3">Your projects</p>
                <Link
                  href="/app/projects?new=1"
                  onClick={onNavigate}
                  aria-label="New project"
                  className="grid size-6 place-items-center rounded-sm text-fg-3 transition-colors hover:bg-white/5 hover:text-fg"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            )}
            <ul className={cn("space-y-0.5", collapsed && "flex flex-col items-center")}>
              {projects.map((p) => {
                const href = `/app/projects/${p.id}`;
                const active = pathname === href;
                return (
                  <li key={p.id}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      aria-label={collapsed ? p.name : undefined}
                      {...tipProps(p.name)}
                      className={cn(
                        itemBase,
                        "h-8 text-[13px]",
                        collapsed ? "w-10 justify-center" : "gap-3 px-3",
                        active ? "bg-white/[0.06] text-fg" : "text-fg-2 hover:bg-white/[0.03] hover:text-fg",
                      )}
                    >
                      {collapsed ? (
                        <span className="relative grid size-7 place-items-center rounded-sm border border-line bg-surface text-[11px] font-medium text-fg-2">
                          {p.name.charAt(0)}
                          <span aria-hidden="true" className={cn("absolute -right-0.5 -top-0.5 size-2 rounded-full ring-2 ring-canvas-2", statusDot[p.status])} />
                        </span>
                      ) : (
                        <>
                          <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", statusDot[p.status])} />
                          <span className="flex-1 truncate">{p.name}</span>
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </div>

      <div className={cn("shrink-0 border-t border-line", collapsed ? "flex flex-col items-center gap-1 py-3" : "space-y-3 p-3")}>
        {!collapsed && (
          <div className="rounded-md px-3 py-1">
            <div className="flex items-center justify-between text-[11px] text-fg-3">
              <span>Seats</span>
              <span className="tabular">
                {workspace.seats.used} of {workspace.seats.total}
              </span>
            </div>
            <Progress value={(workspace.seats.used / workspace.seats.total) * 100} label="Seats used" className="mt-2" />
          </div>
        )}
        <div className={cn("flex", collapsed ? "flex-col items-center gap-1" : "items-center gap-1")}>
          <a
            href="mailto:hello@syxoria.com"
            aria-label={collapsed ? "Get help" : undefined}
            {...tipProps("Get help")}
            className={cn("inline-flex h-8 items-center gap-1.5 rounded-sm text-xs text-fg-3 transition-colors hover:bg-white/5 hover:text-fg", collapsed ? "w-8 justify-center" : "px-2")}
          >
            <LifeBuoy className="size-3.5" aria-hidden="true" />
            {!collapsed && "Help"}
          </a>
          <Link
            href="/"
            aria-label={collapsed ? "Back to website" : undefined}
            {...tipProps("Back to website")}
            className={cn("inline-flex h-8 items-center gap-1.5 rounded-sm text-xs text-fg-3 transition-colors hover:bg-white/5 hover:text-fg", collapsed ? "w-8 justify-center" : "px-2")}
          >
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
            {!collapsed && "Website"}
          </Link>
        </div>
      </div>

      {collapsed && tip && (
        <span
          aria-hidden="true"
          style={{ top: tip.top, left: tip.left }}
          className="pointer-events-none fixed z-(--z-overlay) -translate-y-1/2 animate-fade-in whitespace-nowrap rounded-sm border border-line bg-canvas-3 px-2 py-1 text-xs text-fg-2 shadow-panel"
        >
          {tip.label}
        </span>
      )}
    </div>
  );
}
