import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlannedAreaView } from "@/components/dashboard/planned-area";
import { business, isBusinessSection } from "@/content/areas";

export function generateStaticParams() {
  return Object.keys(business.sections).map((section) => ({ section }));
}

export async function generateMetadata({ params }: PageProps<"/app/business/[section]">): Promise<Metadata> {
  const { section } = await params;
  return { title: isBusinessSection(section) ? `${business.sections[section].label} · ${business.title}` : business.title };
}

/** Business Management: one area, its four sections side by side (the sidebar opens them too) */
export default async function BusinessSectionPage({ params }: PageProps<"/app/business/[section]">) {
  const { section } = await params;
  if (!isBusinessSection(section)) notFound();
  const current = business.sections[section];
  return (
    <PlannedAreaView
      area={{ title: business.title, phase: business.phase, intro: business.intro, holds: current.holds, today: [{ label: "Key figures, on Home", href: "/app" }] }}
      nav={
        <nav aria-label={`${business.title} sections`} className="pa-tabs">
          {Object.entries(business.sections).map(([key, s]) => (
            <Link key={key} href={`/app/business/${key}`} aria-current={key === section ? "page" : undefined}>
              {s.label}
            </Link>
          ))}
        </nav>
      }
    />
  );
}
