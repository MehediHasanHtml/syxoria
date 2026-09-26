import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Clock3, Coins } from "lucide-react";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { AreaChart } from "@/components/dashboard/charts/area-chart";
import { InsightCard } from "@/components/dashboard/insight-card";
import { MilestoneList } from "@/components/dashboard/milestone-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModuleIcon } from "@/components/shared/module-icon";
import { EmptyState } from "@/components/shared/states";
import { ProjectStatusBadge, StageIndicator } from "@/components/shared/status";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress";
import { formatCurrency, formatDate } from "@/lib/format";
import { moduleByKey } from "@/lib/mock-data/modules";
import { getProjectActivity } from "@/services/activity";
import { getInsightsForProject } from "@/services/insights";
import { getProject } from "@/services/projects";
import { getMembers } from "@/services/user";

export async function generateMetadata({ params }: PageProps<"/app/projects/[id]">): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);
  return { title: project ? project.name : "Project not found" };
}

export default async function ProjectPage({ params }: PageProps<"/app/projects/[id]">) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [members, insights, activity] = await Promise.all([getMembers(), getInsightsForProject(id), getProjectActivity(id)]);
  const team = members.filter((m) => project.memberIds.includes(m.id));
  const owner = members.find((m) => m.id === project.ownerId);
  const mod = moduleByKey[project.module];
  const done = project.milestones.filter((m) => m.done).length;

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Workspace", href: "/app" }, { label: "Projects", href: "/app/projects" }, { label: project.name }]}
        title={project.name}
        description={project.description}
        meta={
          <>
            <ProjectStatusBadge status={project.status} />
            <span className="inline-flex h-6 items-center gap-1.5 rounded-sm border border-line px-2 text-xs text-fg-2">
              <ModuleIcon module={project.module} className="size-3" />
              {mod.name} · {mod.role}
            </span>
            <span className="ml-1">
              <StageIndicator stage={project.stage} />
            </span>
          </>
        }
      />

      <section aria-label="Project summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="flex items-center gap-4 p-5">
          <ProgressRing value={project.progress} size={56} label={`${project.name} progress`}>
            <span className="tabular text-sm font-medium text-fg">{project.progress}%</span>
          </ProgressRing>
          <div>
            <p className="text-[13px] text-fg-3">Progress</p>
            <p className="mt-0.5 text-sm text-fg">
              {done} of {project.milestones.length} milestones
            </p>
          </div>
        </Card>
        {[
          { icon: Coins, label: "Impact to date", value: project.impact.value ? formatCurrency(project.impact.value) : "Not measured yet" },
          { icon: Clock3, label: "Time saved", value: `${project.impact.hoursSaved}h / month` },
          { icon: CalendarDays, label: "Due", value: project.dueDate ? formatDate(project.dueDate) : "No due date" },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <s.icon className="size-4 text-fg-3" aria-hidden="true" />
            <p className="mt-3 text-[13px] text-fg-3">{s.label}</p>
            <p className="tabular mt-0.5 text-lg font-medium tracking-tight text-fg">{s.value}</p>
          </Card>
        ))}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="grid gap-6 xl:col-span-2">
          <Card>
            <CardHeader title="Progress over time" description="Weekly progress for the last 8 weeks" />
            <CardBody>
              {project.progressHistory.length > 1 ? (
                <AreaChart data={project.progressHistory} label={`${project.name} progress over time`} valueFormat="percent" height={220} seriesLabel="Progress" />
              ) : (
                <EmptyState compact title="Not enough history yet" description="Progress appears here after the first week." />
              )}
            </CardBody>
          </Card>

          <section aria-labelledby="insights-title">
            <h2 id="insights-title" className="mb-3 text-[15px] font-medium text-fg">
              Insights for this project
            </h2>
            {insights.length ? (
              <div className="grid gap-3">
                {insights.map((i) => (
                  <InsightCard key={i.id} insight={i} />
                ))}
              </div>
            ) : (
              <Card>
                <EmptyState compact title="No insights yet" description="Nexo will surface recommendations as this project collects activity." />
              </Card>
            )}
          </section>
        </div>

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader title="Milestones" description={`${done} of ${project.milestones.length} completed`} />
            <CardBody className="pt-3">
              <MilestoneList milestones={project.milestones} projectName={project.name} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Team" />
            <CardBody className="pt-3">
              <ul className="space-y-3">
                {team.map((m) => (
                  <li key={m.id} className="flex items-center gap-3">
                    <Avatar initials={m.initials} name={m.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-fg">{m.name}</p>
                      <p className="truncate text-[11px] text-fg-3">{m.title}</p>
                    </div>
                    {m.id === owner?.id && <span className="text-[11px] text-accent">Owner</span>}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Activity" />
            <CardBody className="pt-4">
              <ActivityFeed items={activity} users={members} />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
