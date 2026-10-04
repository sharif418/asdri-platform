import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Clock3,
  FlaskConical,
  GraduationCap,
  Languages,
  LibraryBig,
  MicVocal,
  ScrollText,
  UserCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { courses } from "@/content/courses";
import { pick } from "@/types";
import type { Course, CourseKind, Language } from "@/types";
import { cn } from "@/lib/utils";

export const courseIcons: Record<string, LucideIcon> = {
  "graduation-cap": GraduationCap,
  "scroll-text": ScrollText,
  "library-big": LibraryBig,
  languages: Languages,
  "mic-vocal": MicVocal,
  "bell-ring": BellRing,
  "flask-conical": FlaskConical,
};

export const kindLabels: Record<CourseKind, { bn: string; en: string }> = {
  flagship: { bn: "ফ্ল্যাগশিপ প্রোগ্রাম", en: "Flagship Program" },
  certificate: { bn: "সার্টিফিকেট কোর্স", en: "Certificate Course" },
  diploma: { bn: "ডিপ্লোমা কোর্স", en: "Diploma Course" },
  training: { bn: "প্রশিক্ষণ কার্যক্রম", en: "Training Program" },
};

/** Reusable course card used on the courses grid and academic overview. */
export function CourseCard({ course, lang, priority = false }: { course: Course; lang: Language; priority?: boolean }) {
  const Icon = courseIcons[course.icon] ?? GraduationCap;

  return (
    <Link href={`/academics/courses/${course.slug}`} className="group block h-full">
      <article
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/10",
          priority && "sm:col-span-2",
        )}
      >
        <div className={cn("h-1.5 w-full bg-gradient-to-r", course.accentClass)} />
        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-start justify-between gap-3">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-md",
                course.accentClass,
              )}
            >
              <Icon aria-hidden className="h-6 w-6" />
            </div>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-secondary-foreground">
              {pick(kindLabels[course.kind], lang)}
            </span>
          </div>

          <h3 className="font-heading mt-4 text-[17px] font-semibold leading-snug transition-colors group-hover:text-primary">
            {lang === "bn" ? course.titleBn : course.titleEn}
          </h3>
          {course.titleAr ? (
            <p dir="rtl" lang="ar" className="font-arabic mt-1 text-sm text-gold">
              {course.titleAr}
            </p>
          ) : null}

          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{pick(course.summary, lang)}</p>

          <div className="mt-5 space-y-2 border-t pt-4 text-[13px]">
            <p className="flex items-center gap-2 text-muted-foreground">
              <Clock3 aria-hidden className="h-4 w-4 shrink-0 text-gold" />
              <span className="font-medium text-foreground/80">{pick(course.durationLabel, lang)}</span>
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <UserCheck aria-hidden className="h-4 w-4 shrink-0 text-gold" />
              <span className="line-clamp-1">{pick(course.eligibilityLabel, lang)}</span>
            </p>
          </div>

          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            {lang === "bn" ? "বিস্তারিত দেখুন" : "Learn More"}
            <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </article>
    </Link>
  );
}

/** Grid of every course in the catalog. */
export function CourseGrid({ lang }: { lang: Language }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard key={course.slug} course={course} lang={lang} />
      ))}
    </div>
  );
}
