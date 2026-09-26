import type { Metadata } from "next";
import { ActivityView } from "@/components/dashboard/activity-view";
import { PageHeader } from "@/components/dashboard/page-header";
import { getActivity } from "@/services/activity";
import { getMembers } from "@/services/user";

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage() {
  const [items, users] = await Promise.all([getActivity(), getMembers()]);
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Workspace", href: "/app" }, { label: "Activity" }]}
        title="Activity"
        description="A complete, explainable history of what your team and your automations did."
      />
      <ActivityView items={items} users={users} />
    </>
  );
}
