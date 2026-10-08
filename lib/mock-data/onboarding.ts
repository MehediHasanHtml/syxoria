import { knowledgeLabels } from "@/content/onboarding";
import type {
  AutonomyPolicy,
  Briefing,
  CompanyProfile,
  DataSource,
  Discovery,
  InitialAnalysis,
  KnowledgeEntry,
  KnowledgeKind,
  Priority,
  SourceCategory,
  UnderstandingEvent,
} from "@/types";

/**
 * Mock data for the onboarding. Everything here is what the backend will answer later
 * (company register, connectors, the understanding stream, the priorities, the mandate policy,
 * the briefing) — the UI only ever reads it through services/onboarding.ts.
 *
 *   company · sources · discoveries · relationships · priorities (+ their KPIs) · autonomy · briefing
 */

/* ---------- Company register (stands in for INSEE / Sirene) ---------- */

export const mockCompanies: CompanyProfile[] = [
  {
    siren: "852379148",
    siret: "85237914800020",
    name: "Northfield Studio",
    legalName: "NORTHFIELD STUDIO",
    legalForm: "SAS · Simplified joint-stock company",
    address: "18 rue de Paradis, 75010",
    city: "Paris",
    activity: { code: "74.10Z", label: "Specialised design activities" },
    sector: "design studio",
    founded: "2019-06-12",
    headcount: "10 to 19 employees",
    director: "Maël Laurent",
    source: "register",
    edited: [],
  },
  {
    siren: "904182631",
    siret: "90418263100013",
    name: "Atelier Vauban",
    legalName: "ATELIER VAUBAN CONSEIL",
    legalForm: "SARL · Limited liability company",
    address: "7 quai Saint-Antoine, 69002",
    city: "Lyon",
    activity: { code: "70.22Z", label: "Business and management consultancy" },
    sector: "consultancy",
    founded: "2021-09-03",
    headcount: "6 to 9 employees",
    director: "Lucie Fabre",
    source: "register",
    edited: [],
  },
];

/** The number the "use the demo company" shortcut fills in */
export const demoSiren = mockCompanies[0].siren;

/* ---------- Sources ---------- */

export const mockSources: DataSource[] = [
  {
    id: "gmail",
    name: "Gmail",
    logo: "gmail",
    category: "email",
    kind: "oauth",
    purpose: "Client conversations and the quotes you sent.",
    reads: ["Emails with clients and prospects", "Attachments such as quotes and contracts"],
  },
  {
    id: "outlook",
    name: "Outlook",
    logo: "outlook",
    category: "email",
    kind: "oauth",
    purpose: "Client conversations and the quotes you sent.",
    reads: ["Emails with clients and prospects", "Attachments such as quotes and contracts"],
  },
  {
    id: "hubspot",
    name: "HubSpot",
    logo: "hubspot",
    category: "crm",
    kind: "oauth",
    purpose: "Your clients and the deals in progress.",
    reads: ["Contacts and companies", "Deals and their stages", "Notes and logged activity"],
  },
  {
    id: "salesforce",
    name: "Salesforce",
    logo: "salesforce",
    category: "crm",
    kind: "oauth",
    purpose: "Your accounts and open opportunities.",
    reads: ["Accounts and contacts", "Opportunities and their stages", "Logged activity"],
  },
  {
    id: "drive",
    name: "Google Drive",
    logo: "drive",
    category: "documents",
    kind: "oauth",
    purpose: "Proposals, contracts and project documents.",
    reads: ["Document titles and contents", "Who they were shared with"],
  },
  {
    id: "notion",
    name: "Notion",
    logo: "notion",
    category: "documents",
    kind: "oauth",
    purpose: "Briefs, project notes and how your team works.",
    reads: ["Pages and databases you choose to share"],
  },
  {
    id: "stripe",
    name: "Stripe",
    logo: "stripe",
    category: "finance",
    kind: "oauth",
    purpose: "Invoices, payments and revenue over time.",
    reads: ["Invoices and their status", "Payments received", "Customers"],
  },
  {
    id: "file",
    name: "CSV or Excel file",
    logo: "excel",
    category: "files",
    kind: "file",
    purpose: "A client list, an export, a budget.",
    reads: ["Only the file you choose"],
  },
];

