/**
 * Domain types. These are the contract between UI and data.
 * When the real API lands, map API responses to these shapes inside
 * /services and the UI stays untouched.
 */

/* ---------- Modules (the six product branches) ---------- */
export type ModuleKey = "lume" | "nexo" | "volt" | "kairo" | "zento" | "orion";

export type ProductModule = {
  key: ModuleKey;
  name: string;
  role: string; // one-word role in the growth story
  summary: string;
  capabilities: string[];
};

/* ---------- People & workspace ---------- */
export type UserRole = "owner" | "admin" | "member" | "viewer";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  initials: string;
  title?: string;
};

export type PresenceState = "online" | "away" | "offline";

/** Lightweight "where is everyone" status, written by people themselves. */
export type Presence = {
  userId: string;
  state: PresenceState;
  note: string | null;
};

export type Plan = "starter" | "growth" | "enterprise";

export type Workspace = {
  id: string;
  name: string;
  plan: Plan;
  seats: { used: number; total: number };
  region: "eu-west" | "us-east";
};

/* ---------- Projects ---------- */
export type ProjectStatus = "on-track" | "at-risk" | "blocked" | "completed" | "paused";
/** Growth stage — mirrors the tree metaphor used across the brand. */
export type ProjectStage = "seed" | "rooting" | "growing" | "flourishing";

export type Project = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  stage: ProjectStage;
  progress: number; // 0–100
  module: ModuleKey;
  ownerId: string;
  memberIds: string[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
  dueDate: string | null;
  impact: { value: number; hoursSaved: number }; // € recovered, hours saved / month
  milestones: Milestone[];
  progressHistory: TimePoint[];
};

export type Milestone = {
  id: string;
  title: string;
  done: boolean;
  dueDate: string | null;
};

export type CreateProjectInput = {
  name: string;
  description: string;
  module: ModuleKey;
  dueDate: string | null;
};

export type ProjectSort = "updated" | "progress" | "name" | "impact";

export type ProjectQuery = {
  search?: string;
  status?: ProjectStatus | "all";
  module?: ModuleKey | "all";
  sort?: ProjectSort;
};

/* ---------- Metrics & analytics ---------- */
export type MetricFormat = "currency" | "number" | "duration" | "percent";

export type Metric = {
  id: string;
  label: string;
  value: number;
  format: MetricFormat;
  /** Relative change vs previous period, in % */
  delta: number;
  /** Is an increase good? (e.g. "response time" is inverted) */
  positiveIsGood: boolean;
  trend: number[];
  module: ModuleKey;
};

export type TimePoint = { date: string; value: number };

export type TimeRange = "7d" | "30d" | "90d" | "12m";

export type AnalyticsSeries = {
  id: string;
  label: string;
  points: TimePoint[];
};

export type AnalyticsBreakdown = {
  label: string;
  value: number;
  module: ModuleKey;
};

export type AnalyticsReport = {
  range: TimeRange;
  summary: Metric[];
  growth: AnalyticsSeries; // headline curve
  baseline: AnalyticsSeries; // comparison (previous period)
  automationsByModule: AnalyticsBreakdown[];
  weeklyHours: TimePoint[];
};

/* ---------- Growth progression (the curve) ---------- */
/* ---------- Insights ---------- */
export type InsightPriority = "high" | "medium" | "low";
export type InsightStatus = "new" | "in-review" | "applied" | "dismissed" | "locked" | "processing";

export type Insight = {
  id: string;
  title: string;
  summary: string;
  rationale: string;
  priority: InsightPriority;
  status: InsightStatus;
  module: ModuleKey;
  confidence: number; // 0–1
  impact: { label: string; value: string };
  createdAt: string;
  projectId: string | null;
};

/* ---------- Activity & notifications ---------- */
export type ActivityKind = "automation" | "insight" | "project" | "integration" | "member";

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  actorId: string | "system";
  message: string;
  target: string;
  module: ModuleKey;
  createdAt: string;
  projectId: string | null;
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href: string | null;
};

/* ---------- Integrations ---------- */
export type Integration = {
  id: string;
  name: string;
  category: "Communication" | "Documents" | "Finance" | "CRM" | "Data" | "Workspace";
  connected: boolean;
};

/* ---------- Settings ---------- */
export type NotificationPreferences = {
  weeklyDigest: boolean;
  insightAlerts: boolean;
  projectUpdates: boolean;
  productNews: boolean;
};

/* ---------- Pricing ---------- */
export type BillingCycle = "monthly" | "yearly";

export type PricingPlan = {
  id: Plan;
  name: string;
  description: string;
  price: { monthly: number | null; yearly: number | null }; // per month, excl. VAT
  highlighted: boolean;
  cta: { label: string; href: string };
  features: string[];
};

