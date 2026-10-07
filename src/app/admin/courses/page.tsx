import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpenCheck, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { NewCourseButton } from "@/components/admin/new-course-button";

export const metadata = { title: "কোর্স ও সিলেবাস" };

/** Courses admin — the seven programs with computed curriculum totals. */
export default async function AdminCoursesPage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "academics.manage")) redirect("/admin");

  const courses = await db.course.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      semesters: { select: { id: true, subjects: { select: { credits: true, marks: true, isNonCredit: true } } } },
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
            <BookOpenCheck aria-hidden className="h-6 w-6 text-primary" />
            কোর্স ও সিলেবাস
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatNumber(courses.length, "bn")} টি কোর্স — প্রতিটির পূর্ণ কারিকুলাম (সেমিস্টার, কোড, ক্রেডিট, মার্ক) এখানেই সম্পাদনযোগ্য।
          </p>
        </div>
        <NewCourseButton />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {courses.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed bg-card p-12 text-center">
            <p className="font-heading text-lg font-bold">এখনো কোনো কোর্স নেই</p>
            <p className="mt-1 text-sm text-muted-foreground">প্রথম কোর্সের কোড ও নাম দিয়ে শুরু করুন।</p>
            <div className="mt-4 flex justify-center">
              <NewCourseButton />
            </div>
          </div>
        )}
        {courses.map((course) => {
          const subjects = course.semesters.flatMap((s) => s.subjects);
          const credits = subjects.reduce((sum, s) => sum + (s.isNonCredit ? 0 : s.credits), 0);
          const marks = subjects.reduce((sum, s) => sum + s.marks, 0);
          return (
            <Link
              key={course.id}
              href={`/admin/courses/${course.slug}`}
              className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:border-gold/50 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-[11.5px] font-bold text-primary">
                  {course.code}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                    course.isPublished ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {course.isPublished ? "প্রকাশিত" : "ড্রাফট"}
                </span>
              </div>
              <h2 className="font-heading mt-3 text-[16.5px] font-bold leading-snug group-hover:text-primary">
                {course.titleBn}
              </h2>
              <p className="mt-1 line-clamp-1 text-[12.5px] text-muted-foreground">
                {course.durationBn || (course.titleEn || "—")}
              </p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-[11.5px] text-muted-foreground">
                <span>
                  <strong className="text-foreground">{formatNumber(course.semesters.length, "bn")}</strong> সেমিস্টার
                </span>
                <span>
                  <strong className="text-foreground">{formatNumber(subjects.length, "bn")}</strong> বিষয়
                </span>
                <span>
                  <strong className="text-foreground">{formatNumber(credits, "bn")}</strong> ক্রেডিট
                </span>
                <span>
                  <strong className="text-foreground">{formatNumber(marks, "bn")}</strong> মার্ক
                </span>
              </div>
              {course.isFeatured && (
                <span className="mt-2 inline-block rounded-full bg-gold/15 px-2 py-0.5 text-[10.5px] font-bold text-gold">
                  হোমে ফিচার্ড
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