/** What a source holds, once connected — the line shown on its card */
export const sourceFindings: Record<string, string> = {
  gmail: "18,640 emails since 2024",
  outlook: "17,920 emails since 2024",
  hubspot: "214 contacts · 38 open deals",
  salesforce: "206 accounts · 36 opportunities",
  drive: "1,240 documents",
  notion: "320 pages",
  stripe: "412 invoices since 2024",
};

/** Sources that answer with an error the first time — so the calm error state can be seen */
export const failFirstSources: Record<string, string> = {
  salesforce: "Salesforce asked for an administrator’s approval. Nothing was shared.",
};

/** Suggested first for a company like this one (by activity) */
export function recommendedSourceIds(company: CompanyProfile | null): string[] {
  if (company?.sector === "consultancy") return ["outlook", "hubspot", "drive", "stripe"];
  return ["gmail", "hubspot", "drive", "stripe"];
}

/* ---------- Understanding: knowledge, relationships, discoveries ---------- */

/** For each kind of knowledge: which source categories can provide it, and how much they hold */
const knowledgeSupply: Record<KnowledgeKind, Partial<Record<SourceCategory, number>>> = {
  clients: { crm: 214, finance: 168, files: 186, email: 152 },
  conversations: { email: 18640, crm: 2310 },
  quotes: { crm: 156, documents: 94, email: 61 },
  opportunities: { crm: 38, email: 21, files: 18 },
  invoices: { finance: 412, documents: 138, files: 120 },
  documents: { documents: 1240, email: 860 },
};

export function buildKnowledge(sources: DataSource[]): KnowledgeEntry[] {
  return (Object.keys(knowledgeSupply) as KnowledgeKind[]).map((kind) => {
    const supply = knowledgeSupply[kind];
    const from = sources.filter((s) => supply[s.category] !== undefined);
    const count = Math.max(0, ...from.map((s) => supply[s.category] ?? 0));
    return { kind, label: knowledgeLabels[kind], count, from: [...new Set(from.map((s) => s.name))] };
  });
}

/**
 * How the business holds together, as the understanding screen draws it: a client talks to
 * you, the conversation leads to a quote, the quote becomes an opportunity.
 */
export const relationshipChain: KnowledgeKind[] = ["clients", "conversations", "quotes", "opportunities"];

function buildDiscoveries(knowledge: KnowledgeEntry[]): Discovery[] {
  const n = (k: KnowledgeKind) => knowledge.find((e) => e.kind === k)?.count ?? 0;
  const out: Discovery[] = [];
  if (n("clients")) out.push({ id: "contacts", value: n("clients").toLocaleString("en-GB"), label: "contacts identified", tone: "fact" });
  if (n("opportunities")) out.push({ id: "opportunities", value: String(n("opportunities")), label: "active opportunities", tone: "fact" });
  if (n("quotes")) out.push({ id: "quotes", value: "12", label: "quotes requiring attention", tone: "attention" });
  if (n("clients") > 100) out.push({ id: "duplicates", value: "3", label: "duplicate contacts identified", tone: "attention" });
  return out;
}

type Timed = { at: number; event: UnderstandingEvent };

/**
 * The script the mock stream plays: phases, running counts, the relationships it establishes and
 * what it discovers along the way. `at` is milliseconds from the start.
 */
