import Link from "next/link";
import { ModuleIcon } from "@/components/shared/module-icon";
import { projectStatusMeta, StageIndicator } from "@/components/shared/status";
import { Progress } from "@/components/ui/progress";
import type { Project } from "@/types";

const tone = { "on-track": "accent", "at-risk": "caution", blocked: "negative", completed: "fg", paused: "fg" } as const;

export function ProjectProgressList({ projects }: { projects: Project[] }) {
  return (
    <ul className="divide-y divide-line">
      {projects.map((p) => {
        const meta = projectStatusMeta[p.status];
        const Icon = meta.icon;
        return (
          <li key={p.id}>
            <Link href={`/app/projects/${p.id}`} className="group -mx-2 block rounded-md px-2 py-3.5 transition-colors hover:bg-white/[0.02]">
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2.5">
                  <ModuleIcon module={p.module} className="size-4 shrink-0 text-fg-3" />
                  <span className="truncate text-[13.5px] text-fg transition-colors group-hover:text-white">{p.name}</span>
                </span>
                <span className="tabular shrink-0 text-[13px] text-fg">{p.progress}%</span>
              </div>
              <Progress value={p.progress} label={`${p.name} progress`} tone={tone[p.status]} className="mt-2.5" />
              <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-fg-3">
                <StageIndicator stage={p.stage} />
                <span className="inline-flex items-center gap-1">
                  <Icon className="size-3" aria-hidden="true" />
                  {meta.label}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
