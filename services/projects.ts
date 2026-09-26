import { mockProjects } from "@/lib/mock-data/projects";
import { REFERENCE_NOW } from "@/lib/mock-data/series";
import type { CreateProjectInput, Project, ProjectQuery } from "@/types";
import { clone, ServiceError, simulateLatency } from "./_client";

/** TODO(api): GET /projects */
export async function getProjects(): Promise<Project[]> {
  return clone(mockProjects);
}

/** TODO(api): GET /projects/:id */
export async function getProject(id: string): Promise<Project | null> {
  return clone(mockProjects.find((p) => p.id === id) ?? null);
}

/**
 * Pure filtering/sorting — usable on the client for instant feedback, or
 * replaced by query params on the API (`GET /projects?search=&status=`).
 */
export function queryProjects(projects: Project[], query: ProjectQuery): Project[] {
  const search = query.search?.trim().toLowerCase() ?? "";
  const filtered = projects.filter((p) => {
    if (query.status && query.status !== "all" && p.status !== query.status) return false;
    if (query.module && query.module !== "all" && p.module !== query.module) return false;
    if (search && !`${p.name} ${p.description}`.toLowerCase().includes(search)) return false;
    return true;
  });
  const sort = query.sort ?? "updated";
  return filtered.sort((a, b) => {
    switch (sort) {
      case "name":
        return a.name.localeCompare(b.name);
      case "progress":
        return b.progress - a.progress;
      case "impact":
        return b.impact.value - a.impact.value;
      default:
        return b.updatedAt.localeCompare(a.updatedAt);
    }
  });
}

/** TODO(api): POST /projects */
export async function createProject(input: CreateProjectInput, ownerId: string): Promise<Project> {
  await simulateLatency();
  if (input.name.trim().toLowerCase() === "error") {
    // Handy for QA: type "error" as a name to see the failure state.
    throw new ServiceError("The project could not be created. Please try again.", "network");
  }
  return {
    id: `p_${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24)}_${Date.now().toString(36)}`,
    name: input.name.trim(),
    description: input.description.trim(),
    status: "on-track",
    stage: "seed",
    progress: 0,
    module: input.module,
    ownerId,
    memberIds: [ownerId],
    createdAt: REFERENCE_NOW,
    updatedAt: REFERENCE_NOW,
    dueDate: input.dueDate,
    impact: { value: 0, hoursSaved: 0 },
    milestones: [],
    progressHistory: [],
  };
}
