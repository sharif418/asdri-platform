import Link from "next/link";
import { ArrowRight, BookOpenCheck, Layers } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { GoldRule, StarMotif } from "@/components/shared/ornaments";
import { CourseFacts } from "@/components/academics/course-facts";
import { CurriculumTabs } from "@/components/academics/curriculum-tabs";
import { ObjectivesChecklist, OutcomesList } from "@/components/academics/course-sections";
import { PysSpecializations } from "@/components/academics/pys-specializations";
import { kindLabels } from "@/components/academics/course-card";
import { langPath } from "@/lib/locale";
import { pick } from "@/types";
import type { Course, Language } from "@/types";

/**
 * The full course detail template — the ONE render path shared by the public
 * /academics/courses/[slug] permalink and the signed /preview/<token> route
 * (round 11). Preview passes withApplyBand={false}: a draft must not invite
 * applications, so the apply CTA band and the sidebar's apply button stay
 * off until the row is published.
 */
export function CourseDetail({
  course,
  lang,
  withApplyBand = true,
}: {
  course: Course;
  lang: Language;
  withApplyBand?: boolean;
}) {
  const isPys = (course.code ?? course.slug) === "PYS" || (course.specializations ?? []).length > 0;
  const courseTitle = lang === "bn" ? course.titleBn : course.titleEn;

  return (
    <>
      <PageHero
        eyebrow={pick(kindLabels[course.kind], lang)}
        title={courseTitle}
        description={course.tagline}
        lang={lang}
        breadcrumb={[
          { label: { bn: "একাডেমিক", en: "Academics" }, href: langPath(lang, "/academics") },
          { label: { bn: "চলমান কোর্সসমূহ", en: "Courses" }, href: langPath(lang, "/academics/courses") },
          { label: courseTitle },
        ]}
        arabicEcho={course.titleAr ?? undefined}
      />

      <div className="bg-background py-14 sm:py-20">
        <div className="container-site grid gap-12 lg:grid-cols-[1fr_360px]">
          {/* ——— Main column ——— */}
          <div className="min-w-0 space-y-14">
            {/* Intro */}
            <Reveal>
              <section aria-labelledby="course-intro">
                <h2 id="course-intro" className="font-heading text-xl font-semibold leading-snug sm:text-2xl">
                  {lang === "bn" ? "কোর্সের পরিচিতি" : "Course Introduction"}
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                  {pick(course.details.intro, lang)}
                </p>
              </section>
            </Reveal>

            <GoldRule />

            {/* Objectives */}
            <section aria-labelledby="course-objectives">
              <Reveal>
                <h2
                  id="course-objectives"
                  className="font-heading flex items-center gap-3 text-xl font-semibold leading-snug sm:text-2xl"
                >
                  <BookOpenCheck aria-hidden className="h-6 w-6 text-gold" />
                  {lang === "bn" ? "কোর্সের উদ্দেশ্য" : "Course Objectives"}
                </h2>
              </Reveal>
              <Reveal delay={0.1} className="mt-6">
                <ObjectivesChecklist objectives={course.details.objectives} lang={lang} />
              </Reveal>
            </section>

            {/* Curriculum */}
            {course.details.curriculum.length > 0 ? (
              <section aria-labelledby="course-curriculum">
                <Reveal>
                  <h2
                    id="course-curriculum"
                    className="font-heading flex items-center gap-3 text-xl font-semibold leading-snug sm:text-2xl"
                  >
                    <Layers aria-hidden className="h-6 w-6 text-gold" />
                    {lang === "bn" ? "কারিকুলাম ও কোর্স কাঠামো" : "Curriculum & Course Structure"}
                  </h2>
                </Reveal>
                <Reveal delay={0.1} className="mt-6">
                  <CurriculumTabs semesters={course.details.curriculum} lang={lang} />
                </Reveal>
              </section>
            ) : (
              <section aria-labelledby="course-curriculum">
                <Reveal>
                  <h2
                    id="course-curriculum"
                    className="font-heading flex items-center gap-3 text-xl font-semibold leading-snug sm:text-2xl"
                  >
                    <Layers aria-hidden className="h-6 w-6 text-gold" />
                    {lang === "bn" ? "কারিকুলাম" : "Curriculum"}
                  </h2>
                  <p className="mt-4 rounded-xl border border-dashed bg-parchment/60 p-6 text-sm leading-relaxed text-muted-foreground dark:bg-secondary/40">
                    {lang === "bn"
                      ? "এই কোর্সের সিলেবাস বিজ্ঞপ্তি অনুযায়ী প্রকাশিত হয় — সর্বশেষ কারিকুলাম পাওয়ার জন্য ডাউনলোড সেন্টার দেখুন।"
                      : "The syllabus for this course is published per announcement — see the Download Center for the latest curriculum."}
                  </p>
                </Reveal>
              </section>
            )}

            {/* Extra sections (e.g. PYS specialization note, diploma pathways) */}
            {course.details.extraSections.map((section) => (
              <section key={section.title.en} aria-labelledby={`extra-${section.title.en}`}>
                <Reveal>
                  <h2
                    id={`extra-${section.title.en}`}
                    className="font-heading text-xl font-semibold leading-snug sm:text-2xl"
                  >
                    {pick(section.title, lang)}
                  </h2>
                  <div className="mt-4 space-y-3">
                    {section.body.map((paragraph, index) => (
                      <p
                        key={`extra-p-${index}`}
                        className="text-[15px] leading-relaxed text-muted-foreground sm:text-base"
                      >
                        {pick(paragraph, lang)}
                      </p>
                    ))}
                  </div>
                </Reveal>
              </section>
            ))}

            {/* PYS specializations grid */}
            {isPys ? (
              <section aria-labelledby="pys-spec" className="rounded-2xl bg-parchment/70 p-6 sm:p-8 dark:bg-secondary/40">
                <Reveal>
                  <SectionHeading
                    eyebrow={lang === "bn" ? "তাখাসসুস" : "Specialization"}
                    title={{ bn: "তাখাসসুস বিভাগসমূহ (৫টি)", en: "Specialization Departments (5)" }}
                    description={{
                      bn: "প্রস্তুতিমূলক বর্ষের ফলাফল ও প্রবণতার ভিত্তিতে নির্বাচিত বিভাগে ২ বছর মেয়াদী উচ্চশিক্ষা।",
                      en: "A 2-year advanced program in the department chosen on the basis of preparatory-year results and aptitude.",
                    }}
                    lang={lang}
                  />
                </Reveal>
                <Reveal delay={0.1} className="mt-8">
                  <PysSpecializations lang={lang} specializations={(course.specializations ?? [])} />
                </Reveal>
              </section>
            ) : null}

            {/* Outcomes */}
            <section aria-labelledby="course-outcomes">
              <Reveal>
                <h2
                  id="course-outcomes"
                  className="font-heading text-xl font-semibold leading-snug sm:text-2xl"
                >
                  {lang === "bn" ? "কোর্স সম্পন্ন হলে যা অর্জিত হবে" : "Outcomes After Completion"}
                </h2>
              </Reveal>
              <Reveal delay={0.1} className="mt-6">
                <OutcomesList outcomes={course.details.outcomes} lang={lang} />
              </Reveal>
            </section>
          </div>

          {/* ——— Sidebar ——— */}
          <Reveal delay={0.15}>
            <CourseFacts course={course} lang={lang} showApply={withApplyBand} />
          </Reveal>
        </div>
      </div>

      {withApplyBand ? (
        /* ——— Apply CTA ——— */
        <section className="bg-background pb-16 sm:pb-24">
          <div className="container-site">
            <Reveal>
              <div className="relative overflow-hidden rounded-2xl bg-emerald-deep p-8 text-ivory shadow-xl sm:p-12">
                <div aria-hidden className="pattern-lattice-light absolute inset-0" />
                <div aria-hidden className="absolute -right-12 -top-12 opacity-10">
                  <StarMotif className="h-48 w-48 text-gold" />
                </div>
                <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
                  <div className="max-w-2xl">
                    <h2 className="font-heading text-2xl font-semibold leading-snug sm:text-3xl">
                      {lang === "bn" ? `${courseTitle} — ভর্তি চলছে` : `${courseTitle} — Admission Open`}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-ivory/75 sm:text-base">
                      {lang === "bn"
                        ? "অনলাইন আবেদন থেকে চূড়ান্ত ভর্তি — ৫ ধাপের প্রক্রিয়া ও ১০০% স্কলারশিপের সুযোগ সম্পর্কে জানুন।"
                        : "From online application to final admission — learn the 5-step process and 100% scholarship opportunities."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={langPath(lang, "/admissions")}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold-gradient px-8 text-sm font-semibold text-gold-foreground shadow-md transition-all hover:opacity-95"
                    >
                      {lang === "bn" ? "ভর্তির আবেদন করুন" : "Apply Now"}
                      <ArrowRight aria-hidden className="h-4 w-4" />
                    </Link>
                    <Link
                      href={langPath(lang, "/academics/downloads")}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-8 text-sm font-semibold text-gold transition-all hover:bg-gold hover:text-gold-foreground"
                    >
                      {lang === "bn" ? "সিলেবাস ডাউনলোড" : "Download Syllabus"}
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      ) : (
        /* Draft preview footer padding (the apply band's slot stays empty). */
        <div aria-hidden className="bg-background pb-16 sm:pb-24" />
      )}
    </>
  );
}
