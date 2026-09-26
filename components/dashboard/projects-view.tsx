"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheck, Plus, Search, X } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Avatar, AvatarStack } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { ModuleIcon } from "@/components/shared/module-icon";
import { EmptyState } from "@/components/shared/states";
import { ProjectStatusBadge, projectStatusMeta, StageIndicator } from "@/components/shared/status";
import { formatCurrency, formatRelative, formatShortDate } from "@/lib/format";
import { productModules } from "@/lib/mock-data/modules";
import { REFERENCE_NOW } from "@/lib/mock-data/series";
import { queryProjects } from "@/services/projects";
import type { ModuleKey, Project, ProjectQuery, ProjectSort, ProjectStatus, User } from "@/types";
import { CreateProjectDialog } from "./create-project-dialog";

const NOW = new Date(REFERENCE_NOW);
const progressTone = { "on-track": "accent", "at-risk": "caution", blocked: "negative", completed: "fg", paused: "fg" } as const;

export function ProjectsView({
  initialProjects,
  members,
  currentUserId,
  initialSearch = "",
  openCreate = false,
}: {
  initialProjects: Project[];
  members: User[];
  currentUserId: string;
  initialSearch?: string;
  openCreate?: boolean;
}) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [query, setQuery] = useState<Required<ProjectQuery>>({ search: initialSearch, status: "all", module: "all", sort: "updated" });
  const [createOpen, setCreateOpen] = useState(openCreate);
  const [toast, setToast] = useState<Project | null>(null);
  // Mock mode: created projects live only in this browser session until the API persists them.
  const [localIds, setLocalIds] = useState<Set<string>>(() => new Set());
  const deferredSearch = useDeferredValue(query.search);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const results = useMemo(() => queryProjects([...projects], { ...query, search: deferredSearch }), [projects, query, deferredSearch]);
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const filtered = query.search !== "" || query.status !== "all" || query.module !== "all";

  const update = <K extends keyof ProjectQuery>(key: K, value: Required<ProjectQuery>[K]) => setQuery((q) => ({ ...q, [key]: value }));
  const reset = () => {
    setQuery({ search: "", status: "all", module: "all", sort: query.sort });
    router.replace("/app/projects", { scroll: false });
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid flex-1 gap-2 sm:grid-cols-2 lg:flex lg:max-w-4xl">
          <div className="relative sm:col-span-2 lg:w-72">
            <label htmlFor="project-search" className="sr-only">
              Search projects
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-3" aria-hidden="true" />
            <Input
              id="project-search"
              type="search"
              value={query.search}
              onChange={(e) => update("search", e.target.value)}
              placeholder="Search by name or description"
              className="pl-9"
            />
          </div>
          <label className="sr-only" htmlFor="filter-status">
            Status
          </label>
          <Select id="filter-status" value={query.status} onChange={(e) => update("status", e.target.value as ProjectStatus | "all")} className="lg:w-40">
            <option value="all">All statuses</option>
            {(Object.keys(projectStatusMeta) as ProjectStatus[]).map((s) => (
              <option key={s} value={s}>
                {projectStatusMeta[s].label}
              </option>
            ))}
          </Select>
          <label className="sr-only" htmlFor="filter-module">
            Module
          </label>
          <Select id="filter-module" value={query.module} onChange={(e) => update("module", e.target.value as ModuleKey | "all")} className="lg:w-40">
            <option value="all">All modules</option>
            {productModules.map((m) => (
              <option key={m.key} value={m.key}>
                {m.name}
              </option>
            ))}
          </Select>
          <label className="sr-only" htmlFor="sort">
            Sort by
          </label>
          <Select id="sort" value={query.sort} onChange={(e) => update("sort", e.target.value as ProjectSort)} className="sm:col-span-2 lg:w-44">
            <option value="updated">Recently updated</option>
            <option value="progress">Most progress</option>
            <option value="impact">Highest impact</option>
            <option value="name">Name A–Z</option>
          </Select>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0">
          <Plus aria-hidden="true" /> New project
        </Button>
      </div>

      <div className="mt-4 flex h-6 items-center gap-3 text-xs text-fg-3" aria-live="polite">
        <span className="tabular">
          {results.length} of {projects.length} projects
        </span>
        {filtered && (
          <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-fg-2 transition-colors hover:text-fg">
            <X className="size-3.5" aria-hidden="true" /> Clear filters
          </button>
        )}
      </div>

      {/* Results */}
      <div className="mt-3">
        {projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-strong">
            <EmptyState
              title="Plant your first project"
              description="Projects group the automations, goals and insights that move one outcome forward."
              action={
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus aria-hidden="true" /> Create a project
                </Button>
              }
            />
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-xl border border-line">
            <EmptyState
              icon={<Search aria-hidden="true" />}
              title="No projects match these filters"
              description="Try a different search, or clear the filters to see everything."
              action={
                <Button variant="secondary" onClick={reset}>
                  Clear filters
                </Button>
              }
            />
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-xl border border-line md:block">
              <div className="max-h-[70vh] overflow-auto">
                <table className="w-full min-w-[880px] border-collapse text-left text-[13px]">
                  <caption className="sr-only">Projects</caption>
                  <thead className="sticky top-0 z-[1] bg-canvas-2/95 backdrop-blur">
                    <tr className="border-b border-line text-[11px] uppercase tracking-label text-fg-3">
                      <th scope="col" className="px-5 py-3 font-medium">Project</th>
                      <th scope="col" className="px-3 py-3 font-medium">Status</th>
                      <th scope="col" className="w-48 px-3 py-3 font-medium">Progress</th>
                      <th scope="col" className="px-3 py-3 font-medium">Team</th>
                      <th scope="col" className="px-3 py-3 text-right font-medium">Impact</th>
                      <th scope="col" className="px-5 py-3 text-right font-medium">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {results.map((p) => {
                      const team = p.memberIds.map((id) => byId.get(id)).filter((u): u is User => Boolean(u));
                      return (
                        <tr key={p.id} className="group relative transition-colors hover:bg-white/[0.02]">
                          <td className="max-w-md px-5 py-4">
                            <div className="flex items-start gap-3">
                              <ModuleIcon module={p.module} framed />
                              <div className="min-w-0">
                                {localIds.has(p.id) ? (
                                  <span className="flex items-center gap-2 font-medium text-fg">
                                    {p.name}
                                    <span className="rounded-xs border border-accent-line px-1.5 text-[10px] font-normal text-accent">Draft</span>
                                  </span>
                                ) : (
                                  <Link href={`/app/projects/${p.id}`} className="font-medium text-fg after:absolute after:inset-0 hover:text-white focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-accent">
                                    {p.name}
                                  </Link>
                                )}
                                <p className="mt-0.5 truncate text-xs text-fg-3">{p.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <ProjectStatusBadge status={p.status} />
                          </td>
                          <td className="px-3 py-4">
                            <div className="flex items-center gap-3">
                              <Progress value={p.progress} label={`${p.name} progress`} tone={progressTone[p.status]} />
                              <span className="tabular w-9 text-right text-fg-2">{p.progress}%</span>
                            </div>
                            <div className="mt-1.5">
                              <StageIndicator stage={p.stage} />
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <AvatarStack people={team} />
                          </td>
                          <td className="tabular px-3 py-4 text-right text-fg-2">{p.impact.value > 0 ? formatCurrency(p.impact.value) : "—"}</td>
                          <td className="px-5 py-4 text-right text-xs text-fg-3">{formatRelative(p.updatedAt, NOW)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <ul className="grid gap-3 md:hidden">
              {results.map((p) => {
                const owner = byId.get(p.ownerId);
                const isDraft = localIds.has(p.id);
                const content = (
                  <>
                    <div className="flex min-w-0 items-start gap-3">
                      <ModuleIcon module={p.module} framed />
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-medium text-fg">
                          {p.name}
                          {isDraft && <span className="rounded-xs border border-accent-line px-1.5 text-[10px] font-normal text-accent">Draft</span>}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-fg-3">{p.description}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <Progress value={p.progress} label={`${p.name} progress`} tone={progressTone[p.status]} />
                      <span className="tabular text-xs text-fg-2">{p.progress}%</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <ProjectStatusBadge status={p.status} />
                      <span className="flex items-center gap-2 text-[11px] text-fg-3">
                        {owner && <Avatar initials={owner.initials} name={owner.name} size="xs" />}
                        {p.dueDate ? `Due ${formatShortDate(p.dueDate)}` : "No due date"}
                      </span>
                    </div>
                  </>
                );
                const cls = "block rounded-lg border border-line bg-surface/60 p-4 transition-colors";
                return (
                  <li key={p.id}>
                    {isDraft ? (
                      <div className={cls}>{content}</div>
                    ) : (
                      <Link href={`/app/projects/${p.id}`} className={`${cls} active:bg-surface`}>
                        {content}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <CreateProjectDialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          if (openCreate) router.replace("/app/projects", { scroll: false });
        }}
        ownerId={currentUserId}
        onCreated={(p) => {
          setProjects((list) => [p, ...list]);
          setLocalIds((ids) => new Set(ids).add(p.id));
          setToast(p);
        }}
      />

      {/* Success toast */}
      <div aria-live="polite" className="pointer-events-none fixed bottom-6 right-4 z-(--z-toast) sm:right-6">
        {toast && (
          <div className="pointer-events-auto flex animate-fade-in items-center gap-3 rounded-lg border border-line bg-canvas-2/95 py-3 pl-4 pr-2 shadow-float backdrop-blur">
            <CircleCheck className="size-4 text-positive" aria-hidden="true" />
            <p className="text-[13px] text-fg">
              <span className="font-medium">{toast.name}</span> was created.
            </p>
            <button type="button" aria-label="Dismiss" onClick={() => setToast(null)} className="grid size-7 place-items-center rounded-sm text-fg-3 hover:bg-white/5 hover:text-fg">
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
