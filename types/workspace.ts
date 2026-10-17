import type { BriefingActionStatus, BriefingSeverity, PermissionMode, TimePoint } from "./index";

/* ==========================================================================
 * The workspace's own data: Business Management, Clients & Prospects, Actions & Approvals,
 * Documents & Data, History & Reports, Integrations, the assistant's conversations, the calendar
 * and search. One fictional company (Northfield Studio) on one demo day (Wednesday 14 October),
 * the same story as the briefings: the same clients, the same actions, the same figures.
 * ========================================================================== */

/** A reporting period every Business Management category can be read over */
export type PeriodId = "month" | "half" | "year";
export type Period = { id: PeriodId; label: string };

/** One figure, with what it compares with when that is honest */
export type Kpi = {
  id: string;
  label: string;
  value: string;
  caption: string;
  delta?: { text: string; direction: "up" | "down"; good: boolean };
  /** A few points of its recent trend, oldest first */
  spark?: number[];
  /** Progress towards a target, 0 to 1 */
  progress?: number;
};

export type InsightKind = "opportunity" | "risk" | "growth" | "change" | "anomaly";

/** Something Syxoria noticed: what, why it matters, and where it leads */
export type Insight = {
  id: string;
  kind: InsightKind;
  title: string;
  body: string;
  /** What it rests on, in a few words */
  basis: string;
  /** Its consequence in one tag ("Probability 78%") */
  tag: string;
  href: string;
};

export type Priority3 = "high" | "medium" | "low";

/** A recommended next step: what, why, and whether it needs the owner's word */
export type WorkspaceRec = {
  id: string;
  title: string;
  why: string;
  area: string;
  client?: string;
  priority: Priority3;
  /** The action it opens, when one is prepared or can be */
  actionId?: string;
  /** The button's word ("Review", "Prepare", "Plan") */
  cta: string;
  approval: boolean;
};

/** The one thing a page asks the owner to focus on, with the chain it runs through */
export type FocusPriority = {
  label: string;
  title: string;
  why: string;
  severity: BriefingSeverity;
  stake?: string;
  due?: string;
  /** Business data, analysis, recommendation, action, follow up: how far it has gone */
  chain: { label: string; detail: string; state: "done" | "now" | "next" | "failed" }[];
  cta: string;
  href: string;
};

export type ChartSet = { series: TimePoint[]; compare?: TimePoint[]; label: string };

/* ---------- Sales ---------- */
export type DealStage = "lead" | "qualified" | "proposal" | "negotiation" | "won";
export type Deal = {
  id: string;
  name: string;
  clientId: string;
  client: string;
  contact: string;
  value: number;
  stage: DealStage;
  probability: number;
  lastActivity: string;
  nextStep: string;
  owner: string;
  flag?: "hot" | "risk" | "quiet";
};
export type Interaction = {
  id: string;
  at: string;
  kind: "email" | "call" | "meeting" | "document" | "note";
  title: string;
  detail: string;
  clientId?: string;
  by: "you" | "client" | "syxoria" | "team";
};
export type SalesData = {
  periods: Record<PeriodId, { kpis: Kpi[]; chart: ChartSet }>;
  insights: Insight[];
  focus: FocusPriority;
  pipeline: { stage: DealStage; label: string; count: number; value: number }[];
  deals: Deal[];
  interactions: Interaction[];
  quiet: { id: string; client: string; contact: string; days: number; value: number; reason: string; clientId: string }[];
  recommendations: WorkspaceRec[];
};

/* ---------- Marketing ---------- */
export type Campaign = {
  id: string;
  name: string;
  channel: string;
  status: "live" | "scheduled" | "ended" | "paused" | "draft";
  dates: string;
  spend: number;
  leads: number;
  qualified: number;
  costPerLead: number | null;
  change?: { text: string; good: boolean };
};
export type Channel = { id: string; label: string; leads: number; signed: number; revenue: number; cost: number; change: { text: string; good: boolean } };
export type MarketingData = {
  periods: Record<PeriodId, { kpis: Kpi[]; chart: ChartSet }>;
  insights: Insight[];
  focus: FocusPriority;
  campaigns: Campaign[];
  channels: Channel[];
  funnel: { label: string; value: number; note: string }[];
  content: { id: string; title: string; kind: string; views: number; engagement: string; leads: number }[];
  improvements: { id: string; title: string; detail: string; impact: string }[];
  recommendations: WorkspaceRec[];
};

