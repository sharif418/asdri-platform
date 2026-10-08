import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseDetail } from "@/components/academics/course-detail";
import { getCourseBySlug } from "@/lib/content/courses";
import { alternatesFor, type Lang } from "@/lib/locale";
import { env } from "@/lib/env";
import { pick } from "@/types";

interface CoursePageProps {
  params: Promise<{ lang: Lang; slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { slug, lang } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return {};
  const { canonical, languages } = alternatesFor(`/academics/courses/${course.slug}`, env.siteUrl);
  return {
    title: lang === "bn" ? `${course.titleBn} | আস-সুন্নাহ ইনস্টিটিউট` : `${course.titleEn} | As-Sunnah Institute`,
    description: pick(course.summary, lang),
    alternates: { canonical, languages },
  };
}

/**
 * /academics/courses/[slug] — full course detail template. The body is the
 * shared CourseDetail component (round 11) so the signed preview route
 * renders a draft through the exact same path.
 */
export default async function CourseDetailPage({ params }: CoursePageProps) {
  const { slug, lang } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();
  return <CourseDetail course={course} lang={lang} />;
}
