import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { AreaChart } from "@/components/dashboard/charts/area-chart";
import { InsightCard } from "@/components/dashboard/insight-card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProjectProgressList } from "@/components/dashboard/project-progress-list";
import { TeamList } from "@/components/dashboard/team-card";
import { UpcomingMilestones, type UpcomingItem } from "@/components/dashboard/upcoming-milestones";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress";
import type { ActivityItem, Insight, Metric, Presence, Project, TimePoint, User } from "@/types";

export type OverviewData = {
  now: string;
  user: User;
  members: User[];
  presence: Presence[];
  metrics: Metric[];
  growth: TimePoint[];
  baseline: TimePoint[];
  insights: Insight[];
  projects: Project[];
  activity: ActivityItem[];
};

const longDate = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const spelled = ["Nothing", "One thing", "Two things", "Three things", "Four things", "Five things"];
const DAY = 86_400_000;

function greeting(iso: string) {
  const h = new Date(iso).getUTCHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function CardLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-xs text-fg-2 transition-colors hover:text-fg">
      {children}
    </Link>
  );
}

/**
 * The Overview dashboard (/app).
 *
 * Layout uses container queries (not viewport breakpoints): it adapts to the
 * width of the app's main column, whatever the sidebar state.
 * The parent must set `@container`.
 */
export function OverviewDashboard({ data }: { data: OverviewData }) {
  const { now, user, members, presence, metrics, insights, projects, activity } = data;

  const actionable = insights.filter((i) => i.status === "new" || i.status === "in-review").slice(0, 3);
  const active = projects.filter((p) => p.status !== "completed" && p.status !== "paused").slice(0, 5);
  const momentum = 78;

  const people = new Map(members.map((m) => [m.id, m]));
  const since = Date.parse(now) - 7 * DAY;
  const upcoming: UpcomingItem[] = projects
    .filter((p) => p.status !== "completed" && p.status !== "paused")
    .flatMap((p) =>
      p.milestones.flatMap((m) =>
        !m.done && m.dueDate && Date.parse(m.dueDate) >= since
          ? [{ id: m.id, title: m.title, dueDate: m.dueDate, projectId: p.id, projectName: p.name, owner: people.get(p.ownerId) }]
          : [],
      ),
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);
  const teammates = members.filter((m) => m.id !== user.id);
  const online = presence.filter((p) => p.state === "online" && p.userId !== user.id).length;
  const needsYou = spelled[actionable.length] ?? `${actionable.length} things`;

  return (
    <>
      <PageHeader
        title={
          <>
            {greeting(now)}, <span className="font-display font-light text-accent-strong">{user.name.split(" ")[0]}.</span>
          </>
        }
        description={`${longDate.format(new Date(now))}. ${needsYou} could use your eyes today — the rest is ticking along nicely.`}
        actions={
          <>
            <ButtonLink href="/app/analytics" variant="secondary" size="md">
              View analytics
            </ButtonLink>
            <ButtonLink href="/app/projects?new=1" size="md">
              <Plus aria-hidden="true" /> New project
            </ButtonLink>
          </>
        }
      />

      <section aria-label="Key metrics" className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @4xl:grid-cols-4">
        {metrics.map((m) => (
          <MetricCard key={m.id} metric={m} />
        ))}
      </section>

      <div className="mt-6 grid gap-6 @4xl:grid-cols-12">
        <Card className="@4xl:col-span-8">
          <CardHeader
            title="Value created"
            description="Revenue recovered and costs avoided · last 30 days vs the 30 before"
            action={
              <CardLink href="/app/analytics">
                Details <ArrowRight className="size-3.5" aria-hidden="true" />
              </CardLink>
            }
          />
          <CardBody>
            <AreaChart
              data={data.growth}
              compare={data.baseline}
              label="Value created, last 30 days"
              valueFormat="currency-compact"
              seriesLabel="This period"
              compareLabel="Previous"
              height={260}
            />
          </CardBody>
        </Card>

        <Card className="@4xl:col-span-4">
          <CardHeader title="Momentum" description="How strongly things are moving this week" />
          <CardBody className="flex flex-col gap-5">
            <div className="flex items-center gap-5">
              <ProgressRing value={momentum} size={104} stroke={4} label="Momentum score">
                <span className="tabular font-display text-3xl font-medium tracking-tight text-fg">{momentum}</span>
              </ProgressRing>
              <div>
                <p className="text-sm text-fg">Growing steadily</p>
                <p className="mt-1 text-[13px] leading-snug text-fg-3">Up 6 points on last week. Getting paid faster did most of the lifting.</p>
              </div>
            </div>
            <dl className="grid grid-cols-3 divide-x divide-line rounded-md border border-line">
              {[
                { k: "Automations", v: "12" },
                { k: "Insights", v: String(insights.length) },
                { k: "Projects", v: String(active.length) },
              ].map((s) => (
                <div key={s.k} className="flex flex-col-reverse px-3 py-3">
                  <dt className="text-[11px] text-fg-3">{s.k}</dt>
                  <dd className="tabular text-lg font-medium text-fg">{s.v}</dd>
                </div>
              ))}
            </dl>
            <p className="rounded-md border border-accent-line/50 bg-accent-soft px-3.5 py-3 text-[13px] leading-relaxed text-fg-2">
              <span className="text-accent-strong">Worth a look — </span>
              Sales pipeline hygiene has slipped. Clara could use a hand before the review on 8 October.
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 @3xl:grid-cols-2 @4xl:grid-cols-12">
        <section aria-labelledby="today-title" className="@3xl:col-span-2 @4xl:col-span-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="today-title" className="text-[15px] font-medium text-fg">
              Needs you today
            </h2>
            <CardLink href="/app/insights">
              All insights <ArrowRight className="size-3.5" aria-hidden="true" />
            </CardLink>
          </div>
          <div className="grid gap-3">
            {actionable.map((i) => (
              <InsightCard key={i.id} insight={i} compact />
            ))}
          </div>
        </section>

        <Card className="@4xl:col-span-4">
          <CardHeader
            title="Coming up"
            description="Next milestones across your projects"
            action={
              <CardLink href="/app/projects">
                Projects <ArrowRight className="size-3.5" aria-hidden="true" />
              </CardLink>
            }
          />
          <CardBody className="pt-3">
            <UpcomingMilestones items={upcoming} now={now} />
          </CardBody>
        </Card>

        <Card className="@4xl:col-span-3">
          <CardHeader
            title="Team"
            description={`${online} of ${teammates.length} around right now`}
            action={
              <CardLink href="/app/settings?tab=workspace">
                <Plus className="size-3.5" aria-hidden="true" /> Invite
              </CardLink>
            }
          />
          <CardBody className="pt-5">
            <TeamList members={members} presence={presence} currentUserId={user.id} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 @4xl:grid-cols-12">
        <Card className="@4xl:col-span-5">
          <CardHeader
            title="Projects"
            description="Where active work stands"
            action={
              <CardLink href="/app/projects">
                All <ArrowRight className="size-3.5" aria-hidden="true" />
              </CardLink>
            }
          />
          <CardBody className="pt-2">
            <ProjectProgressList projects={active} />
          </CardBody>
        </Card>

        <Card className="@4xl:col-span-7">
          <CardHeader
            title="Recent activity"
            description="What happened while you were away"
            action={
              <CardLink href="/app/activity">
                Full history <ArrowRight className="size-3.5" aria-hidden="true" />
              </CardLink>
            }
          />
          <CardBody className="pt-5">
            <ActivityFeed items={activity} users={members} />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
