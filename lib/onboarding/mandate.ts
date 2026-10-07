import type { AutonomyLevel, AutonomyPolicy, Briefing, DataSource, Mandate, PermissionMode, PermissionRule } from "@/types";

/** What a rule does under a mandate: the user's choice for it, else the level's default */
export function effectiveMode(rule: PermissionRule, mandate: Mandate): PermissionMode {
  const chosen = mandate.overrides[rule.id];
  return chosen && rule.allowed.includes(chosen) ? chosen : rule.defaults[mandate.level];
}

/** How much autonomy a level gives, 0–1 — the Core's light and the mandate's emerald follow it */
export const autonomyShare: Record<AutonomyLevel, number> = { guided: 0.34, assisted: 0.67, autonomous: 1 };

export type ActionItemStatus = "listed" | "awaiting-approval" | "scheduled";
export type BriefingAction = {
  /** what Syxoria will actually do: handle it · prepare it for approval · offer to · only keep it in view */
  kind: "handle" | "prepare" | "offer" | "list";
  title: string;
  detail: string;
  status: ActionItemStatus;
  statusLabel: string;
};

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
  const these = n === 1 ? "this follow-up" : "these follow-ups";
  const email = connected.find((s) => s.category === "email");

  if (!email)
    return {
      kind: "list",
      title: `I’ll keep ${n === 1 ? "it" : `these ${n}`} at the top of your day.`,
      detail: "Connect your email and I can prepare the follow-ups for you.",
      status: "listed",
      statusLabel: "To follow up",
    };
  if (mode("draft") === "off")
    return {
      kind: "list",
      title: `I’ll keep ${n === 1 ? "it" : `these ${n}`} at the top of your day.`,
      detail: "Drafting is off in your mandate, so I won’t write anything.",
      status: "listed",
      statusLabel: "To follow up",
    };
  if (mode("draft") === "ask")
    return {
      kind: "offer",
      title: `Shall I draft ${these}?`,
      detail: `I’ll write them in ${email.name} once you say so — nothing before.`,
      status: "listed",
      statusLabel: "Ready to draft",
    };
  if (mode("send") === "auto")
    return {
      kind: "handle",
      title: `I’ll handle ${these} within the mandate you’ve given me.`,
      detail: "Routine follow-ups to existing clients go out at 10:00. If anyone asks for something new — a revised quote, a discount — I’ll stop and ask you.",
      status: "scheduled",
      statusLabel: "Sends at 10:00",
    };
  return {
    kind: "prepare",
    title: `I’ll prepare ${these} for your approval.`,
    detail:
      mode("records") === "auto"
        ? `Drafts will be waiting in ${email.name} at 9:00. Nothing is sent without you — I’ll log the replies to each deal.`
        : `Drafts will be waiting in ${email.name} at 9:00. Nothing is sent without you.`,
    status: "awaiting-approval",
    statusLabel: "Draft for approval",
  };
}
