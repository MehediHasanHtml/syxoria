import type { Notification, NotificationPreferences, Presence, User, Workspace } from "@/types";

export const mockUsers: User[] = [
  { id: "u_01", name: "Maël Laurent", email: "mael@northfield.co", role: "owner", initials: "ML", title: "Founder & CEO" },
  { id: "u_02", name: "Inès Moreau", email: "ines@northfield.co", role: "admin", initials: "IM", title: "Head of Operations" },
  { id: "u_03", name: "Théo Garnier", email: "theo@northfield.co", role: "member", initials: "TG", title: "Finance Lead" },
  { id: "u_04", name: "Clara Dubois", email: "clara@northfield.co", role: "member", initials: "CD", title: "Account Manager" },
  { id: "u_05", name: "Sami Benali", email: "sami@northfield.co", role: "viewer", initials: "SB", title: "Advisor" },
];

export const mockCurrentUserId = "u_01";

export const mockWorkspace: Workspace = {
  id: "ws_northfield",
  name: "Northfield Studio",
  plan: "growth",
  seats: { used: 5, total: 10 },
  region: "eu-west",
};

export const mockNotifications: Notification[] = [
  {
    id: "n_01",
    title: "New insight on cash collection",
    body: "Nexo found 4 invoices that can be followed up automatically.",
    createdAt: "2026-09-24T08:52:00.000Z",
    read: false,
    href: "/app/insights",
  },
  {
    id: "n_02",
    title: "Client onboarding reached 80%",
    body: "Inès completed the contract milestone.",
    createdAt: "2026-09-24T07:10:00.000Z",
    read: false,
    href: "/app/projects/p_onboarding",
  },
  {
    id: "n_03",
    title: "Weekly digest is ready",
    body: "6h 42m saved this week across 12 automations.",
    createdAt: "2026-09-22T06:00:00.000Z",
    read: true,
    href: "/app/analytics",
  },
];

export const mockNotificationPreferences: NotificationPreferences = {
  weeklyDigest: true,
  insightAlerts: true,
  projectUpdates: true,
  productNews: false,
};

export const mockPresence: Presence[] = [
  { userId: "u_01", state: "online", note: null },
  { userId: "u_02", state: "online", note: "Kickoff calls until 11:30" },
  { userId: "u_03", state: "away", note: "Heads-down on month-end close" },
  { userId: "u_04", state: "online", note: "Chasing the Halden renewal" },
  { userId: "u_05", state: "offline", note: "Back Monday" },
];
