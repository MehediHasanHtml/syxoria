import type { Metadata } from "next";
import { DocumentsView } from "@/components/dashboard/documents/documents-view";
import { getDocuments, getMemory, getTools } from "@/services/workspace";

export const metadata: Metadata = { title: "Documents & Data" };

/** Documents & Data. ?doc= opens one */
export default async function DocumentsPage({ searchParams }: PageProps<"/app/documents">) {
  const [{ doc }, documents, memory, tools] = await Promise.all([searchParams, getDocuments(), getMemory(), getTools()]);
  return <DocumentsView documents={documents} memory={memory} tools={tools} initial={typeof doc === "string" ? doc : undefined} />;
}
