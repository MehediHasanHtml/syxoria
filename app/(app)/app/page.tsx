import type { Metadata } from "next";
import { HomeView } from "@/components/dashboard/home/home-overview";
import { getHomeOverview } from "@/services/overview";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage() {
  const data = await getHomeOverview();
  return <HomeView data={data} />;
}
