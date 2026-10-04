import type { MetadataRoute } from "next";
import { courses } from "@/content/courses";
import { blogArticles } from "@/content/blog";
import { newsItems } from "@/content/media";

/** Canonical site origin — NEXT_PUBLIC_SITE_URL env override wins when set. */
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://assunnahinstitute.org";

/** Static public routes with sensible priorities. */
const staticRoutes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1.0, changeFrequency: "weekly" },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" },
  { path: "/about/leadership", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about/campus", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about/alumni", priority: 0.6, changeFrequency: "monthly" },
  { path: "/academics", priority: 0.9, changeFrequency: "monthly" },
  { path: "/academics/courses", priority: 0.9, changeFrequency: "monthly" },
  { path: "/academics/faculty", priority: 0.7, changeFrequency: "monthly" },
  { path: "/academics/development", priority: 0.6, changeFrequency: "monthly" },
  { path: "/academics/downloads", priority: 0.7, changeFrequency: "weekly" },
  { path: "/admissions", priority: 0.9, changeFrequency: "weekly" },
  { path: "/admissions/scholarships", priority: 0.8, changeFrequency: "monthly" },
  { path: "/admissions/faq", priority: 0.7, changeFrequency: "monthly" },
  { path: "/research", priority: 0.8, changeFrequency: "monthly" },
  { path: "/research/library", priority: 0.7, changeFrequency: "monthly" },
  { path: "/research/projects", priority: 0.7, changeFrequency: "weekly" },
  { path: "/research/publications", priority: 0.7, changeFrequency: "monthly" },
  { path: "/research/clarifications", priority: 0.8, changeFrequency: "weekly" },
  { path: "/research/fatwa", priority: 0.8, changeFrequency: "daily" },
  { path: "/media", priority: 0.7, changeFrequency: "weekly" },
  { path: "/media/blog", priority: 0.8, changeFrequency: "weekly" },
  { path: "/media/videos", priority: 0.6, changeFrequency: "weekly" },
  { path: "/media/news", priority: 0.7, changeFrequency: "weekly" },
  { path: "/media/gallery", priority: 0.6, changeFrequency: "weekly" },
  { path: "/notices", priority: 0.9, changeFrequency: "daily" },
  { path: "/search", priority: 0.5, changeFrequency: "monthly" },
  { path: "/support", priority: 0.9, changeFrequency: "monthly" },
  { path: "/support/zakat-calculator", priority: 0.8, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
  { path: "/login", priority: 0.3, changeFrequency: "yearly" },
  { path: "/register", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const courseEntries: MetadataRoute.Sitemap = courses.map((course) => ({
    url: `${BASE_URL}/academics/courses/${course.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const blogEntries: MetadataRoute.Sitemap = blogArticles.map((article) => ({
    url: `${BASE_URL}/media/blog/${article.slug}`,
    lastModified: new Date(article.publishedAt),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [...staticEntries, ...courseEntries, ...blogEntries];
}
