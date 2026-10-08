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

export type BriefingDraft = { id: string; contact: string; company: string; subject: string; value: number; quietDays: number };

/** Priority → insight → recommendation → action: the briefing reads as one line of reasoning */
export type Briefing = {
  priority: { title: string; detail: string };
  insight: { title: string; detail: string };
  recommendation: { title: string; detail: string };
  /** What acting on it can achieve, measured on the company’s own history ("2×" · "as likely to close …") */
  impact?: { value: string; label: string };
  /** The follow-ups the action is about — what Syxoria may do with them depends on the mandate and the tools */
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
