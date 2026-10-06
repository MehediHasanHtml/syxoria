import { knowledgeLabels } from "@/content/onboarding";
import type {
  AnalysisFinding,
  AutonomyPolicy,
  Briefing,
  CompanyProfile,
  DataSource,
  InitialAnalysis,
  KnowledgeEntry,
  KnowledgeKind,
  SourceCategory,
  UnderstandingEvent,
} from "@/types";

/**
 * Mock data for the onboarding. Everything here is what the backend will
 * answer later (company register, connectors, the understanding stream, the
 * first analysis, the briefing) — the UI only ever reads it through
 * services/onboarding.ts.
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
    purpose: "Client conversations, quotes you sent, follow-ups.",
    reads: ["Emails with clients and prospects", "Attachments such as quotes and contracts"],
  },
  {
    id: "outlook",
    name: "Outlook",
    logo: "outlook",
    category: "email",
    kind: "oauth",
    purpose: "Client conversations, quotes you sent, follow-ups.",
    reads: ["Emails with clients and prospects", "Attachments such as quotes and contracts"],
  },
  {
    id: "hubspot",
    name: "HubSpot",
    logo: "hubspot",
    category: "crm",
    kind: "oauth",
    purpose: "Your clients, your prospects and the deals in progress.",
    reads: ["Contacts and companies", "Deals and their stages", "Notes and logged activity"],
  },
  {
    id: "salesforce",
    name: "Salesforce",
    logo: "salesforce",
    category: "crm",
    kind: "oauth",
    purpose: "Your clients, your prospects and the deals in progress.",
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
    purpose: "A client list, an export, a budget — anything in a spreadsheet.",
    reads: ["Only the file you choose"],
  },
];

/** What a source holds, once connected — the line shown in its row */
export const sourceFindings: Record<string, string> = {
  gmail: "18,640 emails since 2024",
  outlook: "17,920 emails since 2024",
  hubspot: "214 companies · 38 open deals",
  salesforce: "206 accounts · 36 open opportunities",
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

/* ---------- Understanding (the discovery stream) ---------- */

/** For each kind of knowledge: which source categories can provide it, and how much they hold */
const knowledgeSupply: Record<KnowledgeKind, Partial<Record<SourceCategory, number>>> = {
  clients: { crm: 214, finance: 168, files: 186, email: 152 },
  opportunities: { crm: 156, documents: 94, email: 61 },
  invoices: { finance: 412, documents: 138, files: 120 },
  documents: { documents: 1240, email: 860 },
  conversations: { email: 18640, crm: 2310 },
};

export function buildKnowledge(sources: DataSource[]): KnowledgeEntry[] {
  return (Object.keys(knowledgeSupply) as KnowledgeKind[]).map((kind) => {
    const supply = knowledgeSupply[kind];
    const from = sources.filter((s) => supply[s.category] !== undefined);
    const count = Math.max(0, ...from.map((s) => supply[s.category] ?? 0));
    return { kind, label: knowledgeLabels[kind], count, from: [...new Set(from.map((s) => s.name))] };
  });
}

type Timed = { at: number; event: UnderstandingEvent };

/**
 * The script the mock stream plays: phases, running counts, relationships, and the things the
 * system notices along the way. `at` is milliseconds from the start.
 */
export function buildUnderstandingScript(company: CompanyProfile, sources: DataSource[]): Timed[] {
  const knowledge = buildKnowledge(sources);
  const total = (k: KnowledgeKind) => knowledge.find((e) => e.kind === k)?.count ?? 0;
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
  const has = (k: KnowledgeKind) => total(k) > 0;

  out.push({ at: 0, event: { type: "phase", id: "connect", message: "Connecting your company data…" } });
  out.push({ at: 1800, event: { type: "phase", id: "discover", message: "Discovering your business activity…" } });
  rise("conversations", 1900, 5200, 9);
  rise("documents", 2300, 5000);
  out.push({ at: 3600, event: { type: "notice", text: `${company.name} has been active since ${new Date(company.founded).getUTCFullYear()} — reading the last two years.` } });
  out.push({ at: 4800, event: { type: "phase", id: "customers", message: "Understanding your customers…" } });
  rise("clients", 4900, 7200);
  if (has("clients") && has("conversations")) out.push({ at: 6400, event: { type: "link", from: "conversations", to: "clients", label: "matched to clients" } });
  if (has("clients")) out.push({ at: 7000, event: { type: "notice", text: "Most of your revenue comes from 12 returning clients." } });
  out.push({ at: 7800, event: { type: "phase", id: "opportunities", message: "Analysing your opportunities…" } });
  rise("opportunities", 7900, 9800);
  rise("invoices", 8200, 10200);
  if (has("clients") && has("opportunities")) out.push({ at: 9200, event: { type: "link", from: "clients", to: "opportunities", label: "38 deals open" } });
  if (has("opportunities") && has("invoices")) out.push({ at: 9900, event: { type: "notice", text: "A signed quote becomes an invoice in 19 days on average." } });
  out.push({ at: 10600, event: { type: "phase", id: "profile", message: "Building your company profile…" } });
  if (has("opportunities") && has("invoices")) out.push({ at: 10900, event: { type: "link", from: "opportunities", to: "invoices", label: "quote → invoice" } });
  if (has("documents") && has("opportunities")) out.push({ at: 11400, event: { type: "link", from: "documents", to: "opportunities", label: "proposals" } });
  out.push({ at: 12300, event: { type: "phase", id: "priorities", message: "Identifying priorities…" } });
  if (has("opportunities")) out.push({ at: 12800, event: { type: "notice", text: "Five deals worth €96,400 have gone quiet for more than ten days." } });
  out.push({ at: 14400, event: { type: "done", knowledge, period: "Jan 2024 – today" } });
  return out.sort((a, b) => a.at - b.at);
}

/* ---------- The first analysis ---------- */

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

export function buildAnalysis(company: CompanyProfile, sources: DataSource[]): InitialAnalysis {
  const crm = namesFor(sources, ["crm"], "your emails and documents");
  const mail = namesFor(sources, ["email"], "logged activity");
  const money = namesFor(sources, ["finance"], namesFor(sources, ["documents", "files"], "your documents"));

  const findings: AnalysisFinding[] = [
    {
      id: "f_followup",
      tone: "priority",
      title: "Improve follow-up on active opportunities.",
      detail: "38 deals are open. Five of them, worth €96,400, have had no activity for more than ten days — follow-up is where you lose the most.",
      basedOn: `${crm} deals, ${mail} threads`,
    },
    {
      id: "f_quiet",
      tone: "observation",
      title: "Several high-value opportunities have gone quiet.",
      detail: "Atelier Rive (€42,000) hasn’t replied in 12 days — the longest silence on a deal above €20,000 this year.",
      basedOn: `${crm}, ${mail}`,
      evidence: quietDeals.map((d) => ({ label: d.company, value: `€${d.value.toLocaleString("en-GB")}`, note: `quiet ${d.quietDays} days` })),
    },
    {
      id: "f_returning",
      tone: "opportunity",
      title: "Returning clients are worth 2.4× new ones.",
      detail: `62% of ${company.name}’s revenue in the last 12 months came from clients who had worked with you before. Three of them haven’t started a project this year.`,
      basedOn: `${money}, ${crm}`,
    },
    {
      id: "f_late",
      tone: "attention",
      title: "Invoices are paid nine days later than your terms.",
      detail: "Payment takes 39 days on average against 30-day terms. €27,300 is overdue today, across six invoices.",
      basedOn: money,
    },
  ];

  return {
    objectives: ["Convert more of the pipeline already open", "Bring returning clients back earlier", "Get paid closer to your terms"],
    findings,
    kpis: [
      {
        id: "k_conversion",
        label: "Conversion rate",
        value: "24%",
        context: "of quotes signed · last 12 months",
        reason: "Most of your revenue starts as a quote — this is the number that moves it.",
        series: [19, 21, 20, 22, 21, 23, 22, 24, 23, 25, 24, 24],
      },
      {
        id: "k_open",
        label: "Open opportunities",
        value: "38",
        context: "worth €184,000 in total",
        reason: "Your pipeline is concentrated: five deals hold half of its value.",
      },
      {
        id: "k_deal",
        label: "Average deal value",
        value: "€4,850",
        context: "+12% on last year",
        reason: "Your projects are getting larger — this shows whether it holds.",
        series: [3900, 4100, 4050, 4300, 4250, 4400, 4500, 4480, 4620, 4700, 4790, 4850],
      },
      {
        id: "k_activity",
        label: "Client activity",
        value: "71%",
        context: "of clients active in the last 90 days",
        reason: "Returning clients drive your growth — this catches the ones drifting away.",
      },
    ],
  };
}

/* ---------- Autonomy ---------- */

export const mockAutonomyPolicy: AutonomyPolicy = {
  recommended: "assisted",
  levels: [
    { id: "guided", name: "Guided", summary: "Syxoria analyses and recommends. Every action waits for you." },
    { id: "assisted", name: "Assisted", summary: "Syxoria prepares the work and handles routine tasks. Anything important waits for you." },
    { id: "autonomous", name: "Autonomous", summary: "Syxoria acts on its own within the limits you set, and tells you what it did." },
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
      label: "Prepare reports and briefings",
      description: "Your morning briefing, weekly summaries, client reports.",
      defaults: { guided: "auto", assisted: "auto", autonomous: "auto" },
      allowed: ["auto", "ask", "off"],
    },
    {
      id: "suggest",
      group: "prepare",
      label: "Suggest next actions",
      description: "Who to call, what to follow up, what can wait.",
      defaults: { guided: "auto", assisted: "auto", autonomous: "auto" },
      allowed: ["auto", "off"],
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
      id: "draft",
      group: "prepare",
      label: "Draft emails and documents",
      description: "Follow-ups, quotes, replies — written, never sent on their own.",
      defaults: { guided: "ask", assisted: "auto", autonomous: "auto" },
      allowed: ["auto", "ask", "off"],
    },
    {
      id: "records",
      group: "act",
      label: "Update records",
      description: "Move a deal to its next stage, log a call, fix a contact.",
      defaults: { guided: "ask", assisted: "ask", autonomous: "auto" },
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
      label: "Financial actions",
      description: "Create an invoice, send a payment reminder.",
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

export function buildBriefing(sources: DataSource[]): Briefing {
  const top = quietDeals.slice(0, 3);
  return {
    priority: {
      title: `${top.length} opportunities need your attention today.`,
      detail: `Together they are worth €${top.reduce((s, d) => s + d.value, 0).toLocaleString("en-GB")}, and each has been quiet for more than ten days.`,
    },
    observation: {
      title: "Atelier Rive has been quiet for 12 days.",
      detail: "It is your largest open deal (€42,000). Their last email asked about timing for the spring launch.",
    },
    kpi: { label: "Pipeline value", value: 184000, change: 8, series: [141, 148, 146, 152, 158, 155, 163, 168, 171, 169, 178, 184] },
    recommendation: {
      title: "Follow up with these three this morning.",
      detail: "Here, deals that get a reply within two weeks of going quiet close twice as often.",
    },
    drafts: top.map((d, i) => ({ id: `d_${i}`, ...d })),
    basedOn: `Based on ${sources.length} ${sources.length === 1 ? "source" : "sources"} and two years of activity`,
  };
}
