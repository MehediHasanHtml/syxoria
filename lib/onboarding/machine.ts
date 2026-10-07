import { milestones, type MilestoneId } from "@/content/onboarding";
import type { CoreState } from "@/lib/core/core-states";
import type {
  AccountSession,
  Briefing,
  CompanyProfile,
  InitialAnalysis,
  KnowledgeEntry,
  KnowledgeKind,
  Mandate,
  OnboardingActivity,
  OnboardingSnapshot,
  OnboardingStage,
  SourceConnection,
} from "@/types";

/**
 * The onboarding's state model. One environment, one state: each stage is a moment of the same
 * screen, and every piece of it — the Core, the words beside it, "What Syxoria knows" — reads
 * from here.
 *
 *   account → company → connections → syncing → analysis → autonomy → briefing → complete
 */

export const STAGES: OnboardingStage[] = ["account", "company", "connections", "syncing", "analysis", "autonomy", "briefing", "complete"];
const at = (s: OnboardingSnapshot, stage: OnboardingStage) => STAGES.indexOf(s.stage) >= STAGES.indexOf(stage);

export const emptySnapshot: OnboardingSnapshot = {
  stage: "account",
  session: null,
  company: null,
  candidate: null,
  activity: null,
  connections: {},
  found: {},
  knowledge: null,
  analysis: null,
  mandate: null,
  briefing: null,
};

export type OnboardingAction =
  | { type: "authenticated"; session: AccountSession }
  | { type: "activity"; activity: OnboardingActivity }
  | { type: "candidate"; company: CompanyProfile | null }
  | { type: "companyConfirmed"; company: CompanyProfile }
  | { type: "connection"; id: string; connection: SourceConnection | null }
  | { type: "found"; kind: KnowledgeKind; count: number }
  | { type: "understood"; knowledge: KnowledgeEntry[] }
  | { type: "analysed"; analysis: InitialAnalysis }
  | { type: "mandated"; mandate: Mandate; briefing: Briefing }
  | { type: "go"; stage: OnboardingStage };

export function onboardingReducer(state: OnboardingSnapshot, action: OnboardingAction): OnboardingSnapshot {
  switch (action.type) {
    case "authenticated":
      return { ...state, session: action.session, stage: "company" };
    case "activity":
      return { ...state, activity: action.activity };
    case "candidate":
      return { ...state, candidate: action.company, activity: action.company ? "found" : null };
    case "companyConfirmed":
      return { ...state, company: action.company, candidate: null, activity: null, stage: "connections" };
    case "connection": {
      const connections = { ...state.connections };
      if (action.connection) connections[action.id] = action.connection;
      else delete connections[action.id];
      return { ...state, connections };
    }
    case "found":
      return { ...state, found: { ...state.found, [action.kind]: action.count } };
    case "understood":
      return { ...state, knowledge: action.knowledge, found: Object.fromEntries(action.knowledge.map((k) => [k.kind, k.count])) };
    case "analysed":
      return { ...state, analysis: action.analysis, stage: "analysis" };
    case "mandated":
      return { ...state, mandate: action.mandate, briefing: action.briefing, stage: "briefing" };
    case "go":
      return { ...state, stage: action.stage, activity: null };
  }
}

export const connectedIds = (s: OnboardingSnapshot) => Object.keys(s.connections).filter((id) => s.connections[id].status === "connected");

/* ---------- The Core, and the word beside it ---------- */

/**
 * What the Core is right now, and the one word that says it. The word only ever names what has
 * actually happened: "Identified" while the company is known but nothing is connected yet.
 * No word at all before the account exists — the Core is simply dormant.
 */
export function coreFor(s: OnboardingSnapshot): { state: CoreState; word: string | null } {
  const sources = connectedIds(s).length;
  switch (s.stage) {
    case "account":
      return { state: "dormant", word: null };
    case "company":
      if (s.activity === "searching") return { state: "searching", word: "Searching" };
      if (s.candidate) return { state: "identifying", word: "Identified" };
      return { state: "initializing", word: "Initializing" };
    case "connections":
      if (Object.values(s.connections).some((c) => c.status === "connecting")) return { state: "receiving", word: "Connecting" };
      return sources ? { state: "receiving", word: "Connected" } : { state: "identifying", word: "Identified" };
    case "syncing":
      return s.knowledge ? { state: "understanding", word: "Understood" } : { state: "learning", word: "Learning" };
    case "analysis":
      return { state: "active", word: "Prioritized" };
    case "autonomy":
      return { state: "ready", word: "Awaiting mandate" };
    case "briefing":
      return { state: "ready", word: "Ready" };
    case "complete":
      return { state: "executing", word: "Active" };
  }
}

/** How far it has read, 0–1, while it learns — from the counts found so far */
export function learningProgress(s: OnboardingSnapshot) {
  const kinds = Object.keys(s.found).length;
  return Math.min(1, kinds / 6);
}

/** The milestones reached (shown as a quiet line beside the Core, after sign-in) */
export function milestonesFor(s: OnboardingSnapshot): { id: MilestoneId; word: string; on: boolean }[] {
  const reached: Record<MilestoneId, boolean> = {
    identified: Boolean(s.company || s.candidate),
    connected: connectedIds(s).length > 0,
    understood: Boolean(s.knowledge),
    prioritized: Boolean(s.analysis) && at(s, "analysis"),
    mandated: Boolean(s.mandate),
    ready: at(s, "briefing"),
  };
  return milestones.map((m) => ({ ...m, on: reached[m.id] }));
}

/* ---------- What Syxoria knows ---------- */

export type KnowsStatus = "done" | "active" | "pending";
export type KnowsItem = { id: "company" | "sources" | "business" | "priorities" | "mandate"; label: string; status: KnowsStatus };

/**
 * "What Syxoria knows" at each moment. Early on it is detailed — the user is watching the system
 * learn; the more it understands, the less it shows: finished things fold away into one line.
 */
export function knowsFor(s: OnboardingSnapshot): { density: "detailed" | "compact"; items: KnowsItem[] } {
  const sources = connectedIds(s).length;
  const all: KnowsItem[] = [
    // found in the register = its identity is known; the user's confirmation makes it the company
    { id: "company", label: s.company ? "Company" : "Identity", status: s.company || s.candidate ? "done" : s.activity === "searching" ? "active" : "pending" },
    { id: "sources", label: sources ? `Sources · ${sources}` : "Sources", status: s.stage === "connections" ? (sources ? "active" : "pending") : sources && at(s, "syncing") ? "done" : "pending" },
    { id: "business", label: "Business understood", status: s.knowledge ? "done" : s.stage === "syncing" ? "active" : "pending" },
    { id: "priorities", label: "Priorities identified", status: at(s, "autonomy") ? "done" : s.stage === "analysis" ? "active" : "pending" },
    { id: "mandate", label: s.mandate ? "Mandate established" : "Mandate", status: s.mandate ? "done" : s.stage === "autonomy" ? "active" : "pending" },
  ];
  switch (s.stage) {
    case "account":
    case "company":
    case "connections":
      return { density: "detailed", items: all };
    case "syncing":
      return { density: "compact", items: all.slice(0, 4) };
    case "analysis":
      return { density: "compact", items: all.slice(0, 4) };
    default:
      // once the business is understood, only what it has become is worth showing
      return { density: "compact", items: all.slice(2) };
  }
}
