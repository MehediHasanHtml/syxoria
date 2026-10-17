import {
  BriefcaseBusiness,
  FileStack,
  History,
  Home,
  ListChecks,
  Plug,
  ScrollText,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AppNavLeaf = { label: string; href: string };

export type AppNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Match nested routes (e.g. /app/business/sales) */
  matchPrefix?: boolean;
  /** A count beside the label: what waits for the owner */
  badgeKey?: "approvals";
  /** Contextual sections, shown under the item while it is open (Business Management) */
  children?: AppNavLeaf[];
};

/**
 * The product's navigation: the ten areas of the brief in four groups, so the sidebar reads as
 * a few clear places rather than ten. Single place to rename or reorder them.
 *
 *   Overview   what is happening and what waits for the owner
 *   Business   the company itself: its performance and its relationships
 *   Records    what Syxoria knows and what it has done
 *   Setup      how Syxoria is connected and what it may do
 *
 * The assistant is not in the list: it is reachable from everywhere (the sidebar's "Ask Syxoria"
 * and the field in the top bar, Ctrl K).
 */
export const appNav: { group: string; items: AppNavItem[] }[] = [
  {
    group: "Overview",
    items: [
      { label: "Home", href: "/app", icon: Home },
      { label: "Daily Briefings", href: "/app/briefings", icon: ScrollText },
      { label: "Actions & Approvals", href: "/app/actions", icon: ListChecks, badgeKey: "approvals" },
    ],
  },
  {
    group: "Business",
    items: [
      {
        label: "Business Management",
        href: "/app/business",
        icon: BriefcaseBusiness,
        matchPrefix: true,
        children: [
          { label: "Sales", href: "/app/business/sales" },
          { label: "Marketing", href: "/app/business/marketing" },
          { label: "Finance", href: "/app/business/finance" },
          { label: "Goals & KPIs", href: "/app/business/goals" },
        ],
      },
      { label: "Clients & Prospects", href: "/app/clients", icon: Users, matchPrefix: true },
    ],
  },
  {
    group: "Records",
    items: [
      { label: "Documents & Data", href: "/app/documents", icon: FileStack },
      { label: "History & Reports", href: "/app/history", icon: History },
    ],
  },
  {
    group: "Setup",
    items: [
      { label: "Integrations", href: "/app/integrations", icon: Plug },
      { label: "Settings & Autonomy", href: "/app/settings", icon: SlidersHorizontal },
    ],
  },
];

export const ASSISTANT_HREF = "/app/assistant";

export function isActive(pathname: string, item: { href: string; matchPrefix?: boolean }) {
  if (item.matchPrefix) return pathname === item.href || pathname.startsWith(`${item.href}/`);
  return pathname === item.href;
}
