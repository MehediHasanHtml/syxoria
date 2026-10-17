import {
  BriefcaseBusiness,
  FileStack,
  History,
  Home,
  ListChecks,
  MessagesSquare,
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
 * The product's navigation: the ten areas of the brief in six groups, so the sidebar reads as
 * a few clear places rather than ten. Single place to rename or reorder them.
 *
 *   Overview      what is happening in the company, and what Syxoria wants the owner to know
 *   Intelligence  Syxoria itself, to ask, to explore, to instruct
 *   Business      the company: its performance and its relationships
 *   Execution     what Syxoria proposes, prepares and carries out, under the owner's control
 *   Knowledge     what Syxoria knows and what it has done
 *   System        how Syxoria is connected, and what it may do
 *
 * The assistant is also reachable from every page (the field in the top bar, Ctrl K). The
 * emergency control is not a destination: it lives in Settings & Autonomy, with a shortcut in the
 * top bar.
 */
export const appNav: { group: string; items: AppNavItem[] }[] = [
  {
    group: "Overview",
    items: [
      { label: "Home", href: "/app", icon: Home },
      { label: "Daily Briefings", href: "/app/briefings", icon: ScrollText },
    ],
  },
  {
    group: "Intelligence",
    items: [{ label: "Syxoria Assistant", href: "/app/assistant", icon: MessagesSquare }],
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
    group: "Execution",
    items: [{ label: "Actions & Approvals", href: "/app/actions", icon: ListChecks, badgeKey: "approvals" }],
  },
  {
    group: "Knowledge",
    items: [
      { label: "Documents & Data", href: "/app/documents", icon: FileStack },
      { label: "History & Reports", href: "/app/history", icon: History },
    ],
  },
  {
    group: "System",
    items: [
      { label: "Integrations", href: "/app/integrations", icon: Plug },
      { label: "Settings & Autonomy", href: "/app/settings", icon: SlidersHorizontal },
    ],
  },
];

export const ASSISTANT_HREF = "/app/assistant";

/** Where the autonomy, the permissions and the emergency control live */
export const AUTONOMY_HREF = "/app/settings?tab=autonomy";

export function isActive(pathname: string, item: { href: string; matchPrefix?: boolean }) {
  if (item.matchPrefix) return pathname === item.href || pathname.startsWith(`${item.href}/`);
  return pathname === item.href;
}
