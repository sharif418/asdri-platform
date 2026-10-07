import Link from "next/link";
import { BookOpenCheck, GraduationCap } from "lucide-react";
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
          className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary" dir="ltr">
              {course.code}
            </span>
            <BookOpenCheck aria-hidden className="h-5 w-5 text-gold" />
          </div>
          <h2 className="mt-3 text-[16.5px] font-bold leading-snug group-hover:text-primary">{course.titleBn}</h2>
          <p className="mt-1 text-[12px] text-muted-foreground">{course.titleEn}</p>
          <p className="mt-4 border-t pt-3 text-[12.5px] font-medium text-muted-foreground">
            {formatNumber(course.semesterCount, "bn")} সেমিস্টার ·{" "}
            {formatNumber(course.subjectCount, "bn")} বিষয়
          </p>
        </Link>
      ))}
    </div>
  );
}
