"use client";

import { useCallback, useReducer, useState } from "react";
import type { ShellContext } from "@/components/dashboard/app-shell";
import { stageNames } from "@/content/onboarding";
import { connectedIds, coreFor, emptySnapshot, knowsFor, learningProgress, milestonesFor, onboardingReducer, type OnboardingAction } from "@/lib/onboarding/machine";
import { getFirstBriefing, saveMandate } from "@/services/onboarding";
import type { AutonomyPolicy, DataSource, Mandate, OnboardingSnapshot, OnboardingStage } from "@/types";
import { AccountStep } from "./account-step";
import { AutonomyStep } from "./autonomy-step";
import { CompanyStep } from "./company-step";
import { ConnectTools } from "./connect-tools";
import { FirstBriefing } from "./first-briefing";
import { OnboardingShell, type ShellLayout } from "./onboarding-shell";
import { PrioritiesStep } from "./priorities-step";
import { TransitionToSaaS } from "./transition-to-saas";
import { UnderstandingVisualization } from "./understanding-visualization";
import { transition } from "./view-transition";
import { KnowsStrip, WhatSyxoriaKnows } from "./what-syxoria-knows";

type Props = {
  sources: DataSource[];
  policy: AutonomyPolicy;
  shell: ShellContext;
  /** Where to start: a fresh account, or progress the backend says this account already made */
  resume: OnboardingSnapshot | null;
  mode: "create" | "signin";
  plan: string | null;
};

const layouts: Record<Exclude<OnboardingStage, "complete">, ShellLayout> = {
  account: "focus",
  company: "split",
  connections: "split",
  syncing: "split",
  analysis: "split",
  autonomy: "split",
  briefing: "briefing",
};

/**
 * The onboarding: one environment that grows richer as Syxoria learns the company — sign in,
 * identify, confirm, connect, understand, prioritise, mandate, brief — and then becomes the
 * product. Every moment reads and writes one state (lib/onboarding/machine.ts); the Core is the
 * same object throughout, moving between the bar and the stage as a shared element.
 */
export function OnboardingExperience({ sources, policy, shell, resume, mode, plan }: Props) {
  const [state, dispatch] = useReducer(onboardingReducer, resume ?? emptySnapshot);
  const [pulse, bump] = useReducer((n: number) => n + 1, 0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /** stage changes go through a transition; everything else updates in place */
  const move = useCallback((action: OnboardingAction) => transition(() => dispatch(action)), []);
  const onPulse = useCallback(() => bump(), []);

  const connected = sources.filter((s) => connectedIds(state).includes(s.id));
  const core = coreFor(state);
  const knows = knowsFor(state);
  const milestones = milestonesFor(state);

  async function confirmMandate(mandate: Mandate) {
    if (!state.company) return;
    setSaving(true);
    setSaveError(null);
    try {
      const [saved, briefing] = await Promise.all([saveMandate(mandate), getFirstBriefing(state.company, connected)]);
      move({ type: "mandated", mandate: saved, briefing });
    } catch {
      setSaveError("Your mandate couldn’t be saved just now. Nothing changed — please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (state.stage === "complete" && state.company && state.briefing && state.mandate) {
    return <TransitionToSaaS shell={shell} snapshot={{ ...state, company: state.company, briefing: state.briefing, mandate: state.mandate }} sources={sources} policy={policy} />;
  }

  const stage = state.stage === "complete" ? "briefing" : state.stage;
  const memoryProps = { snapshot: state, sources };
  // the Core lives in the composition while signing in, while it understands and while its mandate
  // is being set (there it sits inside the boundary the user draws); in the bar otherwise
  const coreHere = stage !== "account" && stage !== "syncing" && stage !== "autonomy";
  const awake = milestones.filter((m) => m.on).length / milestones.length;

  return (
    <OnboardingShell
      layout={layouts[stage]}
      density={knows.density}
      awake={awake}
      bar={{ core: { ...core, pulse }, coreHere, milestones, email: state.session?.email ?? null }}
      announcement={`${stageNames[stage]}.${core.word ? ` Syxoria: ${core.word.toLowerCase()}.` : ""}`}
      memory={<WhatSyxoriaKnows {...memoryProps} />}
      strip={<KnowsStrip {...memoryProps} />}
    >
      {stage === "account" && <AccountStep initialMode={mode} plan={plan} onAuthenticated={(session) => move({ type: "authenticated", session })} />}

      {stage === "company" && (
        <CompanyStep
          welcome={state.session?.returning ? `Welcome back${state.session.firstName ? `, ${state.session.firstName}` : ""}` : null}
          candidate={state.candidate}
          onSearching={(on) => dispatch({ type: "activity", activity: on ? "searching" : null })}
          onCandidate={(company) => dispatch({ type: "candidate", company })}
          onPulse={onPulse}
          onConfirmed={(company) => move({ type: "companyConfirmed", company })}
        />
      )}

      {stage === "connections" && (
        <ConnectTools
          company={state.company}
          sources={sources}
          connections={state.connections}
          onChange={(id, connection) => dispatch({ type: "connection", id, connection })}
          onPulse={onPulse}
          onContinue={() => move({ type: "go", stage: "syncing" })}
          onBack={() => move({ type: "go", stage: "company" })}
        />
      )}

      {stage === "syncing" && state.company && (
        <UnderstandingVisualization
          company={state.company}
          sources={connected}
          found={state.found}
          progress={learningProgress(state)}
          onFound={(kind, count) => dispatch({ type: "found", kind, count })}
          onUnderstood={(knowledge) => dispatch({ type: "understood", knowledge })}
          onAnalysed={(analysis) => move({ type: "analysed", analysis })}
        />
      )}

      {stage === "analysis" && state.analysis && <PrioritiesStep analysis={state.analysis} onContinue={() => move({ type: "go", stage: "autonomy" })} />}

      {stage === "autonomy" && (
        <AutonomyStep
          policy={policy}
          initial={state.mandate}
          saving={saving}
          error={saveError}
          pulse={pulse}
          // the Core answers each mandate it is offered: it stirs once
          onLevel={onPulse}
          onConfirm={confirmMandate}
          onBack={() => move({ type: "go", stage: "analysis" })}
        />
      )}

      {stage === "briefing" && state.briefing && state.mandate && (
        <FirstBriefing
          briefing={state.briefing}
          mandate={state.mandate}
          policy={policy}
          sources={connected}
          firstName={state.session?.firstName ?? null}
          variant="onboarding"
          onEntering={onPulse}
          onBeat={onPulse}
          onEnter={() => move({ type: "go", stage: "complete" })}
        />
      )}
    </OnboardingShell>
  );
}
