import type { Metadata } from "next";
import { ActionsView } from "@/components/dashboard/actions/actions-view";
import { getWorkspaceActions } from "@/services/workspace";

export const metadata: Metadata = { title: "Actions & Approvals" };

/** Actions & Approvals. ?action= opens one in detail */
export default async function ActionsPage({ searchParams }: PageProps<"/app/actions">) {
  const [{ action }, actions] = await Promise.all([searchParams, getWorkspaceActions()]);
  return <ActionsView actions={actions} initial={typeof action === "string" ? action : undefined} />;
}
