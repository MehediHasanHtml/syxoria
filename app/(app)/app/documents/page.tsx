import type { Metadata } from "next";
import { PlannedAreaView } from "@/components/dashboard/planned-area";
import { areas } from "@/content/areas";

export const metadata: Metadata = { title: areas.documents.title };

export default function Page() {
  return <PlannedAreaView area={areas.documents} />;
}
