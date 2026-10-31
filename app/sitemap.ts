import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db/db";
import { apartments } from "@/lib/db/schema";
import { siteUrl } from "@/lib/mailer";
import { apartmentSlug } from "@/lib/seo";
import { DINING } from "@/lib/data";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/apartments`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/dining`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/events`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/packages`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/transfers`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/guide`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  for (const d of DINING) pages.push({ url: `${base}/dining/${d.id}`, lastModified: now, changeFrequency: "monthly", priority: 0.6 });

  try {
    if (isDbConfigured()) {
      const apts = await getDb().select({ id: apartments.id }).from(apartments).where(eq(apartments.isActive, true));
      const slugs = new Set(apts.map((a) => apartmentSlug(a.id)));
      for (const s of slugs) pages.push({ url: `${base}/apartments/${s}`, lastModified: now, changeFrequency: "weekly", priority: 0.9 });
    }
  } catch {
    // Sitemap still works without the database.
  }
  return pages;
}
