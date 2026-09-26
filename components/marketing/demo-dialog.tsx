"use client";

import { ArrowLeft } from "lucide-react";
import { useState, type ReactNode } from "react";
import { ArrowNudge, Button, ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { AppWindow, AutomateScreen, ConnectScreen, InsightsScreen, OverviewScreen, type PreviewData } from "./product-screens";

type Step = {
  id: string;
  label: string;
  title: string;
  body: string;
  window: { active: "overview" | "nexo" | "volt"; title: string };
  render: (data: PreviewData) => ReactNode;
};

const steps: Step[] = [
  {
    id: "connect",
    label: "Connect",
    title: "Roots: connect the tools you already use",
    body: "Pick your email, drive, CRM, invoicing and bank. Try it — toggle a few integrations.",
    window: { active: "overview", title: "Integrations" },
    render: (d) => <ConnectScreen data={d} />,
  },
  {
    id: "understand",
    label: "Understand",
    title: "Nexo notices what matters",
    body: "Every insight comes with its reasoning, confidence and expected impact. Apply one to see what happens.",
    window: { active: "nexo", title: "Nexo · Insights" },
    render: (d) => <InsightsScreen data={d} />,
  },
  {
    id: "act",
    label: "Act",
    title: "Volt turns it into quiet automation",
    body: "Automations always start in approval mode. Approve this one and watch it run.",
    window: { active: "volt", title: "Volt · Automations" },
    render: () => <AutomateScreen />,
  },
  {
    id: "grow",
    label: "Grow",
    title: "Progress becomes visible",
    body: "Time saved, revenue recovered and momentum — one calm overview that updates itself.",
    window: { active: "overview", title: "Overview" },
    render: (d) => <OverviewScreen data={d} />,
  },
];

/**
 * Interactive product tour (instead of a passive video). Each step is a real,
 * clickable slice of the product UI running on mock data.
 */
export function DemoDialog({ open, onClose, data }: { open: boolean; onClose: () => void; data: PreviewData }) {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const last = index === steps.length - 1;

  return (
    <Dialog
      open={open}
      onClose={() => {
        onClose();
        window.setTimeout(() => setIndex(0), 300);
      }}
      title="Product tour"
      description="A four-step interactive walkthrough of Syxoria."
      size="xl"
      hideHeader
    >
      <div className="grid min-h-[min(640px,80dvh)] lg:grid-cols-[20rem_1fr]">
        <div className="flex flex-col border-b border-line p-6 lg:border-b-0 lg:border-r lg:p-8">
          <p className="eyebrow">Product tour</p>
          <ol className="mt-5 flex gap-1.5 lg:mt-8 lg:flex-col lg:gap-1" aria-label="Tour steps">
            {steps.map((s, i) => (
              <li key={s.id} className="flex-1 lg:flex-none">
                <button
                  type="button"
                  aria-current={i === index ? "step" : undefined}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-md text-left transition-colors lg:px-3 lg:py-2.5",
                    i === index ? "lg:bg-white/[0.04]" : "hover:lg:bg-white/[0.02]",
                  )}
                >
                  <span
                    className={cn(
                      "h-1 w-full rounded-full transition-colors duration-300 lg:hidden",
                      i <= index ? "bg-accent" : "bg-line-strong",
                    )}
                  />
                  <span
                    className={cn(
                      "tabular hidden size-6 shrink-0 place-items-center rounded-full border text-[11px] transition-colors lg:grid",
                      i === index ? "border-accent bg-accent text-canvas" : i < index ? "border-accent-line text-accent" : "border-line-strong text-fg-3",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className={cn("hidden text-sm lg:block", i === index ? "text-fg" : "text-fg-3 group-hover:text-fg-2")}>{s.label}</span>
                  <span className="sr-only lg:hidden">
                    Step {i + 1}: {s.label}
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <div key={step.id} className="mt-6 animate-fade-in lg:mt-auto">
            <h3 className="text-xl font-medium tracking-tight text-fg">{step.title}</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-fg-2">{step.body}</p>
          </div>
          <div className="mt-6 flex items-center gap-2 lg:mt-8">
            <Button variant="ghost" size="icon" aria-label="Previous step" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
              <ArrowLeft aria-hidden="true" />
            </Button>
            {last ? (
              <ButtonLink href="/app" className="flex-1">
                Open the workspace
                <ArrowNudge />
              </ButtonLink>
            ) : (
              <Button className="flex-1" onClick={() => setIndex((i) => i + 1)}>
                Next: {steps[index + 1].label}
                <ArrowNudge />
              </Button>
            )}
          </div>
        </div>
        <div className="relative bg-canvas p-3 sm:p-6">
          <div className="h-full min-h-[380px] overflow-hidden rounded-lg border border-line shadow-float">
            <AppWindow active={step.window.active} title={step.window.title}>
              <div key={step.id} className="h-full animate-fade-in overflow-y-auto">
                {step.render(data)}
              </div>
            </AppWindow>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
