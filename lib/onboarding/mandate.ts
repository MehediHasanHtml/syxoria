import type { AutonomyLevel, AutonomyPolicy, Briefing, DataSource, Mandate, PermissionMode, PermissionRule } from "@/types";

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

export type ActionItemStatus = "listed" | "awaiting-approval" | "scheduled";
export type BriefingAction = {
  /** what Syxoria will actually do: handle it · prepare it for approval · offer to · only keep it in view */
  kind: "handle" | "prepare" | "offer" | "list";
  /** The action at a glance — when it happens, or how many it is about — and what that figure counts */
  figure: string;
  caption: string;
  title: string;
  detail: string;
  status: ActionItemStatus;
  statusLabel: string;
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
 */
export function resolveBriefingAction(briefing: Briefing, mandate: Mandate, policy: AutonomyPolicy, connected: DataSource[]): BriefingAction {
  const mode = (id: string) => {
    const rule = policy.rules.find((r) => r.id === id);
    return rule ? effectiveMode(rule, mandate) : "off";
  };
  const n = briefing.drafts.length;
  const these = n === 1 ? "this reply" : "these replies";
  const email = connected.find((s) => s.category === "email");

  if (!email)
    return {
      kind: "list",
      figure: String(n),
      caption: n === 1 ? "deal kept in view" : "deals kept in view",
      title: `I’ll keep ${n === 1 ? "it" : `these ${n}`} at the top of your day.`,
      detail: "Connect your email and I can prepare the replies for you.",
      status: "listed",
      statusLabel: "To follow up",
    };
  if (mode("draft") === "off")
    return {
      kind: "list",
      figure: String(n),
      caption: n === 1 ? "deal kept in view" : "deals kept in view",
      title: `I’ll keep ${n === 1 ? "it" : `these ${n}`} at the top of your day.`,
      detail: "Drafting is off in your mandate, so I won’t write anything.",
      status: "listed",
      statusLabel: "To follow up",
    };
  if (mode("draft") === "ask")
    return {
      kind: "offer",
      figure: String(n),
      caption: n === 1 ? "reply, drafted on your word" : "replies, drafted on your word",
      title: `Shall I draft ${these}?`,
      detail: `I’ll write them in ${email.name} once you say so. Nothing before.`,
      status: "listed",
      statusLabel: "Ready to draft",
    };
  if (mode("send") === "auto")
    return {
      kind: "handle",
      figure: "10:00",
      caption: "routine replies go out",
      title: `I’ll handle ${these} within the mandate you’ve given me.`,
      detail: "Routine replies to existing clients go out at 10:00. If anyone asks for something new, such as a revised quote or a discount, I’ll stop and ask you.",
      status: "scheduled",
      statusLabel: "Sends at 10:00",
    };
  return {
    kind: "prepare",
    figure: "9:00",
    caption: "drafts ready for your approval",
    title: `I’ll prepare ${these} for your approval.`,
    detail:
      mode("records") === "auto"
        ? `Drafts will be waiting in ${email.name} at 9:00. Nothing is sent without you, and I’ll log their answers on each deal.`
        : `Drafts will be waiting in ${email.name} at 9:00. Nothing is sent without you.`,
    status: "awaiting-approval",
    statusLabel: "Draft for approval",
  };
}
