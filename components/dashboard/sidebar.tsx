"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type FocusEvent, type MouseEvent } from "react";
import { ArrowUpRight, ChevronDown, ChevronLeft, LifeBuoy } from "lucide-react";
import { Logo, LogoMark } from "@/components/shared/logo";
import { appNav, isActive, type AppNavItem } from "@/lib/app-nav";
import { cn } from "@/lib/cn";
import type { Workspace } from "@/types";
import { KillSwitchShortcut } from "./automation/automation-status";

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
  badges: { approvals: number };
  workspace: Workspace;
};

type Tip = { label: string; top: number; left: number };

/**
 * The product's navigation (lib/app-nav.ts): the company, then the six groups (the assistant among
 * them, under Intelligence; it is also asked from the top bar on every page). An area with sections (Business Management)
 * opens them under itself while it is the page in view, or on its chevron. Collapsed, the sidebar
 * keeps the icons, each named in a tooltip.
 */
export function Sidebar({ collapsed, onToggleCollapsed, onNavigate, badges, workspace }: SidebarProps) {
  const pathname = usePathname();
  // Collapsed labels float outside the scroll container, so they're positioned
  // against the viewport instead of relying on overflow-visible parents.
  const [tip, setTip] = useState<Tip | null>(null);
  // sections opened by hand, beyond the area in view
  const [opened, setOpened] = useState<Record<string, boolean>>({});
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

  const renderItem = (item: AppNavItem) => {
    const active = isActive(pathname, item);
    const Icon = item.icon;
    const badge = item.badgeKey ? badges[item.badgeKey] : 0;
    const open = !collapsed && Boolean(item.children) && (opened[item.href] ?? active);
    return (
      <li key={item.href}>
        <div className="relative">
          <Link
            href={item.children ? item.children[0].href : item.href}
            onClick={onNavigate}
            aria-current={active && !item.children ? "page" : undefined}
            aria-label={collapsed ? `${item.label}${badge ? `, ${badge} waiting for you` : ""}` : undefined}
            {...tipProps(item.label)}
            className={cn(
              itemBase,
              "h-9 text-[13.5px]",
              collapsed ? "w-10 justify-center" : cn("gap-3 px-3", item.children && "pr-7"),
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
                <span className="tabular rounded-sm bg-accent-soft px-1.5 text-[11px] text-accent-strong">
                  {badge}
                  <span className="sr-only"> waiting for you</span>
                </span>
              ))}
          </Link>
          {item.children && !collapsed && (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={`nav-${item.href}`}
              aria-label={`${open ? "Hide" : "Show"} the ${item.label} sections`}
              onClick={() => setOpened((o) => ({ ...o, [item.href]: !open }))}
              className="absolute right-0.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-sm text-fg-3 transition-colors hover:bg-white/5 hover:text-fg"
            >
              <ChevronDown className={cn("size-3.5 transition-transform duration-300 ease-out-soft", open && "rotate-180")} aria-hidden="true" />
            </button>
          )}
        </div>
        {item.children && !collapsed && (
          <ul id={`nav-${item.href}`} hidden={!open} className="relative mb-1 ml-[1.35rem] mt-0.5 space-y-0.5 border-l border-line pl-3">
            {item.children.map((child) => {
              const on = pathname === child.href;
              return (
                <li key={child.href}>
                  <Link
                    href={child.href}
                    onClick={onNavigate}
                    aria-current={on ? "page" : undefined}
                    className={cn(
                      "relative flex h-8 items-center rounded-md px-2.5 text-[13px] transition-colors",
                      on ? "bg-white/[0.05] text-fg" : "text-fg-3 hover:bg-white/[0.03] hover:text-fg",
                    )}
                  >
                    {on && <span aria-hidden="true" className="absolute -left-[calc(0.75rem+1px)] top-1/2 h-3.5 w-px -translate-y-1/2 bg-accent" />}
                    {child.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="flex h-full flex-col">
      {/* Top: brand + collapse control */}
      <div className={cn("flex h-16 shrink-0 items-center border-b border-line", collapsed ? "justify-center" : "justify-between pl-5 pr-3")}>
        {collapsed ? (
          <Link href="/app" aria-label="Syxoria home" className="text-fg">
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
        <div className={cn(collapsed ? "flex flex-col items-center gap-2" : "space-y-2 px-3")}>
          {collapsed ? (
            <span
              tabIndex={0}
              aria-label={workspace.name}
              {...tipProps(workspace.name)}
              className="grid size-9 place-items-center rounded-md border border-line bg-surface font-display text-[14px] text-accent-strong outline-none"
            >
              {workspace.name.charAt(0)}
            </span>
          ) : (
            <div className="flex items-center gap-3 rounded-md border border-line bg-surface/50 px-3 py-2.5">
              <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-sm bg-accent-soft font-display text-[15px] text-accent-strong">
                {workspace.name.charAt(0)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-fg">{workspace.name}</p>
                <p className="mt-0.5 text-[11.5px] capitalize text-fg-3">{workspace.plan} plan</p>
              </div>
            </div>
          )}
        </div>

        <nav aria-label="Application" className={cn("mt-5", collapsed ? "px-0" : "px-3")}>
          {appNav.map((group) => (
            <div key={group.group} className="mb-4">
              {collapsed ? (
                <div aria-hidden="true" className="mx-auto mb-2 h-px w-6 bg-line" />
              ) : (
                <p className="mb-1.5 px-3 font-label text-[10.5px] uppercase tracking-[0.16em] text-fg-3">{group.group}</p>
              )}
              <ul className={cn("space-y-0.5", collapsed && "flex flex-col items-center")}>{group.items.map(renderItem)}</ul>
            </div>
          ))}
        </nav>
      </div>

      <div className={cn("shrink-0 border-t border-line", collapsed ? "flex flex-col items-center gap-1 py-3" : "p-3")}>
        <KillSwitchShortcut collapsed={collapsed} />
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