/* ---------- Onboarding (the system meets a company) ---------- */
/** The single continuous onboarding, as one state — the UI reacts to it rather than to pages. */
export type OnboardingStage = "account" | "company" | "connections" | "syncing" | "analysis" | "autonomy" | "briefing" | "complete";

export type AccountSession = {
  email: string;
  /** From the email when it looks like a name ("mael@…" → "Maël"); null otherwise */
  firstName: string | null;
  /** Signed in to an existing account rather than created one */
  returning: boolean;
};

export type CompanyEditableField = "name" | "address" | "headcount";

/** A company as the national register (INSEE / Sirene) describes it, then as the user confirmed it. */
export type CompanyProfile = {
  siren: string;
  siret: string | null;
  name: string;
  legalName: string;
  legalForm: string;
  address: string;
  city: string;
  activity: { code: string; label: string };
  /** Plain-language sector the analysis talks about ("design studio") */
  sector: string;
  founded: string; // ISO date
  headcount: string;
  director: string | null;
  source: "register" | "manual";
  /** Fields the user corrected after the lookup */
  edited: CompanyEditableField[];
};

export type SourceCategory = "email" | "crm" | "documents" | "finance" | "files";

export type DataSource = {
  id: string;
  name: string;
  /** IntegrationLogo id, when the brand mark is available */
  logo: string | null;
  category: SourceCategory;
  /** Why it matters, in one line */
  purpose: string;
  /** What Syxoria will be able to see — always read-only during onboarding */
  reads: string[];
  kind: "oauth" | "file";
};

/**
 * A connector's state — one model for every tool, in onboarding and later in Settings:
 * available (not connected) → connecting → connected; error (the attempt failed, nothing was
 * shared); reconnect (it was connected, but access lapsed and needs renewing).
 */
export type ConnectorState = "available" | "connecting" | "connected" | "error" | "reconnect";
export type SourceConnection = {
  status: Exclude<ConnectorState, "available">;
  /** Connecting: the step in progress · connected: what was found · error/reconnect: what happened */
  note?: string;
};

export type KnowledgeKind = "clients" | "conversations" | "quotes" | "opportunities" | "invoices" | "documents";

export type KnowledgeEntry = { kind: KnowledgeKind; label: string; count: number; from: string[] };

/** A relationship the system established between two kinds of records ("conversations matched to clients") */
export type Relationship = { from: KnowledgeKind; to: KnowledgeKind; label: string };

/** Something the system concluded while reading — a fact about the business, not a row count */
export type Discovery = { id: string; value: string; label: string; tone: "fact" | "attention" };

/** What the understanding stream reports as it reads the company (later: server-sent events). */
export type UnderstandingEvent =
  | { type: "phase"; id: string; message: string }
  | { type: "found"; kind: KnowledgeKind; count: number }
  | { type: "link"; relationship: Relationship }
  | { type: "discovery"; discovery: Discovery }
  | { type: "done"; knowledge: KnowledgeEntry[]; period: string };

/** A point of evidence behind a priority: a number, and what it is */
export type PriorityKpi = { id: string; label: string; value: string };

/**
 * What deserves attention — identified by the system, never configured by the user.
 * Priority (what) → insight (what was discovered) → KPIs (the evidence), and what the graph draws.
 */
export type Priority = {
  id: string;
  title: string;
  insight: string;
  kpis: PriorityKpi[];
  /** Where it comes from, in words ("HubSpot deals and Gmail threads") */
  basedOn: string;
  graph: {
    label: string;
    unit: "%" | "€" | "days";
    /** Twelve months, oldest first, and their short names */
    series: number[];
    months: string[];
    /** A level worth comparing against (a target, your payment terms…) */
    reference?: { value: number; label: string };
    /** The stretch the system points at, as indices into series */
    focus: [number, number];
    focusLabel: string;
  };
};

export type InitialAnalysis = { priorities: Priority[] };

export type AutonomyLevel = "guided" | "assisted" | "autonomous";
export type PermissionMode = "auto" | "ask" | "off";

export type PermissionRule = {
  id: string;
  label: string;
  description: string;
  group: "understand" | "prepare" | "act";
  defaults: Record<AutonomyLevel, PermissionMode>;
  /** Modes the user may pick — sensitive actions can never become automatic */
  allowed: PermissionMode[];
  lockedReason?: string;
};

/** One step of the example the mandate plays out: who does it under this level, and where Syxoria stops */
export type ScenarioStep = { id: string; label: string; by: "syxoria" | "you" };

export type AutonomyPolicy = {
  recommended: AutonomyLevel;
  levels: { id: AutonomyLevel; name: string; summary: string; scenario: ScenarioStep[] }[];
  /** The situation every level's scenario plays out ("Atelier Rive has gone quiet for 12 days") */
  scenarioSubject: string;
  rules: PermissionRule[];
  /** Hard limits, whatever the level */
  never: string[];
};

