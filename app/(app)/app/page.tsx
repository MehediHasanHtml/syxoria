import type { Metadata } from "next";
import { HomeView } from "@/components/dashboard/home/home-overview";
import { getHomeOverview } from "@/services/overview";
import { getCalendar, getWorkspaceActions } from "@/services/workspace";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage() {
  const [data, events, workspaceActions] = await Promise.all([getHomeOverview(), getCalendar(), getWorkspaceActions()]);
  return <HomeView data={data} events={events} workspaceActions={workspaceActions} />;
}