export function buildUnderstandingScript(company: CompanyProfile, sources: DataSource[]): Timed[] {
  const knowledge = buildKnowledge(sources);
  const total = (k: KnowledgeKind) => knowledge.find((e) => e.kind === k)?.count ?? 0;
  const has = (k: KnowledgeKind) => total(k) > 0;
  const discoveries = Object.fromEntries(buildDiscoveries(knowledge).map((d) => [d.id, d]));
  const out: Timed[] = [];
  // a count rising in steps between two moments
  const rise = (kind: KnowledgeKind, from: number, to: number, steps = 7) => {
    const n = total(kind);
    if (!n) return;
    for (let i = 1; i <= steps; i++) {
      const p = i / steps;
      out.push({ at: Math.round(from + (to - from) * p), event: { type: "found", kind, count: Math.round(n * (1 - (1 - p) ** 2)) } });
    }
  };
  const discover = (at: number, id: string) => discoveries[id] && out.push({ at, event: { type: "discovery", discovery: discoveries[id] } });

  out.push({ at: 0, event: { type: "phase", id: "open", message: `Opening ${company.name}’s sources` } });
  out.push({ at: 1300, event: { type: "phase", id: "conversations", message: "Reading your conversations" } });
  rise("conversations", 1400, 4300, 9);
  rise("documents", 1800, 4600);
  out.push({ at: 3100, event: { type: "phase", id: "clients", message: "Recognising your clients" } });
  rise("clients", 3200, 5200);
  if (has("clients") && has("conversations")) out.push({ at: 4700, event: { type: "link", relationship: { from: "clients", to: "conversations", label: "talk to you" } } });
  discover(5400, "contacts");
  out.push({ at: 5900, event: { type: "phase", id: "quotes", message: "Following your quotes" } });
  rise("quotes", 6000, 7600);
  rise("invoices", 6200, 8200);
  if (has("conversations") && has("quotes")) out.push({ at: 7200, event: { type: "link", relationship: { from: "conversations", to: "quotes", label: "lead to" } } });
  discover(7900, "quotes");
  out.push({ at: 8500, event: { type: "phase", id: "opportunities", message: "Connecting quotes to opportunities" } });
  rise("opportunities", 8600, 9800);
  if (has("quotes") && has("opportunities")) out.push({ at: 9600, event: { type: "link", relationship: { from: "quotes", to: "opportunities", label: "become" } } });
  discover(10100, "opportunities");
  out.push({ at: 10700, event: { type: "phase", id: "check", message: "Checking what doesn’t add up" } });
  discover(11400, "duplicates");
  out.push({ at: 12800, event: { type: "done", knowledge, period: "Jan 2024 – today" } });
  return out.sort((a, b) => a.at - b.at);
}

/* ---------- Priorities: what deserves attention, and the evidence ---------- */

/** Names of the connected sources, by what they are, with a plain fallback */
function namesFor(sources: DataSource[], cats: SourceCategory[], fallback: string) {
  const names = sources.filter((s) => cats.includes(s.category)).map((s) => s.name);
  return names.length ? names.join(" and ") : fallback;
}

export const quietDeals = [
  { contact: "Camille Roy", company: "Atelier Rive", value: 42000, quietDays: 12, subject: "Spring launch — timing and next steps" },
  { contact: "Hugo Lenoir", company: "Maison Lenoir", value: 21500, quietDays: 11, subject: "Following up on the identity proposal" },
  { contact: "Nora Haddad", company: "Côté Sud Hôtels", value: 14800, quietDays: 15, subject: "Signage project — revised quote" },
  { contact: "Paul Ondine", company: "Brasserie Ondine", value: 9600, quietDays: 10, subject: "Menu & packaging — a quick check-in" },
  { contact: "Élise Belval", company: "Ferme Belval", value: 8500, quietDays: 18, subject: "Website refresh — where we left it" },
];

const MONTHS = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];

