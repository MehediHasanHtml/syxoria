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

/** The demo day's notifications (the story of lib/mock-data/briefings.ts), newest first */
export const mockNotifications: Notification[] = [
  {
    id: "n_01",
    title: "Your evening briefing is ready",
    body: "The contract is out. Nora’s quote did not reach her.",
    createdAt: "2026-10-14T18:30:00",
    read: false,
    href: "/app/briefings?briefing=b_evening",
  },
  {
    id: "n_02",
    title: "Hugo’s March timeline waits for you",
    body: "A change to a quote: drafted at 17:20, sent as soon as you approve.",
    createdAt: "2026-10-14T17:20:00",
    read: false,
    href: "/app/actions",
  },
  {
    id: "n_03",
    title: "Nora’s quote was returned",
    body: "Her address no longer receives mail. 9:30 tomorrow is held for a call.",
    createdAt: "2026-10-14T14:12:00",
    read: true,
    href: "/app/briefings?briefing=b_evening",
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
  { userId: "u_03", state: "away", note: "Focused on the month end close" },
  { userId: "u_04", state: "online", note: "Chasing the Halden renewal" },
  { userId: "u_05", state: "offline", note: "Back Monday" },
];