export type Mandate = { level: AutonomyLevel; overrides: Record<string, PermissionMode> };

export type BriefingDraft = {
  id: string;
  contact: string;
  company: string;
  subject: string;
  value: number;
  quietDays: number;
  /** The last thing they wrote, in their own words — the message still waiting for an answer */
  asked: string;
};

/**
 * Priority → insight → recommendation → action: the briefing reads as one line of reasoning.
 * Each step's `title` is what the screen says; its `detail` is the fuller sentence, for screen
 * readers and for the briefing read at length.
 */
export type Briefing = {
  priority: { title: string; detail: string };
  insight: {
    title: string;
    detail: string;
    /** The words of the title the screen leans on ("half as often") */
    stress?: string;
    /** The silence it is about: the deal the briefing opens on, and after how many quiet days the company’s deals start to slip */
    quiet?: { draftId: string; threshold: number };
    /**
     * How often the company’s deals closed, by how many days the client had been waiting for an
     * answer (index = days, from 0): measured on its own history, never a benchmark
     */
    curve?: number[];
  };
  recommendation: { title: string; detail: string; stress?: string };
  /** What acting on it can achieve, measured on the company’s own history ("2×" · "as likely to close …") */
  impact?: { value: string; label: string };
  /** The replies the action is about — what Syxoria may do with them depends on the mandate and the tools */
  drafts: BriefingDraft[];
  basedOn: string;
};

/** What the system is doing inside a moment — it drives the Core and the word beside it */
export type OnboardingActivity = "searching" | "found" | "connecting" | null;

/** Everything the onboarding has learned so far — also what the backend returns to resume it. */
export type OnboardingSnapshot = {
  stage: OnboardingStage;
  session: AccountSession | null;
  company: CompanyProfile | null;
  /** Only sources the user touched; absent = not connected */
  connections: Record<string, SourceConnection>;
  /** The company the register returned, before the user confirmed it */
  candidate: CompanyProfile | null;
  activity: OnboardingActivity;
  /** Running counts while the system reads, then final */
  found: Partial<Record<KnowledgeKind, number>>;
  knowledge: KnowledgeEntry[] | null;
  analysis: InitialAnalysis | null;
  mandate: Mandate | null;
  briefing: Briefing | null;
};

/* ---------- Daily briefings (morning · midday · evening) ----------
 * One briefing = one line of reasoning: priority → insight → recommendation → action. Each step
 * names the one it follows from, so the screen can show how a finding leads to what Syxoria does.
 * Nothing here is tied to one industry or one KPI: a step carries a metric only when there is a
 * real one, and a plain statement otherwise.
 */

export type BriefingPeriod = "morning" | "midday" | "evening";
export type BriefingDimension = "priority" | "insight" | "recommendation" | "action";

/** How pressing a priority is — always said in words and a mark, never by colour alone */
export type BriefingSeverity = "critical" | "high" | "watch" | "routine";

/**
 * What the centre of the dial leads with: a figure when the data has an honest one, or a message.
 * Each kind is set in its own way (money is not a deadline, a client's words are not a number), so
 * the dial never forces a situation into one oversized figure. Values come formatted by the service.
 */
export type BriefingMetric =
  /** "€78,300" · "3" · "2 days" · "9:30": the figure, read with its caption */
  | { kind: "money" | "count" | "duration" | "time"; value: string; caption: string }
  /** A rise or a fall: "31%" from "62%", "2×" */
  | { kind: "change"; value: string; caption: string; direction: "up" | "down"; from?: string }
  /** Time left before a date that matters: "2 days", due "Friday 16 October" */
  | { kind: "deadline"; value: string; caption: string; due: string }
  /** How far towards a goal: "4 of 5", share 0.8 */
  | { kind: "progress"; value: string; caption: string; share: number }
  /** Something achieved: "Signed", "Paid" */
  | { kind: "result"; value: string; caption: string }
  /** A client's issue or an operational alert, in a few words, with its source and how urgent it is */
  | { kind: "message"; value: string; caption: string; urgency: BriefingSeverity };

/** How a step compares with the previous briefing of the day */
export type BriefingStepChange = {
  kind: "new" | "unchanged" | "changed" | "resolved";
  /** What it said before, when it changed ("Reply this morning") */
  was?: string;
};

export type BriefingStep = {
  dimension: BriefingDimension;
  /** The step in one short sentence: what the screen says first */
  title: string;
  /** Why it matters, in a line */
  why: string;
  /** The figure the centre leads with; absent when there is no honest figure to show */
  metric?: BriefingMetric;
  /** A secondary detail: a deadline, a comparison, a source */
  detail?: string;
  /** What it rests on, shown under "Why": facts from the connected data only, never a guess */
  evidence?: string[];
  /** What it is meant to achieve (a recommendation, an action) */
  outcome?: string;
  /** The assumptions or gaps in the data worth knowing, when there are any */
  limits?: string;
  change?: BriefingStepChange;
};

