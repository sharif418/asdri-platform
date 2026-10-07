import Link from "next/link";
import { ArrowRight, BookOpenCheck, GraduationCap, Layers, ListChecks } from "lucide-react";
import type { TeacherCourseView } from "@/lib/portals/access";
import { formatNumber } from "@/lib/format";

/**
 * Teacher portal home: the courses assigned to THIS teacher — the list comes
 * from getTeacherCourses, which reads only this account's TeacherAssignments.
 */
export function TeacherHome({ courses }: { courses: TeacherCourseView[] }) {
  if (courses.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gold/40 bg-card px-6 py-14 text-center">
        <GraduationCap aria-hidden className="mx-auto h-8 w-8 text-gold" />
        <h2 className="mt-3 text-lg font-bold">এখনো কোনো কোর্স যুক্ত নেই</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          অফিস আপনার অ্যাকাউন্টের সঙ্গে কোর্স যুক্ত করলে সেগুলোর সিলেবাস ও তথ্য এখানে দেখবেন।
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {courses.map((course) => (
        <Link
          key={course.assignmentId}
          href={`/academics/courses/${course.slug}`}
          className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md"
        >
          {/* quiet gold spine — the course-card motif from the public site */}
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-gold/70 via-gold/30 to-transparent transition-colors group-hover:from-gold"
          />
          <div className="flex items-start justify-between gap-3 pl-1.5">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[11px] font-bold tracking-wide text-primary" dir="ltr">
              {course.code}
            </span>
            <BookOpenCheck aria-hidden className="h-5 w-5 text-gold" />
          </div>
          <h2 className="mt-3 pl-1.5 text-[16.5px] font-bold leading-snug group-hover:text-primary">
            {course.titleBn}
          </h2>
          <p className="mt-1 pl-1.5 text-[12px] leading-relaxed text-muted-foreground">{course.titleEn}</p>

          <dl className="mt-4 grid grid-cols-2 gap-2 border-t pl-1.5 pt-3">
            <div className="flex items-center gap-2">
              <Layers aria-hidden className="h-4 w-4 shrink-0 text-gold" />
              <div>
                <dt className="sr-only">সেমিস্টার</dt>
                <dd className="text-[12.5px] font-semibold">
                  {formatNumber(course.semesterCount, "bn")}{" "}
                  <span className="font-normal text-muted-foreground">সেমিস্টার</span>
                </dd>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ListChecks aria-hidden className="h-4 w-4 shrink-0 text-gold" />
              <div>
                <dt className="sr-only">বিষয়</dt>
                <dd className="text-[12.5px] font-semibold">
                  {formatNumber(course.subjectCount, "bn")}{" "}
                  <span className="font-normal text-muted-foreground">বিষয়</span>
                </dd>
              </div>
            </div>
          </dl>

          <p className="mt-3.5 flex items-center gap-1.5 pl-1.5 text-[12px] font-semibold text-primary opacity-70 transition-opacity group-hover:opacity-100">
            সিলেবাস ও কারিকুলাম
            <ArrowRight aria-hidden className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </p>
        </Link>
      ))}
    </div>
  );
}
