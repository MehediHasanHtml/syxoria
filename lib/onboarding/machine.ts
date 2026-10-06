import { systemStates, type Reached } from "@/content/onboarding";
import type {
  AccountSession,
  Briefing,
  CompanyProfile,
  InitialAnalysis,
  KnowledgeEntry,
  KnowledgeKind,
  Mandate,
  OnboardingSnapshot,
  OnboardingStage,
  SourceConnection,
} from "@/types";

/**
 * The onboarding's state model. One environment, one state: each stage is a
 * moment of the same screen, and every piece of it (the conversation, the
 * memory panel, the Core in the top bar) reads from here.
 *
 *   account → company → connections → syncing → analysis → autonomy → briefing → complete
 */

export const STAGES: OnboardingStage[] = ["account", "company", "connections", "syncing", "analysis", "autonomy", "briefing", "complete"];

export const emptySnapshot: OnboardingSnapshot = {
  stage: "account",
  session: null,
  company: null,
  connections: {},
  found: {},
  knowledge: null,
  analysis: null,
  mandate: null,
  briefing: null,
};

export type OnboardingAction =
  | { type: "authenticated"; session: AccountSession }
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
    case "companyConfirmed":
      return { ...state, company: action.company, stage: "connections" };
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
      return { ...state, stage: action.stage };
  }
}

export const connectedIds = (s: OnboardingSnapshot) => Object.keys(s.connections).filter((id) => s.connections[id].status === "connected");

/** How far the system has come: its states, and the one it is in now */
export function systemProgress(s: OnboardingSnapshot) {
  const reached: Reached = {
    stage: s.stage,
    company: Boolean(s.company),
    sources: connectedIds(s).length,
    understood: Boolean(s.knowledge),
    mandate: Boolean(s.mandate),
  };
  const states = systemStates.map((st) => ({ id: st.id, word: st.word, on: st.reached(reached) }));
  const lit = states.filter((st) => st.on).length;
  // while it reads the company, it is neither connected nor yet understanding: it is learning
  const word = s.stage === "syncing" && !s.knowledge ? "Learning" : states[lit - 1].word;
  return { states, lit, word };
}
