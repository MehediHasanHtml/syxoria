import type { ApprovalRequirement, OperationalLimit, SafetyStop, TeamMember, WorkspaceTool } from "@/types/workspace";

/**
 * The tools Northfield Studio connects, the team and its roles, and the safety settings: what
 * needs approval under each mode, the limits Syxoria works within, and the safety stops so far.
 * Fictional. No dashes or hyphenated words in UI copy.
 */
export const mockTools: WorkspaceTool[] = [
  {
    id: "gmail",
    name: "Gmail",
    logo: "gmail",
    category: "Email",
    status: "connected",
    purpose: "Client conversations, replies and their timing",
    account: "studio@northfield.co",
    synced: "2 minutes ago",
    items: "4,812 emails read",
    permissions: [
      { label: "Read emails and attachments", level: "read" },
      { label: "Send routine replies from your templates", level: "write" },
      { label: "Send new messages", level: "off" },
    ],
    log: [
      { at: "19:03", text: "Synced 6 new emails", ok: true },
      { at: "14:12", text: "One message returned: cotesud-hotels.fr", ok: false },
      { at: "10:00", text: "Two routine replies sent", ok: true },
    ],
  },
  {
    id: "calendar",
    name: "Google Calendar",
    logo: null,
    category: "Calendar",
    status: "connected",
    purpose: "Meetings, deadlines and the holds Syxoria places",
    account: "mael@northfield.co",
    synced: "5 minutes ago",
    items: "3 calendars",
    permissions: [
      { label: "Read events", level: "read" },
      { label: "Place and move holds", level: "write" },
      { label: "Invite people", level: "off" },
    ],
    log: [{ at: "14:20", text: "Hold placed tomorrow 9:30", ok: true }],
  },
  {
    id: "drive",
    name: "Google Drive",
    logo: "drive",
    category: "Storage",
    status: "error",
    purpose: "Proposals, contracts and reports",
    account: "Northfield shared drive",
    synced: "12 Oct, 16:40",
    items: "312 files read",
    note: "Access lapsed on 12 October. Google asks to renew it every 90 days. Four new files are waiting to be read.",
    permissions: [
      { label: "Read files in Proposals, Contracts, Reports", level: "read" },
      { label: "Create and edit files", level: "off" },
    ],
    log: [
      { at: "12 Oct", text: "Access lapsed, reading stopped", ok: false },
      { at: "12 Oct", text: "Synced 2 files", ok: true },
    ],
  },
  {
    id: "hubspot",
    name: "HubSpot",
    logo: "hubspot",
    category: "CRM",
    status: "connected",
    purpose: "Deals, contacts and their history",
    account: "Northfield Studio portal",
    synced: "Just now",
    items: "128 deals, 214 contacts",
    permissions: [
      { label: "Read deals and contacts", level: "read" },
      { label: "Update deal stages and log activity", level: "write" },
      { label: "Delete or merge records", level: "off" },
    ],
    log: [
      { at: "18:40", text: "Logging today’s replies, 3 of 5", ok: true },
      { at: "13:24", text: "Three deal stages updated", ok: true },
    ],
  },
  {
    id: "stripe",
    name: "Stripe",
    logo: "stripe",
    category: "Finance",
    status: "syncing",
    purpose: "Invoices, payments and their dates",
    account: "Northfield Studio",
    synced: "Syncing October payments",
    items: "312 invoices",
    permissions: [
      { label: "Read invoices and payments", level: "read" },
      { label: "Create invoices", level: "off" },
    ],
    log: [{ at: "19:01", text: "Importing October payments, 64%", ok: true }],
  },
  {
    id: "bank",
    name: "Business bank feed",
    logo: null,
    category: "Finance",
    status: "attention",
    purpose: "Balance, expenses and subscriptions",
    account: "Studio current account",
    synced: "This morning, 7:00",
    items: "Read only",
    note: "Consent renews in 6 days. Renew it to keep cash and expense figures current.",
    permissions: [
      { label: "Read balance and transactions", level: "read" },
      { label: "Move money", level: "off" },
    ],
    log: [{ at: "7:00", text: "Daily sync complete", ok: true }],
  },
  { id: "outlook", name: "Outlook", logo: "outlook", category: "Email", status: "available", purpose: "Email and calendar for Microsoft 365 teams" },
  { id: "salesforce", name: "Salesforce", logo: "salesforce", category: "CRM", status: "available", purpose: "Accounts, opportunities and activity" },
  { id: "notion", name: "Notion", logo: "notion", category: "Storage", status: "available", purpose: "Briefs, notes and project pages" },
  { id: "excel", name: "Excel and CSV import", logo: "excel", category: "Storage", status: "available", purpose: "Price lists, exports, any table" },
  { id: "paypal", name: "PayPal", logo: "paypal", category: "Finance", status: "available", purpose: "Payments received through PayPal" },
  { id: "slack", name: "Slack", logo: "slack", category: "Communication", status: "planned", purpose: "Briefings and approvals in your team channels" },
  { id: "teams", name: "Microsoft Teams", logo: null, category: "Communication", status: "planned", purpose: "Meetings, with notes and next steps" },
  { id: "pennylane", name: "Pennylane", logo: null, category: "Finance", status: "planned", purpose: "Accounting and bookkeeping" },
  { id: "whatsapp", name: "WhatsApp Business", logo: null, category: "Communication", status: "planned", purpose: "Client messages on mobile" },
];

