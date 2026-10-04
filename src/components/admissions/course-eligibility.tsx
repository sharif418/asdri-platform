import Link from "next/link";
import { ArrowRight, GraduationCap, Hourglass } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { getCourses } from "@/lib/content/courses";
import { langPath } from "@/lib/locale";
import { pick } from "@/types";
import type { Language } from "@/types";

/**
 * Per-course eligibility note cards — derived from the live course catalog
 * so admission requirements always stay in sync with academics.
 */
export async function CourseEligibility({ lang }: { lang: Language }) {
  const courses = await getCourses();
  if (courses.length === 0) {
    return <EmptyState lang={lang} subject={{ bn: "কোর্স", en: "courses" }} />;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <article
          key={course.slug}
          className="group flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-heading text-[15px] font-semibold leading-snug">
              {lang === "en" ? course.titleEn : course.titleBn}
            </h3>
            <div
              aria-hidden
              className={`h-1.5 w-10 shrink-0 rounded-full bg-gradient-to-r ${course.accentClass}`}
            />
          </div>

          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex items-start gap-2.5">
              <GraduationCap aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {lang === "bn" ? "যোগ্যতা" : "Eligibility"}
                </dt>
                <dd className="mt-0.5 font-medium">{pick(course.eligibilityLabel, lang)}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Hourglass aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {lang === "bn" ? "মেয়াদ" : "Duration"}
                </dt>
                <dd className="mt-0.5 font-medium">{pick(course.durationLabel, lang)}</dd>
              </div>
            </div>
          </dl>

          <Link
            href={langPath(lang, `/academics/courses/${course.slug}`)}
            className="mt-auto inline-flex items-center gap-1.5 rounded-md pt-4 text-[13px] font-semibold text-primary transition-colors outline-none hover:text-gold focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {lang === "bn" ? "কোর্স বিস্তারিত" : "Course details"}
            <ArrowRight aria-hidden className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </article>
      ))}
    </div>
  );
}
