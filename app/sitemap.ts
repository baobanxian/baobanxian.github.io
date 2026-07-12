import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://baobanxian.com";

  return [
    { url: base, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/blog/my-first-website`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/subscribe`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
    { url: `${base}/papers`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/wiki`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/wiki/research-paper-collector-reflection`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/wiki/research-paper-collector-skill`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/wiki/site-health-check`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/data/rss-items`, lastModified: new Date(), changeFrequency: "daily", priority: 0.3 },
  ];
}