export const mockTeam: TeamMember[] = [
  { id: "u_01", name: "Maël Laurent", initials: "ML", email: "mael@northfield.co", title: "Founder & CEO", role: "Owner", access: "Everything, including the kill switch", lastActive: "Now", approves: true },
  { id: "u_02", name: "Inès Moreau", initials: "IM", email: "ines@northfield.co", title: "Head of Operations", role: "Admin", access: "All areas, settings, integrations", lastActive: "18 minutes ago", approves: true },
  { id: "u_03", name: "Théo Garnier", initials: "TG", email: "theo@northfield.co", title: "Finance Lead", role: "Member", access: "Finance, invoices, reports", lastActive: "1 hour ago", approves: true },
  { id: "u_04", name: "Clara Dubois", initials: "CD", email: "clara@northfield.co", title: "Account Manager", role: "Member", access: "Sales, clients, marketing", lastActive: "Today 17:40", approves: false },
  { id: "u_05", name: "Sami Benali", initials: "SB", email: "sami@northfield.co", title: "Advisor", role: "Viewer", access: "Briefings and reports, read only", lastActive: "Monday", approves: false },
];

export const mockApprovals: ApprovalRequirement[] = [
  { id: "ap1", action: "Routine replies to existing clients", guided: "ask", assisted: "ask", autonomous: "auto" },
  { id: "ap2", action: "Update deal stages and log activity", guided: "ask", assisted: "auto", autonomous: "auto" },
  { id: "ap3", action: "Place holds in your calendar", guided: "ask", assisted: "auto", autonomous: "auto" },
  { id: "ap4", action: "First message to a new contact", guided: "ask", assisted: "ask", autonomous: "ask", locked: "Always waits for you" },
  { id: "ap5", action: "Quotes, invoices and payment reminders", guided: "ask", assisted: "ask", autonomous: "ask", locked: "Always waits for you" },
  { id: "ap6", action: "Change a paid campaign", guided: "ask", assisted: "ask", autonomous: "ask", locked: "Always waits for you" },
  { id: "ap7", action: "Contracts and changes to a signed scope", guided: "ask", assisted: "ask", autonomous: "ask", locked: "Always waits for you" },
];

export const mockLimits: OperationalLimit[] = [
  { id: "l1", label: "Messages sent on its own", value: "20 a day", detail: "Beyond that, the next ones wait for you" },
  { id: "l2", label: "Sending hours", value: "9:00 to 19:00", detail: "Weekdays only, your time zone" },
  { id: "l3", label: "Largest amount it may mention", value: "€5,000", detail: "Any message naming more waits for you" },
  { id: "l4", label: "Discount it may offer", value: "None", detail: "Prices always come from your grid" },
  { id: "l5", label: "Campaign spend change", value: "Never on its own", detail: "Pausing or raising spend always asks" },
];

export const mockRestricted = ["Move money or make payments", "Delete your data", "Share your data outside your company", "Change its own permissions", "Sign anything on your behalf", "Speak on calls or in meetings"];

export const mockSafetyStops: SafetyStop[] = [
  {
    id: "ss1",
    at: "Today 14:12",
    reason: "A message to cotesud-hotels.fr was returned",
    held: "Routine replies to that domain only",
    inFlight: "None: nothing else was on its way",
    resolved: "Lifts when a working address is on file",
  },
  {
    id: "ss2",
    at: "13 Oct, 10:41",
    reason: "Unusual volume: 9 replies prepared in 4 minutes",
    held: "Routine replies, for 30 minutes",
    inFlight: "2 replies already accepted by Gmail went out",
    resolved: "Reviewed and resumed by Maël at 11:05",
  },
];
