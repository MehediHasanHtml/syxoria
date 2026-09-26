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
export type ProgressionStage = {
  id: string;
  label: string;
  title: string;
  body: string;
  metric: { value: string; label: string };
};

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

/* ---------- Growth curve (marketing + reusable with real data) ---------- */
export type CurveStage = {
  id: string;
  label: string; // e.g. "Acceleration"
  when: string; // e.g. "Month 3"
  title: string;
  body: string;
  metric: { value: string; label: string };
  /** Index into the curve's `points` array where this stage sits */
  index: number;
};
