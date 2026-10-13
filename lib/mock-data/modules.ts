import type { ModuleKey, ProductModule } from "@/types";

/**
 * The six modules — read in order, they describe how a company grows:
 * signal → understanding → action → momentum → time → direction.
 * Names/copy are placeholders from the creative concept and can be renamed freely.
 */
export const productModules: ProductModule[] = [
  {
    key: "lume",
    name: "Lume",
    role: "Signal",
    summary: "Every conversation, request and document arrives in one calm stream, so nothing important gets lost.",
    capabilities: ["Unified inbox across email and chat", "Smart grouping by client and topic", "Priority surfacing"],
  },
  {
    key: "nexo",
    name: "Nexo",
    role: "Understanding",
    summary: "The intelligence layer reads what comes in, links it to the right client, project and number.",
    capabilities: ["Context linking across tools", "Entity & intent recognition", "Explainable reasoning"],
  },
  {
    key: "volt",
    name: "Volt",
    role: "Action",
    summary: "Repetitive work becomes quiet automation, reviewed by you and executed reliably.",
    capabilities: ["Automations that wait for approval", "Invoice & reminder flows", "Full audit trail"],
  },
  {
    key: "kairo",
    name: "Kairo",
    role: "Momentum",
    summary: "Goals, targets and performance in one living view that shows what is actually moving.",
    capabilities: ["Goal tracking", "Leading indicators", "Weekly momentum score"],
  },
  {
    key: "zento",
    name: "Zento",
    role: "Time",
    summary: "Workload, deadlines and focus time balanced across the team before they become problems.",
    capabilities: ["Capacity planning", "Deadline forecasting", "Focus blocks"],
  },
  {
    key: "orion",
    name: "Orion",
    role: "Direction",
    summary: "Documents, decisions and knowledge become a navigable map of where the company is heading.",
    capabilities: ["Decision log", "Living documents", "Summaries ready for the board"],
  },
];

export const moduleByKey = Object.fromEntries(productModules.map((m) => [m.key, m])) as Record<
  ModuleKey,
  ProductModule
>;
