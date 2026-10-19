import { loadOverview } from "@/components/dashboard/overview/data";
import { getAutomationContext } from "@/services/automation";
import { getCurrentUser, getNotifications } from "@/services/user";
import { getSearchIndex } from "@/services/workspace";

export type { Figure, Lens } from "@/components/dashboard/overview/data";

/** The overview's own data, plus what the workspace's shell would bring (the concepts draw their own bar) */
export async function loadOverviewConcept({ first = false }: { first?: boolean } = {}) {
  const [overview, searchIndex, notifications, user, automation] = await Promise.all([loadOverview({ first }), getSearchIndex(), getNotifications(), getCurrentUser(), getAutomationContext()]);
  return { ...overview, searchIndex, notifications, user, automation };
}

export type OverviewConceptData = Awaited<ReturnType<typeof loadOverviewConcept>>;
