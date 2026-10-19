import type { Metadata } from "next";
import { CenterLab } from "@/components/concept/center/center-lab";
import { AppShell } from "@/components/dashboard/app-shell";
import { loadOverview } from "@/components/dashboard/overview/data";
import { getAutomationContext } from "@/services/automation";
import { getPendingApprovals } from "@/services/overview";
import { getCurrentUser, getNotifications, getWorkspace } from "@/services/user";
import { getCalendar, getSearchIndex } from "@/services/workspace";

export const metadata: Metadata = {
  title: "Centre explorations",
  robots: { index: false, follow: false },
};

/**
 * Three directions for the overview's centre, in the real workspace: the same shell, briefing,
 * thread, dock and Ask Syxoria, only the centre explored.
 *   ?direction=decision · core · sculpture
 *   ?state=calm · anomaly · approval · done
 */
export default async function CenterExplorations({ searchParams }: PageProps<"/concept/center">) {
  const [{ direction, state }, data, user, workspace, notifications, approvals, automation, searchIndex, events] = await Promise.all([
    searchParams,
    loadOverview(),
    getCurrentUser(),
    getWorkspace(),
    getNotifications(),
    getPendingApprovals(),
    getAutomationContext(),
    getSearchIndex(),
    getCalendar(),
  ]);
  return (
    <AppShell space="overview" user={user} workspace={workspace} notifications={notifications} badges={{ approvals }} automation={automation} searchIndex={searchIndex} events={events}>
      <CenterLab data={data} initialDirection={typeof direction === "string" ? direction : undefined} initialState={typeof state === "string" ? state : undefined} />
    </AppShell>
  );
}