export function buildAnalysis(company: CompanyProfile, sources: DataSource[]): InitialAnalysis {
  const crm = namesFor(sources, ["crm"], "your emails and documents");
  const mail = namesFor(sources, ["email"], "logged activity");
  const money = namesFor(sources, ["finance"], namesFor(sources, ["documents", "files"], "your documents"));

  const priorities: Priority[] = [
    {
      id: "conversion",
      title: "Improve opportunity conversion",
      insight: "Five open deals worth €96,400 have been quiet for more than ten days. Here, deals that go quiet this long close half as often.",
      kpis: [
        { id: "rate", label: "conversion", value: "24%" },
        { id: "open", label: "open opportunities", value: "38" },
      ],
      basedOn: `${crm} deals, ${mail} threads`,
      graph: {
        label: "Quotes signed",
        unit: "%",
        months: MONTHS,
        series: [31, 30, 31, 29, 30, 28, 27, 27, 26, 25, 24, 24],
        reference: { value: 30, label: "Your average in 2025" },
        focus: [5, 11],
        focusLabel: "Slipping since April",
      },
    },
    {
      id: "activity",
      title: "Protect client activity",
      insight: `Three returning clients — 18% of ${company.name}’s revenue last year — haven’t started a project this year.`,
      kpis: [
        { id: "active", label: "of clients active", value: "71%" },
        { id: "drifting", label: "returning clients drifting", value: "3" },
      ],
      basedOn: `${crm}, ${mail}`,
      graph: {
        label: "Clients active in the last 90 days",
        unit: "%",
        months: MONTHS,
        series: [83, 82, 83, 81, 80, 80, 78, 77, 75, 73, 72, 71],
        reference: { value: 82, label: "A year ago" },
        focus: [6, 11],
        focusLabel: "Down 12 points",
      },
    },
    {
      id: "payment",
      title: "Get paid closer to your terms",
      insight: "Invoices are paid nine days later than your 30-day terms. €27,300 is overdue today, across six invoices.",
      kpis: [
        { id: "days", label: "to get paid", value: "39 days" },
        { id: "overdue", label: "overdue", value: "€27,300" },
      ],
      basedOn: money,
      graph: {
        label: "Days to get paid",
        unit: "days",
        months: MONTHS,
        series: [33, 34, 32, 35, 36, 35, 37, 38, 36, 38, 40, 39],
        reference: { value: 30, label: "Your terms" },
        focus: [8, 11],
        focusLabel: "Nine days over terms",
      },
    },
  ];
  return { priorities };
}

/* ---------- Autonomy ---------- */

