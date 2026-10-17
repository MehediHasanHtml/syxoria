import type { Metadata } from "next";
import { ClientsView } from "@/components/dashboard/clients/clients-view";
import { getCalendar, getClients, getWorkspaceActions } from "@/services/workspace";

export const metadata: Metadata = { title: "Clients & Prospects" };

/** Clients & Prospects. ?client= opens a profile, ?filter=attention the relationships that need you */
export default async function ClientsPage({ searchParams }: PageProps<"/app/clients">) {
  const [{ client, filter }, clients, events, actions] = await Promise.all([searchParams, getClients(), getCalendar(), getWorkspaceActions()]);
  return (
    <ClientsView
      clients={clients}
      events={events}
      statuses={Object.fromEntries(actions.map((a) => [a.id, a.status]))}
      initial={typeof client === "string" ? client : undefined}
      initialTab={filter === "attention" ? "attention" : undefined}
    />
  );
}
