import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProjectsView } from "@/components/dashboard/projects-view";
import { getProjects } from "@/services/projects";
import { getCurrentUser, getMembers } from "@/services/user";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage({ searchParams }: PageProps<"/app/projects">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const [projects, members, user] = await Promise.all([getProjects(), getMembers(), getCurrentUser()]);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Workspace", href: "/app" }, { label: "Projects" }]}
        title="Projects"
        description="Every outcome your company is growing toward — with its progress, owners and impact."
      />
      {/* key: a new top-bar search (?q=) re-initialises the view */}
      <ProjectsView key={q} initialProjects={projects} members={members} currentUserId={user.id} initialSearch={q} openCreate={params.new === "1"} />
    </>
  );
}