/* ---------- Finance ---------- */
export type Invoice = {
  id: string;
  number: string;
  client: string;
  clientId: string;
  amount: number;
  issued: string;
  due: string;
  status: "draft" | "sent" | "due-soon" | "overdue" | "paid";
  /** Days late, or days left when due soon */
  days?: number;
  note?: string;
};
export type FinanceData = {
  periods: Record<PeriodId, { kpis: Kpi[]; cash: { month: string; in: number; out: number }[]; balance: TimePoint[] }>;
  insights: Insight[];
  focus: FocusPriority;
  invoices: Invoice[];
  expenses: { id: string; label: string; amount: number; change: { text: string; good: boolean }; flag?: string }[];
  upcoming: { id: string; label: string; date: string; amount: number; kind: "in" | "out" }[];
  recommendations: WorkspaceRec[];
};

/* ---------- Goals & KPIs ---------- */
export type GoalStatus = "on-track" | "at-risk" | "behind" | "achieved";
export type Goal = {
  id: string;
  title: string;
  area: string;
  metric: string;
  target: string;
  current: string;
  progress: number;
  /** Where the progress should be today, at an even pace (0 to 1) */
  expected: number;
  gap: string;
  deadline: string;
  owner: string;
  status: GoalStatus;
  why: string;
  series: TimePoint[];
  recommendations: { title: string; actionId?: string; approval: boolean }[];
};
export type ScoreLine = { id: string; label: string; value: string; target: string; deviation: string; status: GoalStatus; area: string };
export type GoalsData = {
  periods: Record<PeriodId, { kpis: Kpi[]; scoreboard: ScoreLine[] }>;
  goals: Goal[];
  deviations: Insight[];
  focus: FocusPriority;
};

/* ---------- Clients & Prospects ---------- */
export type ClientHealth = "strong" | "steady" | "attention" | "risk";
export type Client = {
  id: string;
  name: string;
  kind: "client" | "prospect";
  sector: string;
  city: string;
  since: string;
  contact: { name: string; role: string; email: string; phone: string };
  owner: string;
  health: ClientHealth;
  /** Where the relationship stands ("Contract sent") */
  status: string;
  value: number;
  /** Revenue to date, for clients */
  lifetime?: number;
  last: { at: string; text: string };
  next: { at: string; text: string };
  opportunities: { name: string; value: number; stage: string }[];
  timeline: { at: string; kind: Interaction["kind"]; text: string }[];
  documents: { name: string; type: string; date: string }[];
  recommendation?: { title: string; why: string; actionId?: string; approval: boolean };
  attention?: string;
};

/* ---------- Actions & Approvals ---------- */
export type ActionStageState = "done" | "now" | "next" | "failed" | "waiting";
export type WorkspaceAction = {
  id: string;
  title: string;
  purpose: string;
  area: "Sales" | "Marketing" | "Finance" | "Clients" | "Operations";
  client?: string;
  clientId?: string;
  priority: Priority3;
  status: BriefingActionStatus;
  /** When it last moved, and how ("Drafted 17:20") */
  updated: string;
  needsApproval: boolean;
  /** The permission it runs under, and why */
  permission: { rule: string; mode: PermissionMode; reason: string };
  why: string;
  sources: string[];
  /** What exactly Syxoria intends to do */
  preview?: { kind: "email" | "calendar" | "crm" | "document" | "campaign"; to?: string; subject?: string; body?: string[]; fields?: { label: string; value: string }[] };
  stages: { label: string; state: ActionStageState; at?: string; note?: string }[];
  /** What came of it, once there is a result */
  result?: string;
  /** Why it stopped, when it did */
  error?: string;
  /** Another action it waits on */
  dependsOn?: string;
};

