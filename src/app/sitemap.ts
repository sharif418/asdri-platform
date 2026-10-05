export const dynamic = "force-dynamic";
import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { getEnabledFlags } from "@/lib/settings";

/**
 * Sitemap — both languages, every public page.
 *
 * Bangla entries live at the bare path (canonical), English under /en,
 * each carrying hreflang alternates pointing at its sibling. Drafts and
 * modules switched off via feature flags are excluded entirely.
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://assunnahinstitute.org";

type ChangeFreq = MetadataRoute.Sitemap[number]["changeFrequency"];

interface RouteSpec {
  path: string;
  priority: number;
  changeFrequency: ChangeFreq;
  flag?: string;
  index?: boolean; // false → excluded from sitemap (login/register/account/search)
}

const ROUTES: RouteSpec[] = [
  { path: "", priority: 1.0, changeFrequency: "weekly" },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" },
  { path: "/about/leadership", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about/campus", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about/alumni", priority: 0.6, changeFrequency: "monthly" },
  { path: "/academics", priority: 0.9, changeFrequency: "monthly" },
  { path: "/academics/courses", priority: 0.9, changeFrequency: "monthly" },
  { path: "/academics/faculty", priority: 0.7, changeFrequency: "monthly" },
  { path: "/academics/development", priority: 0.6, changeFrequency: "monthly" },
  { path: "/academics/downloads", priority: 0.7, changeFrequency: "weekly", flag: "downloads" },
  { path: "/admissions", priority: 0.9, changeFrequency: "weekly", flag: "admissions" },
  { path: "/admissions/scholarships", priority: 0.8, changeFrequency: "monthly", flag: "admissions" },
  { path: "/admissions/faq", priority: 0.7, changeFrequency: "monthly", flag: "admissions" },
  { path: "/research", priority: 0.8, changeFrequency: "monthly", flag: "research" },
  { path: "/research/library", priority: 0.7, changeFrequency: "monthly", flag: "research" },
  { path: "/research/projects", priority: 0.7, changeFrequency: "weekly", flag: "research" },
  { path: "/research/publications", priority: 0.7, changeFrequency: "monthly", flag: "research" },
  { path: "/research/clarifications", priority: 0.8, changeFrequency: "weekly", flag: "clarifications" },
  { path: "/research/fatwa", priority: 0.8, changeFrequency: "daily", flag: "fatwa" },
  { path: "/media", priority: 0.7, changeFrequency: "weekly" },
  { path: "/media/blog", priority: 0.8, changeFrequency: "weekly", flag: "blog" },
  { path: "/media/videos", priority: 0.6, changeFrequency: "weekly", flag: "videos" },
  { path: "/media/news", priority: 0.7, changeFrequency: "weekly", flag: "research" },
  { path: "/media/gallery", priority: 0.6, changeFrequency: "weekly", flag: "gallery" },
  { path: "/notices", priority: 0.9, changeFrequency: "daily", flag: "notices" },
  { path: "/support", priority: 0.9, changeFrequency: "monthly", flag: "donations" },
  { path: "/support/zakat-calculator", priority: 0.8, changeFrequency: "monthly", flag: "donations" },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
];

/** Bangla (canonical, bare-path) entry with hreflang alternates. */
function bnEntry(path: string, lastModified: Date, priority: number, changeFrequency: ChangeFreq): MetadataRoute.Sitemap[number] {
  const clean = path === "" ? "/" : path;
  return {
    url: `${BASE_URL}${clean}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: {
      languages: {
        bn: `${BASE_URL}${clean}`,
        en: `${BASE_URL}/en${path === "" ? "" : path}`,
        "x-default": `${BASE_URL}${clean}`,
      },
    },
  };
}

/** English (/en) entry with hreflang alternates. */
function enEntry(path: string, lastModified: Date, priority: number, changeFrequency: ChangeFreq): MetadataRoute.Sitemap[number] {
  const clean = path === "" ? "/" : path;
  return {
    url: `${BASE_URL}/en${path === "" ? "" : path}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: {
      languages: {
        bn: `${BASE_URL}${clean}`,
        en: `${BASE_URL}/en${path === "" ? "" : path}`,
        "x-default": `${BASE_URL}${clean}`,
      },
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const flags = await getEnabledFlags();

  const out: MetadataRoute.Sitemap = [];

  // static routes × both languages
  for (const route of ROUTES) {
    if (route.flag && flags.get(route.flag) === false) continue;
    out.push(bnEntry(route.path, now, route.priority, route.changeFrequency));
    out.push(enEntry(route.path, now, route.priority * 0.95, route.changeFrequency));
  }

  // published courses
  const courses = await db.course.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true },
    orderBy: { sortOrder: "asc" },
  });
  for (const course of courses) {
    out.push(bnEntry(`/academics/courses/${course.slug}`, course.updatedAt, 0.8, "monthly"));
    out.push(enEntry(`/academics/courses/${course.slug}`, course.updatedAt, 0.75, "monthly"));
  }

  // published posts (articles + news)
  const posts = await db.post.findMany({
    where: { isPublished: true, publishedAt: { not: null } },
    select: { slug: true, kind: true, updatedAt: true },
    orderBy: { publishedAt: "desc" },
  });
  const blogEnabled = flags.get("blog") !== false;
  const newsEnabled = flags.get("research") !== false;
  for (const post of posts) {
    if (post.kind === "ARTICLE" && !blogEnabled) continue;
    if (post.kind === "NEWS" && !newsEnabled) continue;
    const prefix = post.kind === "NEWS" ? "/media/news/" : "/media/blog/";
    out.push(bnEntry(`${prefix}${post.slug}`, post.updatedAt, 0.6, "monthly"));
    out.push(enEntry(`${prefix}${post.slug}`, post.updatedAt, 0.55, "monthly"));
  }

  // published notices
  if (flags.get("notices") !== false) {
    const notices = await db.notice.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
    });
    for (const notice of notices) {
      out.push(bnEntry(`/notices?notice=${notice.slug}`, notice.updatedAt, 0.5, "monthly"));
    }
  }

  // published fatwa entries
  if (flags.get("fatwa") !== false) {
    const fatwas = await db.fatwaEntry.findMany({
      where: { isPublished: true },
      select: { slug: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
    });
    for (const fatwa of fatwas) {
      out.push(bnEntry(`/research/fatwa?focus=${fatwa.slug}`, fatwa.publishedAt, 0.5, "monthly"));
    }
  }

  return out;
}
