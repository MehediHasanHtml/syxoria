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
  { id: "n_00", kind: "approval", title: "You approved the reminder to Verrerie Morel", body: "It goes out tomorrow at 9:00. €6,500, nine days overdue.", createdAt: "2026-10-14T18:50:00", read: false, href: "/app/actions?action=reminder_morel" },
  { id: "n_01", kind: "briefing", title: "Your evening briefing is ready", body: "The contract is out. Nora’s quote did not reach her.", createdAt: "2026-10-14T18:30:00", read: false, href: "/app/briefings?briefing=b_evening" },
  { id: "n_02", kind: "approval", title: "Hugo’s March timeline waits for you", body: "A change to a quote: drafted at 17:20, sent as soon as you approve.", createdAt: "2026-10-14T17:20:00", read: false, href: "/app/actions?action=timeline_hugo" },
  { id: "n_04", kind: "reply", title: "Camille opened the contract", body: "Atelier Rive, second time today. Signature due Friday.", createdAt: "2026-10-14T16:02:00", read: false, href: "/app/clients?client=rive" },
  { id: "n_05", kind: "approval", title: "A paid campaign change waits for you", body: "Pause the ‘logo maker’ ad group: €1,450 this month, no qualified lead.", createdAt: "2026-10-14T15:40:00", read: true, href: "/app/actions?action=pause_ads" },
  { id: "n_03", kind: "urgent", title: "Nora’s quote was returned", body: "Her address no longer receives mail. 9:30 tomorrow is held for a call.", createdAt: "2026-10-14T14:12:00", read: true, href: "/app/actions?action=quote_nora" },
  { id: "n_06", kind: "completed", title: "The contract went to Atelier Rive", body: "Sent at 14:10, as soon as you approved it.", createdAt: "2026-10-14T14:10:00", read: true, href: "/app/actions?action=contract_rive" },
  { id: "n_07", kind: "reply", title: "Hugo answered", body: "Maison Lenoir wants to start in March, a month earlier.", createdAt: "2026-10-14T12:15:00", read: true, href: "/app/clients?client=lenoir" },
  { id: "n_08", kind: "connection", title: "Google Drive needs reconnecting", body: "Access lapsed on 12 October. Four new files are waiting to be read.", createdAt: "2026-10-12T16:40:00", read: true, href: "/app/integrations?tool=drive" },
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
