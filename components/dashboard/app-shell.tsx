"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isPageActive, spaceOf, spaces } from "@/lib/app-nav";
import type { AutomationContext, Notification, User, Workspace } from "@/types";
import type { CalendarEvent, SearchItem } from "@/types/workspace";
import { AutomationProvider } from "./automation/automation-provider";
import { AutomationBanner, AutomationControl } from "./automation/automation-status";
import { AgendaMenu } from "./global/agenda-menu";
import { CommandSearch } from "./global/command-search";
import { AccountMenu, NotificationsMenu } from "./shell-menus";

export type ShellContext = {
  user: User;
  workspace: Workspace;
  notifications: Notification[];
  /** What waits for the owner, beside Actions & Approvals */
  badges: { approvals: number };
  /** What Syxoria runs on its own and the holds on it: the bar's status and the kill switch */
  automation: AutomationContext;
  /** What global search can find, and the agenda in the bar */
  searchIndex?: SearchItem[];
  events?: CalendarEvent[];
};

/**
 * The workspace's shell: one floating bar instead of a sidebar. The six spaces sit in a pill at
 * its centre (a floating pill at the foot of the screen on phones); search and the assistant
 * (Ctrl K), Syxoria's status with the kill switch, the agenda, notifications and the account sit
 * at its edge. A space with several pages shows them as one quiet line under the bar. Under it,
 * the line that says when autonomous actions are suspended. Styles: "THE SHELL" in
 * app/styles/executive.css.
 */
export function AppShell({ children, ...ctx }: ShellContext & { children: ReactNode }) {
  const pathname = usePathname();
  const current = spaceOf(pathname);

  return (
    <div data-theme="dark" className="editorial-type cx sx">
      <AutomationProvider ctx={ctx.automation}>
        <a href="#app-main" className="sx-skip">
          Skip to content
        </a>

        <header className="sx-bar">
          <Link href="/app" className="sx-brand" aria-label={`Syxoria, ${ctx.workspace.name}`}>
            <span className="sx-brand__word">Syxoria</span>
            <span className="sx-brand__company">{ctx.workspace.name}</span>
          </Link>

          <nav className="sx-spaces" aria-label="Spaces">
            {spaces.map((s) => {
              const Icon = s.icon;
              const count = s.badgeKey ? ctx.badges[s.badgeKey] : 0;
              const on = current?.id === s.id;
              return (
                <Link key={s.id} href={s.href} aria-current={on ? "page" : undefined} className="sx-spaces__item" title={s.full}>
                  <Icon aria-hidden="true" strokeWidth={1.6} />
                  <span className="sx-spaces__label">{s.label}</span>
                  <span className="sr-only">{`, ${s.full}`}</span>
                  {count > 0 && (
                    <span className="sx-spaces__count tabular">
                      {count}
                      <span className="sr-only"> waiting for you</span>
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="sx-tools">
            <div className="sx-search">
              <CommandSearch index={ctx.searchIndex ?? []} />
            </div>
            <AutomationControl />
            <AgendaMenu events={ctx.events ?? []} />
            <NotificationsMenu notifications={ctx.notifications} />
            <AccountMenu user={ctx.user} />
          </div>
        </header>

        {current?.pages && (
          <nav className="sx-pages" aria-label={current.full}>
            {current.pages.map((p) => (
              <Link key={p.href} href={p.href} aria-current={isPageActive(pathname, p.href) ? "page" : undefined}>
                {p.label}
              </Link>
            ))}
          </nav>
        )}

        <AutomationBanner />
        <main id="app-main" tabIndex={-1} className="sx-main" data-space={current?.id}>
          <div className="@container sx-page">{children}</div>
        </main>
      </AutomationProvider>
    </div>
  );
}
