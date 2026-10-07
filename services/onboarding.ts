import {
  buildAnalysis,
  buildBriefing,
  buildKnowledge,
  buildUnderstandingScript,
  demoSiren,
  failFirstSources,
  mockAutonomyPolicy,
  mockCompanies,
  mockSources,
  recommendedSourceIds,
  sourceFindings,
} from "@/lib/mock-data/onboarding";
import { mockUsers } from "@/lib/mock-data/users";
import type {
  AccountSession,
  AutonomyPolicy,
  Briefing,
  CompanyProfile,
  DataSource,
  InitialAnalysis,
  Mandate,
  OnboardingSnapshot,
  OnboardingStage,
  UnderstandingEvent,
} from "@/types";
import { clone, ServiceError, simulateLatency } from "./_client";

/**
 * The onboarding's boundary with the backend. Every function resolves mock
 * data today; swap a body for the real call and keep its signature — the
 * onboarding components never import mock data directly.
 */

/* ---------- Account ---------- */

const NAME = /^[a-zà-ÿ]{2,}$/i;
const accents: Record<string, string> = { mael: "Maël", ines: "Inès", theo: "Théo", chloe: "Chloé", zoe: "Zoé", noemie: "Noémie", helene: "Hélène", jerome: "Jérôme" };

/** "mael@…" → "Maël", "jane.doe@…" → "Jane"; null for "contact@…" and the like */
export function firstNameFromEmail(email: string): string | null {
  const head = email.split("@")[0]?.split(/[._-]/)[0]?.toLowerCase() ?? "";
  if (!NAME.test(head) || ["contact", "hello", "info", "admin", "team", "office", "bonjour", "sales", "demo", "test"].includes(head)) return null;
  return accents[head] ?? head[0].toUpperCase() + head.slice(1);
}

/** TODO(auth): Server Action that creates the account and sets an httpOnly session cookie. */
export async function createAccount(input: { email: string; password: string }): Promise<AccountSession> {
  await simulateLatency(1100);
  if (input.email.toLowerCase().startsWith("taken@")) {
    throw new ServiceError("An account already exists for this email.", "validation");
  }
  return { email: input.email, firstName: firstNameFromEmail(input.email), returning: false };
}

/**
 * TODO(auth): Server Action that creates a session. `onboarded` tells the UI whether the
 * workspace is already prepared (→ straight to /app) or setup should resume.
 */
export async function signIn(input: { email: string; password: string }): Promise<AccountSession & { onboarded: boolean }> {
  await simulateLatency(900);
  if (input.password.length < 8) throw new ServiceError("Email or password is incorrect.", "unauthorized");
  const member = mockUsers.find((u) => u.email.toLowerCase() === input.email.toLowerCase());
  return { email: input.email, firstName: member?.name.split(" ")[0] ?? firstNameFromEmail(input.email), returning: true, onboarded: Boolean(member) };
}

/** TODO(auth): request a password-reset email (always answers the same, whether the account exists or not). */
export async function requestPasswordReset(email: string): Promise<void> {
  void email;
  await simulateLatency(800);
}

/* ---------- Company ---------- */

/** TODO(api): GET /companies/lookup?number= — backed by the INSEE Sirene API. Null when not registered. */
export async function lookupCompany(number: string): Promise<CompanyProfile | null> {
  await simulateLatency(1500);
  const siren = number.slice(0, 9);
  const found = mockCompanies.find((c) => c.siren === siren);
  if (!found) return null;
  // a SIRET names one establishment; a SIREN gets the head office
  return clone(number.length === 14 ? { ...found, siret: number } : found);
}

/** TODO(api): PUT /workspace/company */
export async function saveCompany(company: CompanyProfile): Promise<CompanyProfile> {
  await simulateLatency(500);
  return clone(company);
}

/* ---------- Sources ---------- */

/** The number behind "use the demo company" */
export const DEMO_COMPANY_NUMBER = demoSiren;

/** TODO(api): returned with GET /connectors?company= — the sources to suggest first, for this kind of company */
export function recommendedSources(company: CompanyProfile | null): string[] {
  return recommendedSourceIds(company);
}

/** TODO(api): GET /connectors */
export async function getSources(): Promise<DataSource[]> {
  return clone(mockSources);
}

const attempts = new Map<string, number>();

/**
 * TODO(api): start the provider's OAuth flow (popup / redirect), then poll
 * GET /connectors/:id until it reports connected. `onStep` narrates the wait.
 */
