import type { MetadataRoute } from "next";
import { legalDocs } from "@/content/legal";
import { siteConfig } from "@/lib/site-config";

/** Public, indexable routes only. The /app area is excluded (noindex). */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/signup`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/login`, changeFrequency: "yearly", priority: 0.3 },
    ...legalDocs.map((d) => ({ url: `${base}/legal/${d.slug}`, lastModified: d.updated, changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
}
