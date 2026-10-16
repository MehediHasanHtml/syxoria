import type { AutonomyLevel, AutonomyPolicy, Briefing, DataSource, Mandate, PermissionMode, PermissionRule } from "@/types";
import { spellNumber } from "@/lib/format";

/** What a rule does under a mandate: the user's choice for it, else the level's default */
export function effectiveMode(rule: PermissionRule, mandate: Mandate): PermissionMode {
  const chosen = mandate.overrides[rule.id];
  return chosen && rule.allowed.includes(chosen) ? chosen : rule.defaults[mandate.level];
}

/** The actions a mandate is about — reading the data is always on, so it is never part of the choice */
export const actingRules = (policy: AutonomyPolicy) => policy.rules.filter((r) => r.group !== "understand");

/**
 * How far a mandate reaches, counted: of the actions Syxoria may take, how many it takes on its
 * own, how many come to the user first, how many are off. The mandate's ring and the modes' marks
 * are drawn from this — never from a number chosen to look right.
 */
export function reachOf(policy: AutonomyPolicy, mandate: Mandate) {
  const modes = actingRules(policy).map((r) => effectiveMode(r, mandate));
  const count = (m: PermissionMode) => modes.filter((x) => x === m).length;
  return { auto: count("auto"), ask: count("ask"), off: count("off"), total: modes.length };
}

/** The same, for a level as it comes — before any action-by-action adjustment */
export const reachOfLevel = (policy: AutonomyPolicy, level: AutonomyLevel) => reachOf(policy, { level, overrides: {} });


export type BriefingAction = {
  /** what Syxoria will actually do: handle it · prepare it for approval · offer to · only keep it in view */
  kind: "handle" | "prepare" | "offer" | "list";
  /** Where the action stands, in two or three words ("Already in hand") */
  label: string;
  /** What Syxoria does about it, in one sentence */
  title: string;
  /** The one reassurance that goes with it */
  note: string;
  /** The fuller sentence, for screen readers */
  detail: string;
  /** The decision the briefing ends on: the button's words */
  decision: string;
};

/** One moment in the life of a priority: who makes it happen, and whether it has happened yet */
export type FollowStep = {
  id: string;
  label: string;
  /** When, or by whom, when that is the point */
  when?: string;
  by: "syxoria" | "you" | "client";
  state: "done" | "now" | "next";
};

/**
 * The life of the priority from the moment it was found to the deal closing, as far as the mandate
 * takes it: what Syxoria has done, what it is doing, what waits on the user, what waits on the client.
 * Today it is the plan; each morning after, the briefing moves it on as things happen.
 */
export function followThrough(action: BriefingAction): FollowStep[] {
  const found: FollowStep = { id: "found", label: "Found", when: "Today", by: "syxoria", state: "done" };
  const end: FollowStep[] = [
    { id: "answered", label: "Answered", by: "client", state: "next" },
    { id: "closed", label: "Closed", by: "client", state: "next" },
  ];
  switch (action.kind) {
    case "handle":
      return [found, { id: "drafted", label: "Drafted", when: "Now", by: "syxoria", state: "now" }, { id: "sent", label: "Sent", when: "10:00", by: "syxoria", state: "next" }, ...end];
    case "prepare":
      return [
        found,
        { id: "drafted", label: "Drafted", when: "By 9:00", by: "syxoria", state: "now" },
        { id: "approved", label: "Approved", when: "By you", by: "you", state: "next" },
        { id: "sent", label: "Sent", by: "syxoria", state: "next" },
        ...end,
      ];
    case "offer":
      return [found, { id: "word", label: "Your word", when: "To draft", by: "you", state: "now" }, { id: "drafted", label: "Drafted", by: "syxoria", state: "next" }, { id: "sent", label: "Sent", when: "By you", by: "you", state: "next" }, ...end];
    case "list":
      return [found, { id: "view", label: "In view", when: "Every morning", by: "syxoria", state: "now" }, { id: "replied", label: "Replied", when: "By you", by: "you", state: "next" }, ...end];
  }
}

/**
 * The briefing's ACTION — only what Syxoria can genuinely do today, given what the product can do,
 * the tools connected and the mandate just set. It never promises more: without an email source
 * there is nothing to draft from or send with; with drafting off it only keeps the deals in view.
 * It says what Syxoria will do or has in hand, never that it has already done it.
 */
export function resolveBriefingAction(briefing: Briefing, mandate: Mandate, policy: AutonomyPolicy, connected: DataSource[]): BriefingAction {
  const mode = (id: string) => {
    const rule = policy.rules.find((r) => r.id === id);
    return rule ? effectiveMode(rule, mandate) : "off";
  };
  const n = briefing.drafts.length;
  const one = n === 1;
  const these = one ? "this reply" : "these replies";
  const yours = one ? "Your reply" : `Your ${spellNumber(n)} replies`;
  const email = connected.find((s) => s.category === "email");
  const inView = { kind: "list", label: "Kept in view", title: `I’ll keep ${one ? "it" : `these ${spellNumber(n)}`} at the top of your day.`, decision: "Enter Syxoria" } as const;

  if (!email) return { ...inView, note: "Connect your email and I can prepare the replies.", detail: "Connect your email and I can prepare the replies for you." };
  if (mode("draft") === "off") return { ...inView, note: "Drafting is off in your mandate.", detail: "Drafting is off in your mandate, so I won’t write anything." };
  if (mode("draft") === "ask")
    return {
      kind: "offer",
      label: "Ready when you are",
      title: `Shall I draft ${these}?`,
      note: `I’ll write ${one ? "it" : "them"} in ${email.name} once you say so.`,
      detail: `I’ll write ${one ? "it" : "them"} in ${email.name} once you say so. Nothing before.`,
      decision: "Enter Syxoria",
    };
  if (mode("send") === "auto")
    return {
      kind: "handle",
      label: "Under way",
      title: `${yours} ${one ? "goes" : "go"} out at 10:00.`,
      note: "Routine replies only. Anything new comes to you first.",
      detail: "Routine replies to existing clients go out at 10:00. If anyone asks for something new, such as a revised quote or a discount, I’ll stop and ask you.",
      decision: "Enter Syxoria",
    };
  return {
    kind: "prepare",
    label: "Already in hand",
    title: `${yours} will be ready in ${email.name} by 9:00.`,
    note: "Nothing is sent without your approval.",
    detail:
      mode("records") === "auto"
        ? `Drafts will be waiting in ${email.name} at 9:00. Nothing is sent without you, and I’ll log their answers on each deal.`
        : `Drafts will be waiting in ${email.name} at 9:00. Nothing is sent without you.`,
    decision: "Review the replies",
  };
}