export async function connectSource(id: string, onStep: (note: string) => void, signal?: AbortSignal): Promise<{ note: string }> {
  const source = mockSources.find((s) => s.id === id);
  if (!source) throw new ServiceError("Unknown source.", "not_found");
  const tries = (attempts.get(id) ?? 0) + 1;
  attempts.set(id, tries);
  for (const step of [`Opening ${source.name}…`, "Waiting for your approval…", "Checking access…"]) {
    if (signal?.aborted) throw new ServiceError("Cancelled.", "unknown");
    onStep(step);
    await simulateLatency(650 + Math.random() * 350);
  }
  if (failFirstSources[id] && tries === 1) throw new ServiceError(failFirstSources[id], "unauthorized");
  return { note: sourceFindings[id] ?? "Connected" };
}

/** TODO(api): POST /imports (multipart) — returns what was read from the file. */
export async function importFile(file: File, onStep: (note: string) => void): Promise<{ note: string }> {
  if (!/\.(csv|xlsx?|tsv)$/i.test(file.name)) {
    throw new ServiceError("Syxoria reads CSV and Excel files (.csv, .xls, .xlsx).", "validation");
  }
  onStep(`Reading ${file.name}…`);
  await simulateLatency(900);
  onStep("Recognising columns…");
  await simulateLatency(800);
  const rows = Math.max(12, Math.min(4000, Math.round(file.size / 64)));
  return { note: `${file.name} · ${rows.toLocaleString("en-GB")} rows` };
}

/** TODO(api): DELETE /connectors/:id */
export async function disconnectSource(id: string): Promise<void> {
  void id;
  await simulateLatency(300);
}

/* ---------- Understanding ---------- */

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });

/**
 * The system reading the company, as a stream of events.
 * TODO(api): POST /understanding to start, then read GET /understanding/events (server-sent
 * events) and yield each parsed event — the UI consumes this generator unchanged.
 */
export async function* understandCompany(
  company: CompanyProfile,
  sources: DataSource[],
  { signal, speed = 1 }: { signal?: AbortSignal; speed?: number } = {},
): AsyncGenerator<UnderstandingEvent> {
  let clock = 0;
  for (const { at, event } of buildUnderstandingScript(company, sources)) {
    await wait((at - clock) / speed, signal);
    clock = at;
    yield event;
  }
}

/* ---------- Analysis, autonomy, briefing ---------- */

/** TODO(api): GET /analysis/initial — the priorities the system identified, with their evidence */
export async function getInitialAnalysis(company: CompanyProfile, sources: DataSource[]): Promise<InitialAnalysis> {
  await simulateLatency(400);
  return buildAnalysis(company, sources);
}

/** TODO(api): GET /autonomy/policy */
export async function getAutonomyPolicy(): Promise<AutonomyPolicy> {
  return clone(mockAutonomyPolicy);
}

/** TODO(api): PUT /autonomy/mandate */
export async function saveMandate(mandate: Mandate): Promise<Mandate> {
  await simulateLatency(700);
  return clone(mandate);
}

/** TODO(api): GET /briefings/today */
export async function getFirstBriefing(company: CompanyProfile, sources: DataSource[]): Promise<Briefing> {
  await simulateLatency(300);
  return buildBriefing(company, sources);
}

/* ---------- Resuming ---------- */

const ORDER: OnboardingStage[] = ["account", "company", "connections", "syncing", "analysis", "autonomy", "briefing", "complete"];

/**
 * TODO(api): GET /onboarding/progress — where this account left its setup.
 * The mock rebuilds a plausible progress up to `stage` (used by `/onboarding?at=…` to review a moment directly).
 */
export async function getOnboardingProgress(stage: OnboardingStage): Promise<OnboardingSnapshot> {
  const reached = (s: OnboardingStage) => ORDER.indexOf(stage) > ORDER.indexOf(s);
  const company = clone(mockCompanies[0]);
  const ids = recommendedSourceIds(company);
  const sources = mockSources.filter((s) => ids.includes(s.id));
  const knowledge = buildKnowledge(sources);
  return {
    stage,
    session: reached("account") ? { email: "mael@northfield.co", firstName: "Maël", returning: false } : null,
    company: reached("company") ? company : null,
    candidate: null,
    activity: null,
    connections: reached("connections") ? Object.fromEntries(sources.map((s) => [s.id, { status: "connected", note: sourceFindings[s.id] }])) : {},
    found: reached("syncing") ? Object.fromEntries(knowledge.map((k) => [k.kind, k.count])) : {},
    knowledge: reached("syncing") ? knowledge : null,
    analysis: reached("syncing") ? buildAnalysis(company, sources) : null,
    mandate: reached("autonomy") ? { level: mockAutonomyPolicy.recommended, overrides: {} } : null,
    briefing: reached("autonomy") ? buildBriefing(company, sources) : null,
  };
}

export const onboardingStages = ORDER;
