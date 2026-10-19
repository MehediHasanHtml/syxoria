import { Archive, ChartSpline, Compass, ListChecks, MessageCircle, Settings2, type LucideIcon } from "lucide-react";

export type AppNavLeaf = { label: string; href: string };

export type SpaceId = "overview" | "business" | "assistant" | "actions" | "workspace" | "settings";

export type Space = {
  id: SpaceId;
  /** The short name in the bar */
  label: string;
  /** The full name, for its title and screen readers */
  full: string;
  /** Where the space opens */
  href: string;
  icon: LucideIcon;
  /** The routes that belong to it (a route and everything under it) */
  routes: string[];
  /** A count beside the label: what waits for the owner */
  badgeKey?: "approvals";
  /** The space's own pages, as quiet secondary navigation under the bar */
  pages?: AppNavLeaf[];
};

/**
 * The workspace in six spaces instead of ten pages. The capabilities that need no page of their
 * own (search, the assistant's field, notifications, the agenda, Syxoria's status and the kill
 * switch) live in the bar on every page; the daily briefings live inside the Overview.
 * Single place to rename or reorder them.
 */
export const spaces: Space[] = [
  { id: "overview", label: "Overview", full: "Executive Overview", href: "/app", icon: Compass, routes: ["/app/briefings"] },
  {
    id: "business",
    label: "Business",
    full: "Business Management",
    href: "/app/business/sales",
    icon: ChartSpline,
    routes: ["/app/business", "/app/clients"],
    pages: [
      { label: "Sales", href: "/app/business/sales" },
      { label: "Marketing", href: "/app/business/marketing" },
      { label: "Finance", href: "/app/business/finance" },
      { label: "Goals & KPIs", href: "/app/business/goals" },
      { label: "Clients & Prospects", href: "/app/clients" },
    ],
  },
  { id: "assistant", label: "Assistant", full: "Syxoria Assistant", href: "/app/assistant", icon: MessageCircle, routes: ["/app/assistant"] },
  { id: "actions", label: "Actions", full: "Actions & Approvals", href: "/app/actions", icon: ListChecks, routes: ["/app/actions"], badgeKey: "approvals" },
  {
    id: "workspace",
    label: "Workspace",
    full: "Workspace & History",
    href: "/app/documents",
    icon: Archive,
    routes: ["/app/documents", "/app/history"],
    pages: [
      { label: "Documents & Data", href: "/app/documents" },
      { label: "History & Reports", href: "/app/history" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    full: "Integrations & Settings",
    href: "/app/settings",
    icon: Settings2,
    routes: ["/app/settings", "/app/integrations"],
    pages: [
      { label: "Settings & Autonomy", href: "/app/settings" },
      { label: "Integrations", href: "/app/integrations" },
    ],
  },
];

const under = (pathname: string, route: string) => pathname === route || pathname.startsWith(`${route}/`);

/** The space a page belongs to: the Overview is /app itself and its briefings */
export function spaceOf(pathname: string): Space | undefined {
  if (pathname === "/app") return spaces[0];
  return spaces.find((s) => s.routes.some((r) => under(pathname, r)));
}

/** Whether a page of a space is the one open (Sales stays open on /app/business/sales?period=…) */
export const isPageActive = (pathname: string, href: string) => under(pathname, href);

export const ASSISTANT_HREF = "/app/assistant";

/** Where the autonomy, the permissions and the emergency control live */
export const AUTONOMY_HREF = "/app/settings?tab=autonomy";
