import {
  CircleCheck,
  CircleDot,
  CirclePause,
  CircleSlash,
  Eye,
  Loader,
  Lock,
  Sparkles,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { InsightPriority, InsightStatus, ProjectStage, ProjectStatus } from "@/types";

type Meta = { label: string; tone: BadgeTone; icon: LucideIcon };

/** UI mapping for statuses — label + icon + tone, so state never relies on color alone. */
export const projectStatusMeta: Record<ProjectStatus, Meta> = {
  "on-track": { label: "On track", tone: "positive", icon: CircleDot },
  "at-risk": { label: "At risk", tone: "caution", icon: TriangleAlert },
  blocked: { label: "Blocked", tone: "negative", icon: CircleSlash },
  completed: { label: "Completed", tone: "neutral", icon: CircleCheck },
  paused: { label: "Paused", tone: "neutral", icon: CirclePause },
};

export const insightStatusMeta: Record<InsightStatus, Meta> = {
  new: { label: "New", tone: "accent", icon: Sparkles },
  "in-review": { label: "In review", tone: "info", icon: Eye },
  applied: { label: "Applied", tone: "positive", icon: CircleCheck },
  dismissed: { label: "Dismissed", tone: "neutral", icon: X },
  locked: { label: "Locked", tone: "neutral", icon: Lock },
  processing: { label: "Processing", tone: "info", icon: Loader },
};

export const priorityMeta: Record<InsightPriority, { label: string; bars: number }> = {
  high: { label: "High priority", bars: 3 },
  medium: { label: "Medium priority", bars: 2 },
  low: { label: "Low priority", bars: 1 },
};

export const stageMeta: Record<ProjectStage, { label: string; step: number }> = {
  seed: { label: "Seed", step: 1 },
  rooting: { label: "Rooting", step: 2 },
  growing: { label: "Growing", step: 3 },
  flourishing: { label: "Flourishing", step: 4 },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const meta = projectStatusMeta[status];
  const Icon = meta.icon;
  return (
    <Badge tone={meta.tone} icon={<Icon aria-hidden="true" />}>
      {meta.label}
    </Badge>
  );
}

export function InsightStatusBadge({ status }: { status: InsightStatus }) {
  const meta = insightStatusMeta[status];
  const Icon = meta.icon;
  return (
    <Badge tone={meta.tone} icon={<Icon aria-hidden="true" className={status === "processing" ? "animate-spin" : undefined} />}>
      {meta.label}
    </Badge>
  );
}

/** Three-bar priority glyph with text label for screen readers. */
export function PriorityIndicator({ priority, showLabel = false }: { priority: InsightPriority; showLabel?: boolean }) {
  const meta = priorityMeta[priority];
  return (
    <span className="inline-flex items-center gap-2 text-xs text-fg-3">
      <span aria-hidden="true" className="flex items-end gap-0.5">
        {[1, 2, 3].map((b) => (
          <span
            key={b}
            className={b <= meta.bars ? (priority === "high" ? "bg-accent" : "bg-fg-2") : "bg-line-strong"}
            style={{ width: 3, height: 4 + b * 3, borderRadius: 1 }}
          />
        ))}
      </span>
      <span className={showLabel ? undefined : "sr-only"}>{meta.label}</span>
    </span>
  );
}

/** Four-step growth stage indicator — the tree metaphor inside the product. */
export function StageIndicator({ stage }: { stage: ProjectStage }) {
  const meta = stageMeta[stage];
  return (
    <span className="inline-flex items-center gap-2 text-xs text-fg-2">
      <span aria-hidden="true" className="flex items-center gap-1">
        {[1, 2, 3, 4].map((s) => (
          <span key={s} className={s <= meta.step ? "size-1.5 rounded-full bg-accent" : "size-1.5 rounded-full bg-line-strong"} />
        ))}
      </span>
      <span>{meta.label}</span>
    </span>
  );
}