export const mockAutonomyPolicy: AutonomyPolicy = {
  recommended: "assisted",
  scenarioSubject: "Atelier Rive, a €42,000 deal, has gone quiet for 12 days.",
  levels: [
    {
      id: "guided",
      name: "Guided",
      summary: "Syxoria identifies what needs attention and prepares the work. Nothing happens until you approve it.",
      scenario: [
        { id: "notice", label: "Notices the deal has gone quiet", by: "syxoria" },
        { id: "prepare", label: "Prepares a follow-up", by: "syxoria" },
        { id: "approve", label: "Waits for your approval", by: "you" },
      ],
    },
    {
      id: "assisted",
      name: "Assisted",
      summary: "Syxoria handles the routine — notes, records, drafts — and asks you when it matters.",
      scenario: [
        { id: "notice", label: "Notices the deal has gone quiet", by: "syxoria" },
        { id: "update", label: "Logs the activity, updates the deal", by: "syxoria" },
        { id: "prepare", label: "Prepares a follow-up", by: "syxoria" },
        { id: "approve", label: "Asks you before sending", by: "you" },
      ],
    },
    {
      id: "autonomous",
      name: "Autonomous",
      summary: "Syxoria acts on its own within your mandate — and stops the moment something falls outside it.",
      scenario: [
        { id: "notice", label: "Notices the deal has gone quiet", by: "syxoria" },
        { id: "update", label: "Updates the deal", by: "syxoria" },
        { id: "send", label: "Sends a routine follow-up", by: "syxoria" },
        { id: "approve", label: "They ask for a new quote — it stops and asks you", by: "you" },
      ],
    },
  ],
  rules: [
    {
      id: "analyse",
      group: "understand",
      label: "Analyse your data",
      description: "Read your connected sources and keep the company profile current.",
      defaults: { guided: "auto", assisted: "auto", autonomous: "auto" },
      allowed: ["auto"],
      lockedReason: "This is how Syxoria understands your company. It only ever reads.",
    },
    {
      id: "identify",
      group: "understand",
      label: "Spot opportunities and risks",
      description: "Flag deals going quiet, late payments, clients drifting away.",
      defaults: { guided: "auto", assisted: "auto", autonomous: "auto" },
      allowed: ["auto", "off"],
    },
    {
      id: "reports",
      group: "prepare",
      label: "Prepare briefings",
      description: "Your morning briefing, weekly summaries, client reports.",
      defaults: { guided: "auto", assisted: "auto", autonomous: "auto" },
      allowed: ["auto", "ask", "off"],
    },
    {
      id: "draft",
      group: "prepare",
      label: "Draft follow-ups",
      description: "Follow-ups and replies, written for you — never sent on their own.",
      defaults: { guided: "auto", assisted: "auto", autonomous: "auto" },
      allowed: ["auto", "ask", "off"],
    },
    {
      id: "organise",
      group: "prepare",
      label: "Organise information",
      description: "Link emails and documents to the right client and deal.",
      defaults: { guided: "ask", assisted: "auto", autonomous: "auto" },
      allowed: ["auto", "ask", "off"],
    },
    {
      id: "records",
      group: "act",
      label: "Update records",
      description: "Move a deal to its next stage, log a call, fix a contact.",
      defaults: { guided: "ask", assisted: "auto", autonomous: "auto" },
      allowed: ["auto", "ask", "off"],
    },
    {
      id: "send",
      group: "act",
      label: "Send routine follow-ups",
      description: "To existing clients only, from templates you approved.",
      defaults: { guided: "ask", assisted: "ask", autonomous: "auto" },
      allowed: ["auto", "ask", "off"],
    },
    {
      id: "external",
      group: "act",
      label: "New external communications",
      description: "A first message to someone, or anything outside your templates.",
      defaults: { guided: "ask", assisted: "ask", autonomous: "ask" },
      allowed: ["ask", "off"],
      lockedReason: "Anything that speaks for you in a new way always waits for you.",
    },
    {
      id: "financial",
      group: "act",
      label: "Quotes, invoices and reminders",
      description: "Create or change a quote, an invoice, a payment reminder.",
      defaults: { guided: "ask", assisted: "ask", autonomous: "ask" },
      allowed: ["ask", "off"],
      lockedReason: "Nothing involving money happens without your approval.",
    },
    {
      id: "sensitive",
      group: "act",
      label: "Sensitive changes",
      description: "Merging or archiving records, anything hard to undo.",
      defaults: { guided: "ask", assisted: "ask", autonomous: "ask" },
      allowed: ["ask", "off"],
      lockedReason: "Changes that are hard to undo always wait for you.",
    },
  ],
  never: ["Move money or make payments", "Delete your data", "Share your data outside your company", "Change its own permissions"],
};

/* ---------- The first briefing ---------- */

export function buildBriefing(company: CompanyProfile, sources: DataSource[]): Briefing {
  const top = quietDeals.slice(0, 3);
  return {
    priority: {
      title: "Three opportunities need your attention today.",
      // the same finding as the conversion priority: here, deals quiet this long close half as often
      detail: `Each has been quiet for more than ten days — and at ${company.name}, deals that go quiet this long close half as often.`,
    },
    insight: {
      title: "Atelier Rive has been quiet for 12 days.",
      detail: "It is your largest open deal. Their last email asked about timing for the spring launch.",
    },
    recommendation: {
      title: "Follow up with all three this morning.",
      detail: `Answer ${top[0].company}’s question on timing first, then pick up where you left off with ${top
        .slice(1)
        .map((d) => d.company)
        .join(" and ")}.`,
    },
    impact: {
      value: "2×",
      label: `as likely to close when a quiet deal gets a reply within two weeks — on ${company.name}’s own history.`,
    },
    drafts: top.map((d, i) => ({ id: `d_${i}`, ...d })),
    basedOn: `Based on ${sources.length} ${sources.length === 1 ? "source" : "sources"} and two years of activity`,
  };
}
