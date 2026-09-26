import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { legalDocs } from "@/content/legal";
import { formatDate } from "@/lib/format";

export const dynamicParams = false;

export function generateStaticParams() {
  return legalDocs.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const doc = legalDocs.find((d) => d.slug === slug);
  return doc ? { title: doc.title, alternates: { canonical: `/legal/${doc.slug}` } } : {};
}

export default async function LegalPage({ params }: PageProps<"/legal/[slug]">) {
  const { slug } = await params;
  const doc = legalDocs.find((d) => d.slug === slug);
  if (!doc) notFound();

  return (
    <article className="container-page grid gap-12 pb-24 pt-[calc(var(--header-h)+4rem)] lg:grid-cols-12">
      <aside className="lg:col-span-3">
        <nav aria-label="Legal documents" className="lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
          <ul className="space-y-2 text-sm">
            {legalDocs.map((d) => (
              <li key={d.slug}>
                <Link
                  href={`/legal/${d.slug}`}
                  aria-current={d.slug === doc.slug ? "page" : undefined}
                  className="text-fg-3 transition-colors hover:text-fg aria-[current=page]:text-fg"
                >
                  {d.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className="max-w-2xl lg:col-span-8">
        <p className="eyebrow">Last updated {formatDate(`${doc.updated}T00:00:00.000Z`)}</p>
        <h1 className="mt-4 text-headline font-medium text-fg">{doc.title}</h1>
        <p className="mt-6 rounded-md border border-caution/30 bg-caution-soft px-4 py-3 text-[13px] text-caution">
          Placeholder text — to be replaced with the reviewed legal copy before launch.
        </p>
        <div className="mt-10 space-y-10">
          {doc.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-lg font-medium text-fg">{s.heading}</h2>
              <p className="mt-3 leading-relaxed text-fg-2">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
