import type { FocusPriority } from "@/types/workspace";

/**
 * The five lenses on the business the overview concepts open (Sales, Clients, Finance, Marketing,
 * Goals), the evening of the demo day. Each says in a few words where that part of the business
 * stands tonight, and how: needs the owner, Syxoria is acting on it, or nothing to report. The
 * story behind each lens is the section's own focus (lib/mock-data/business.ts); Clients has its
 * own, built from the client file of Oréa Clinics (relations.ts) and its prepared action.
 * No dashes or hyphenated words in UI copy.
 */
export type LensId = "sales" | "clients" | "finance" | "marketing" | "goals";
export type LensTone = "attention" | "acting" | "watch" | "calm";

export const mockLenses: { id: LensId; name: string; word: string; tone: LensTone; href: string }[] = [
  { id: "sales", name: "Sales", word: "A quote came back", tone: "attention", href: "/app/business/sales" },
  { id: "clients", name: "Clients", word: "Oréa quiet 18 days", tone: "attention", href: "/app/clients" },
  { id: "finance", name: "Finance", word: "Reminder approved", tone: "acting", href: "/app/business/finance" },
  { id: "marketing", name: "Marketing", word: "Cost per lead up 41%", tone: "watch", href: "/app/business/marketing" },
  { id: "goals", name: "Goals", word: "Q4 ahead of pace", tone: "calm", href: "/app/business/goals" },
];

/** The client relationship that needs the owner most tonight */
export const mockClientsFocus: FocusPriority = {
  label: "The relationship that needs you",
  title: "Oréa Clinics has been quiet for 18 days",
  why: "Dr Léa Fournier asked for references after the discovery call. Past ten quiet days, your proposals close half as often.",
  severity: "high",
  stake: "€26,000",
  due: "Waits for your approval",
  chain: [
    { label: "Business data", detail: "No reply since 26 September", state: "done" },
    { label: "Analysis", detail: "Two comparable clinic projects found", state: "done" },
    { label: "Recommendation", detail: "Send Léa two clinic references", state: "now" },
    { label: "Action", detail: "References drafted, wait for you", state: "next" },
    { label: "Follow up", detail: "A short call once she has read them", state: "next" },
  ],
  cta: "Review the references",
  href: "/app/actions?action=refs_orea",
};