/* ---------- Documents & Data ---------- */
export type DocCategory = "Proposals" | "Contracts" | "Invoices" | "Reports" | "Briefs" | "Data";
export type WorkspaceDoc = {
  id: string;
  name: string;
  type: "PDF" | "DOCX" | "XLSX" | "PPTX" | "CSV" | "PNG";
  category: DocCategory;
  source: "Uploaded" | "Google Drive" | "Gmail" | "HubSpot";
  client?: string;
  owner: string;
  modified: string;
  size: string;
  read: "read" | "reading" | "not read";
  summary: string;
  facts: { label: string; value: string }[];
  uses: string[];
};
export type MemoryItem = { id: string; group: "Business context" | "Objectives" | "Preferences" | "Key facts"; text: string; source: string; learned: string };

/* ---------- History & Reports ---------- */
export type HistoryKind = "insight" | "recommendation" | "action" | "approval" | "error" | "briefing" | "safety" | "connection";
export type HistoryEvent = {
  id: string;
  at: string;
  day: string;
  kind: HistoryKind;
  title: string;
  detail: string;
  status: "done" | "pending" | "failed" | "interrupted" | "info";
  why?: string;
  approval?: string;
  followed?: string;
  result?: string;
  sources?: string[];
  href?: string;
};
export type Report = {
  id: string;
  title: string;
  period: string;
  kind: "Weekly" | "Monthly" | "Quarterly";
  generated: string;
  summary: string;
  highlights: { label: string; value: string; delta?: string; good?: boolean }[];
  sections: { title: string; text: string }[];
};

/* ---------- Integrations ---------- */
export type ToolStatus = "connected" | "syncing" | "attention" | "error" | "available" | "planned";
export type WorkspaceTool = {
  id: string;
  name: string;
  logo: string | null;
  category: "Email" | "Calendar" | "Storage" | "CRM" | "Finance" | "Communication";
  status: ToolStatus;
  purpose: string;
  account?: string;
  synced?: string;
  items?: string;
  permissions?: { label: string; level: "read" | "write" | "off" }[];
  note?: string;
  log?: { at: string; text: string; ok: boolean }[];
};

/* ---------- The assistant ---------- */
export type AssistantBlock =
  | { kind: "text"; text: string }
  | { kind: "figures"; items: { label: string; value: string; note?: string }[] }
  | { kind: "list"; title?: string; items: string[] }
  | { kind: "action"; actionId: string }
  | { kind: "sources"; items: { label: string; detail: string; href: string }[] };
export type AssistantMessage = { id: string; from: "you" | "syxoria"; at: string; text?: string; blocks?: AssistantBlock[] };
export type Conversation = { id: string; title: string; group: "Today" | "Yesterday" | "Previous 7 days"; updated: string; messages: AssistantMessage[]; actions: string[] };

/* ---------- Calendar, search, notifications ---------- */
export type CalendarEvent = {
  id: string;
  day: "Today" | "Tomorrow" | "Friday" | "Monday" | "Next week";
  time: string;
  kind: "meeting" | "call" | "deadline" | "follow-up" | "action";
  title: string;
  with?: string;
  note?: string;
  href: string;
};
export type SearchItem = { id: string; kind: "Clients" | "Documents" | "Conversations" | "Actions" | "Decisions" | "Pages"; title: string; detail: string; href: string };
export type NotificationKind = "urgent" | "approval" | "reply" | "completed" | "connection" | "briefing";

/* ---------- Settings ---------- */
export type TeamMember = { id: string; name: string; initials: string; email: string; title: string; role: "Owner" | "Admin" | "Member" | "Viewer"; access: string; lastActive: string; approves: boolean };
export type ApprovalRequirement = { id: string; action: string; guided: PermissionMode; assisted: PermissionMode; autonomous: PermissionMode; locked?: string };
export type OperationalLimit = { id: string; label: string; value: string; detail: string };
export type SafetyStop = { id: string; at: string; reason: string; held: string; inFlight: string; resolved: string };
