import { Activity, BarChart3, FolderKanban, LayoutGrid, Settings, Sparkles, type LucideIcon } from "lucide-react";

export type AppNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Match nested routes (e.g. /app/projects/[id]) */
  matchPrefix?: boolean;
  badgeKey?: "insights";
};

/** Single place to rename/reorder product navigation. */
export const appNav: { group: string; items: AppNavItem[] }[] = [
  {
    group: "Workspace",
    items: [
      { label: "Overview", href: "/app", icon: LayoutGrid },
      { label: "Projects", href: "/app/projects", icon: FolderKanban, matchPrefix: true },
      { label: "Analytics", href: "/app/analytics", icon: BarChart3 },
      { label: "Insights", href: "/app/insights", icon: Sparkles, badgeKey: "insights" },
      { label: "Activity", href: "/app/activity", icon: Activity },
    ],
  },
  {
    group: "Account",
    items: [{ label: "Settings", href: "/app/settings", icon: Settings }],
  },
];

export function isActive(pathname: string, item: AppNavItem) {
  if (item.matchPrefix) return pathname === item.href || pathname.startsWith(`${item.href}/`);
  return pathname === item.href;
}