export type BriefingPriorityStep = BriefingStep & { dimension: "priority"; severity: BriefingSeverity };

/** Drafted (prepared, not asked yet) · awaiting approval · scheduled · in progress · sent (gone out, its outcome still open) · completed · unsuccessful */
export type BriefingActionStatus = "drafted" | "awaiting-approval" | "scheduled" | "in-progress" | "sent" | "completed" | "unsuccessful";

/** One thing Syxoria has prepared, planned, is doing or did */
export type BriefingActionItem = {
  id: string;
  name: string;
  status: BriefingActionStatus;
  /** When it happened or will happen, or how far along it is ("10:00" · "2 of 5 deals") */
  timing: string;
  /** What happens next, if anything */
  next?: string;
  /** Whether this action needs the owner's word, whatever the autonomy mode */
  needsApproval: boolean;
  /** Why it needs it, or why it failed: one line */
  note?: string;
  /** The recommendation it carries out */
  recommendationId: string;
};

export type BriefingChangeKind = "new" | "unresolved" | "decided" | "changed" | "in-progress" | "completed" | "risk" | "opportunity";

/** Where the day's main thread stands at a briefing: found, being worked on, done, or stopped on something */
export type BriefingStageState = "identified" | "in-progress" | "completed" | "blocked";

/** One update since the previous briefing. A briefing lists them newest first */
export type BriefingChange = {
  id: string;
  kind: BriefingChangeKind;
  /** What happened, in a few words ("Camille answered") */
  title: string;
  /** Only what is needed to understand it ("Atelier Rive wants to sign by Friday") */
  detail?: string;
  /** When it happened ("11:40" · "Overnight" · "Yesterday 21:14") */
  at?: string;
  /** One of the two or three that matter most: shown at first, the rest in the full history */
  highlight?: boolean;
  /** The step of the reasoning it concerns, to select it */
  dimension?: BriefingDimension;
  /** The action it is about: its status is then read from the action, so the two never disagree */
  actionId?: string;
};

/** One moment in the life of the priority, from the moment it was found to the deal closing */
export type BriefingFollowStep = {
  id: string;
  label: string;
  /** When it happened or will ("Today" · "10:00" · "Pending") */
  when: string;
  /** What it was about, in a few words ("3 messages") */
  detail?: string;
  state: "done" | "now" | "next" | "failed";
};

export type DailyBriefing = {
  id: string;
  period: BriefingPeriod;
  /** ISO date and time it was prepared */
  preparedAt: string;
  /** The briefing in one sentence: what the owner should take away */
  headline: string;
  priority: BriefingPriorityStep;
  insight: BriefingStep & { dimension: "insight"; priorityId?: string };
  recommendation: BriefingStep & { dimension: "recommendation"; id: string };
  action: BriefingStep & { dimension: "action" };
  actions: BriefingActionItem[];
  /** The priority followed through, as far as it has gone; the panel under the dial */
  followThrough: { title: string; steps: BriefingFollowStep[] };
  /**
   * Where the day's main thread stands at this briefing, in a word and a few words: what was
   * identified in the morning is under way at midday and done by the evening
   */
  stage: { state: BriefingStageState; label: string };
  /**
   * Since the previous briefing, newest first. The very first briefing has no previous one: it
   * lists what Syxoria did since the owner connected their tools, or null when there is nothing
   */
  changes: BriefingChange[] | null;
  /** The briefing it is compared with: the one before it today, or yesterday evening's for the morning */
  comparedWith: { period: BriefingPeriod; preparedAt: string } | null;
  /** An example of a usual day, shown on a new user's first day for the periods they have no briefing for yet */
  example?: boolean;
};

/** The autonomy the owner has granted: what Syxoria may do on its own, and what still asks */
export type BriefingAutonomy = {
  level: AutonomyLevel;
  name: string;
  /** Share of acting rules Syxoria takes on its own (0 to 1), for the mode's mark */
  share: number;
  /** One line: what this mode lets it do */
  promise: string;
  /** One line: what always waits for the owner, whatever the mode */
  limit: string;
};

export type DailyBriefingSet = {
  date: string;
  company: string;
  /** Who the briefing is for, to greet them */
  owner: { firstName: string };
  autonomy: BriefingAutonomy;
  /** The day's briefings so far, in order */
  briefings: DailyBriefing[];
  /** Those still to come today, shown for what they are: not prepared yet */
  upcoming?: { period: BriefingPeriod; time: string }[];
};
