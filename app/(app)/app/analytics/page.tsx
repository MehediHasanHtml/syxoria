import type { Metadata } from "next";
import Link from "next/link";
import { BarList } from "@/components/dashboard/charts/bar-list";
import { AreaChart } from "@/components/dashboard/charts/area-chart";
import { ColumnChart } from "@/components/dashboard/charts/column-chart";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModuleIcon } from "@/components/shared/module-icon";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { getAnalyticsReport, isTimeRange, TIME_RANGES } from "@/services/analytics";
import { getProjects } from "@/services/projects";
import type { TimeRange } from "@/types";

export const metadata: Metadata = { title: "Analytics" };

/** Range filter as links: shareable URLs, works without JS, back button friendly. */
function RangeFilter({ value }: { value: TimeRange }) {
  return (
    <nav aria-label="Time range" className="inline-flex rounded-md border border-line bg-canvas-2 p-0.5">
      {TIME_RANGES.map((r) => {
        const active = r.value === value;
        return (
          <Link
            key={r.value}
            href={`/app/analytics?range=${r.value}`}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-8 items-center rounded-[5px] px-3 text-[13px] font-medium transition-colors duration-200",
              active ? "bg-surface-3 text-fg shadow-[0_1px_0_0_rgb(255_255_255/0.05)_inset]" : "text-fg-3 hover:text-fg-2",
            )}
          >
            {r.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default async function AnalyticsPage({ searchParams }: PageProps<"/app/analytics">) {
  const { range: rawRange } = await searchParams;
  const range: TimeRange = isTimeRange(rawRange) ? rawRange : "30d";
  const [report, projects] = await Promise.all([getAnalyticsReport(range), getProjects()]);
  const rangeLabel = TIME_RANGES.find((r) => r.value === range)!.label;
  const topProjects = [...projects].sort((a, b) => b.impact.value - a.impact.value).slice(0, 5);
  const maxImpact = Math.max(...topProjects.map((p) => p.impact.value), 1);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Workspace", href: "/app" }, { label: "Analytics" }]}
        title="Analytics"
        description="How value, time and momentum are compounding across your workspace."
        actions={<RangeFilter value={range} />}
      />

      <section aria-label="Summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {report.summary.map((m) => (
          <MetricCard key={m.id} metric={m} />
        ))}
      </section>

      <Card className="mt-6">
        <CardHeader
          title="Value created"
          description={`Last ${rangeLabel} compared with the previous period`}
          action={
            <span className="hidden items-center gap-4 text-xs text-fg-3 sm:flex">
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="h-0.5 w-4 rounded-full bg-accent" /> This period
              </span>
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="w-4 border-t border-dashed border-fg-3" /> Previous
              </span>
            </span>
          }
        />
        <CardBody>
          <AreaChart
            key={range}
            data={report.growth.points}
            compare={report.baseline.points}
            label={`Value created, last ${rangeLabel}`}
            valueFormat="currency-compact"
            dateFormat={range === "12m" ? "month" : "short"}
            seriesLabel="This period"
            compareLabel="Previous"
            height={300}
          />
        </CardBody>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Automated actions by module" description={`Last ${rangeLabel}`} />
          <CardBody className="pt-6">
            <BarList items={report.automationsByModule} valueFormat="number" label="Automated actions by module" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Hours saved per week" description="Last 10 weeks · whole team" />
          <CardBody className="pt-8">
            <ColumnChart data={report.weeklyHours} valueFormat="hours" label="Hours saved per week, last 10 weeks" height={190} />
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Impact by project" description="Revenue recovered or costs avoided to date" />
        <CardBody className="pt-3">
          <div className="-mx-5 overflow-x-auto sm:-mx-6">
            <table className="w-full min-w-[560px] text-left text-[13px]">
              <caption className="sr-only">Impact by project</caption>
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-label text-fg-3">
                  <th scope="col" className="px-5 py-2.5 font-medium sm:px-6">Project</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Share</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Hours / month</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium sm:px-6">Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {topProjects.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-5 py-3 sm:px-6">
                      <Link href={`/app/projects/${p.id}`} className="flex items-center gap-2.5 text-fg hover:text-white">
                        <ModuleIcon module={p.module} className="size-4 text-fg-3" />
                        {p.name}
                      </Link>
                    </td>
                    <td className="w-1/3 px-3 py-3">
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                        <div className="h-full origin-left rounded-full bg-fg/40" style={{ transform: `scaleX(${p.impact.value / maxImpact})` }} />
                      </div>
                    </td>
                    <td className="tabular px-3 py-3 text-right text-fg-2">{p.impact.hoursSaved}h</td>
                    <td className="tabular px-5 py-3 text-right text-fg sm:px-6">{p.impact.value ? formatCurrency(p.impact.value) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </>
  );
}
