import type { Metadata } from "next";
import { OnboardingExperience } from "@/components/onboarding/onboarding-experience";
import { pricing } from "@/content/marketing";
import { getInsights } from "@/services/insights";
import { getAutonomyPolicy, getOnboardingProgress, getSources, onboardingStages } from "@/services/onboarding";
import { getProjects } from "@/services/projects";
import { getCurrentUser, getNotifications, getWorkspace } from "@/services/user";
import type { OnboardingStage } from "@/types";

export const metadata: Metadata = {
  title: "Set up your workspace",
  description: "Create your account and let Syxoria get to know your company.",
  robots: { index: false, follow: false },
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * The onboarding — one continuous environment, from the account to the first briefing,
 * which then becomes the workspace.
 *
 *   ?mode=signin   open on "sign in" rather than "create an account" (/login lands here)
 *   ?plan=growth   the plan chosen on the pricing page
 *   ?at=analysis   resume at a given moment (stands in for the account's saved progress)
 */
export default async function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  const params = await searchParams;
  const at = one(params.at);
  const planId = one(params.plan);
  // TODO(auth): with a session, resume from the account's own progress instead of ?at
  const stage = onboardingStages.includes(at as OnboardingStage) && at !== "account" ? (at as OnboardingStage) : null;

  const [sources, policy, resume, user, workspace, notifications, insights, projects] = await Promise.all([
    getSources(),
    getAutonomyPolicy(),
    stage ? getOnboardingProgress(stage) : null,
    getCurrentUser(),
    getWorkspace(),
    getNotifications(),
    getInsights(),
    getProjects(),
  ]);
  const plan = pricing.plans.find((p) => p.id === planId && p.price.monthly !== null)?.name ?? null;

  return (
    <OnboardingExperience
      sources={sources}
      policy={policy}
      resume={resume}
      mode={one(params.mode) === "signin" ? "signin" : "create"}
      plan={plan}
      // the product's shell, ready for the moment the briefing becomes the workspace
      shell={{
        user,
        workspace,
        notifications,
        badges: { insights: insights.filter((i) => i.status === "new").length },
        projects: projects.filter((p) => p.status !== "completed").map(({ id, name, status }) => ({ id, name, status })),
      }}
    />
  );
}
