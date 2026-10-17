import type { HoldScope, PermissionMode, PermissionRule } from "@/types";

/**
 * How the workspace speaks about Syxoria's execution and the controls over it: the top bar's
 * status, the kill switch, its dialogs and Settings & Autonomy. Each control says exactly what it
 * does and what it does not. No dashes or hyphenated words in UI copy.
 */
export const automation = {
  status: {
    running: "Active",
    suspended: "Suspended",
    partly: (n: number) => `${n} paused`,
    /** The top bar's control, for screen readers */
    label: (word: string) => `Syxoria: ${word}. Autonomy and kill switch`,
  },
  panel: {
    mode: (name: string) => `${name} mode`,
    running: "Acting on its own within your rules.",
    suspended: "Autonomous actions are suspended. Syxoria still observes, analyses and prepares.",
    partly: "Acting on its own, except what you paused.",
    next: "Next on its own",
    nothingNext: "Nothing is set to start on its own today.",
    held: "Held until you resume",
    suspend: "Suspend autonomous actions",
    review: "Review and resume",
    settings: "Autonomy and safety",
    briefings: "Today’s briefings",
  },
  since: (time: string, bySafety: boolean) => (bySafety ? `Suspended by Syxoria’s safety protection at ${time}` : `Suspended by you at ${time}`),
  /** The banner's shorter word for the same */
  sinceShort: (time: string, bySafety: boolean) => (bySafety ? `Since ${time}, by its safety protection` : `Since ${time}, by you`),
  /** The line across every page while everything Syxoria would start on its own is held */
  banner: {
    title: "Autonomous actions are suspended",
    body: "Syxoria still observes and prepares. Nothing starts on its own.",
    held: (n: number) => (n === 1 ? "1 action held" : `${n} actions held`),
    review: "Review and resume",
  },
  /** Said wherever the prototype holds things, so nobody takes it for a real stop */
  preview: "Preview: the hold applies in this browser only. No real automation is connected yet.",
  suspend: {
    title: "Suspend autonomous actions?",
    description: "Syxoria stops starting anything on its own, across the whole workspace, until you resume.",
    stops: "What stops",
    stopsActions: "Every new action Syxoria would start on its own",
    stopsWorkflows: (names: string[]) => `Its workflows, whatever their schedule: ${names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0]}`,
    continues: "What carries on",
    continuesList: [
      "Observing your tools, analysing, briefings",
      "Drafts, prepared for your approval",
      "Answers from the assistant",
      "What you approve yourself, one action at a time",
    ],
    inFlight: "An action already handed to another service, such as an email Gmail has accepted, cannot be called back.",
    reason: "Reason, if you want to note one",
    reasons: ["Something looks wrong", "I want to review first", "A client asked us to pause", "Other"],
    confirm: "Suspend",
    cancel: "Cancel",
    busy: "Suspending",
  },
  resume: {
    title: (what: string) => `Resume ${what}?`,
    all: "autonomous actions",
    description: "What was held starts again as planned. Your autonomy mode and its limits are unchanged.",
    restarts: "Starts again",
    nothing: "Nothing was waiting to start.",
    check: "I have reviewed what was held and it can go ahead.",
    confirm: "Resume",
    keep: "Keep it paused",
    busy: "Resuming",
  },
  settings: {
    tab: "Autonomy & safety",
    mode: {
      title: "Autonomy mode",
      description: "How much Syxoria does on its own. Compare the modes to see exactly what each one allows.",
      current: "Your mode",
      compare: "Compare",
      change: "Switching modes from here comes with the full settings. Your mode was set during onboarding.",
    },
    reach: {
      title: "What Syxoria may do",
      description: (name: string) => `Rule by rule, under ${name} mode, as selected above.`,
      groups: { understand: "Observe and analyse", prepare: "Prepare and recommend", act: "Act" } satisfies Record<PermissionRule["group"], string>,
      modes: { auto: "On its own", ask: "Asks you first", off: "Off" } satisfies Record<PermissionMode, string>,
      locked: "Fixed",
      never: "Never, in any mode",
      tools: "Tools it acts in",
    },
    kill: {
      title: "Kill switch",
      description: "Suspends every new autonomous action at once. Syxoria keeps observing, analysing and preparing.",
      running: "Syxoria is acting on its own within your rules.",
      suspended: "Autonomous actions are suspended.",
      nextUp: (n: number) => (n === 1 ? "1 action would start on its own today." : `${n} actions would start on its own today.`),
    },
    targeted: {
      title: "Pause one thing",
      description: "Hold a single workflow, or everything Syxoria does in one tool, and leave the rest running.",
      workflows: "Workflows",
      tools: "Tools",
      pause: "Pause",
      resume: "Resume",
      paused: "Paused",
      running: "Running",
      coveredByGlobal: "Held by the kill switch",
      inTool: (tool: string) => `In ${tool}`,
      none: "Under your mode, nothing runs on its own.",
    },
    safety: {
      title: "Safety protection",
      description: "If the execution layer reports a critical incident, such as messages bouncing or an unusual volume, Syxoria holds the work concerned and says why here.",
      none: "No incident reported.",
      held: "Held",
    },
    controls: {
      title: "Not the same thing",
      description: "Each control does one thing. None of them is a shortcut for another.",
      items: [
        { name: "Suspend autonomous actions", does: "Stops anything new starting on its own. Observing, analysing and preparing continue.", where: "Kill switch, above" },
        { name: "Pause a workflow or a tool", does: "Holds that one thing. Everything else keeps running.", where: "Pause one thing, above" },
        { name: "Revoke a permission", does: "Syxoria may no longer do that kind of action, even when you ask.", where: "What Syxoria may do" },
        { name: "Disconnect an integration", does: "Syxoria can no longer read or act in that tool.", where: "Integrations" },
        { name: "Delete the workspace", does: "Stops Syxoria entirely, observing included, and removes your data.", where: "Security" },
      ],
    },
  },
  scopes: { global: "Everything", workflow: "Workflow", integration: "Tool" } satisfies Record<HoldScope, string>,
};

/** "21:05", in the browser's own time: when a hold was placed here */
export const holdTime = (iso: string) => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso)).replace(/^0/, "");
