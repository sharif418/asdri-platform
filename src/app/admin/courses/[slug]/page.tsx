import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BookOpenCheck } from "lucide-react";
import { db } from "@/lib/db";
import { CourseEditor } from "@/components/admin/course-editor";
import { getSession, roleCan } from "@/lib/auth";

export const metadata = { title: "কোর্স সম্পাদনা" };

/** Full course editor — meta + curriculum tree + specializations + SDP. */
export default async function EditCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "academics.manage")) redirect("/admin");

  const { slug } = await params;
  const course = await db.course.findUnique({
    where: { slug },
    include: {
      coverMedia: { select: { id: true, filename: true, key: true, width: true, height: true, size: true } },
      semesters: {
        orderBy: { number: "asc" },
        include: { subjects: { orderBy: { sortOrder: "asc" } } },
      },
      specializations: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!course) notFound();

  const sdpRows = await db.sdpProgram.findMany({
    where: { courseId: course.id },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/courses" className="hover:text-primary">কোর্স</Link>
        <span aria-hidden className="mx-1.5">/</span>
        <span className="text-foreground">{course.code}</span>
      </nav>
      <h1 className="font-heading mt-2 flex flex-wrap items-center gap-2 text-2xl font-bold">
        <BookOpenCheck aria-hidden className="h-6 w-6 text-primary" />
        {course.titleBn}
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-mono">{course.code}</span>
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        কারিকুলাম, তাখাসসুস বিভাগ ও উন্নয়ন কার্যক্রম — সব পরিবর্তন অডিটে সংরক্ষিত হয় এবং ওয়েবসাইটে সাথে সাথে দেখা যায়।
      </p>

      <CourseEditor
        initial={{
          id: course.id,
          slug: course.slug,
          meta: {
            code: course.code,
            titleBn: course.titleBn,
            titleEn: course.titleEn,
            titleAr: course.titleAr ?? "",
            taglineBn: course.taglineBn,
            taglineEn: course.taglineEn,
            overviewBn: course.overviewBn,
            overviewEn: course.overviewEn,
            objectivesBn: course.objectivesBn,
            objectivesEn: course.objectivesEn,
            eligibilityBn: course.eligibilityBn,
            eligibilityEn: course.eligibilityEn,
            careerBn: course.careerBn,
            careerEn: course.careerEn,
            durationBn: course.durationBn,
            durationEn: course.durationEn,
            courseTypeBn: course.courseTypeBn,
            courseTypeEn: course.courseTypeEn,
            seats: course.seats,
            coverMediaId: course.coverMedia?.id ?? null,
            cover: course.coverMedia
              ? {
                  id: course.coverMedia.id,
                  filename: course.coverMedia.filename,
                  key: course.coverMedia.key,
                  width: course.coverMedia.width,
                  height: course.coverMedia.height,
                  size: course.coverMedia.size,
                }
              : null,
            isFeatured: course.isFeatured,
            isPublished: course.isPublished,
            sortOrder: course.sortOrder,
          },
          semesters: course.semesters.map((sem) => ({
            number: sem.number,
            year: sem.year,
            titleBn: sem.titleBn,
            titleEn: sem.titleEn,
            durationBn: sem.durationBn,
            durationEn: sem.durationEn,
            subjects: sem.subjects.map((subject) => ({
              code: subject.code,
              titleBn: subject.titleBn,
              titleEn: subject.titleEn,
              modulesBn: subject.modulesBn,
              modulesEn: subject.modulesEn,
              credits: subject.credits,
              marks: subject.marks,
              isNonCredit: subject.isNonCredit,
            })),
          })),
          specializations: course.specializations.map((spec) => ({
            nameBn: spec.nameBn,
            nameEn: spec.nameEn,
            nameAr: spec.nameAr ?? "",
          })),
          sdp: sdpRows.map((s) => ({
            titleBn: s.titleBn,
            titleEn: s.titleEn,
            objectiveBn: s.objectiveBn,
            objectiveEn: s.objectiveEn,
            activitiesBn: s.activitiesBn,
            activitiesEn: s.activitiesEn,
            hours: s.hours,
            outcomeBn: s.outcomeBn,
            outcomeEn: s.outcomeEn,
          })),
        }}
      />
    </div>
  );
}
