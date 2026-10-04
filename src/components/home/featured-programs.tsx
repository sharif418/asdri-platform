import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
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
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { courses } from "@/content/courses";
import { pick } from "@/types";
import type { Course, Language } from "@/types";
import { cn } from "@/lib/utils";

const courseIcons: Record<string, typeof GraduationCap> = {
  "graduation-cap": GraduationCap,
  "scroll-text": ScrollText,
  "library-big": LibraryBig,
  languages: Languages,
  "mic-vocal": MicVocal,
  "bell-ring": BellRing,
  "flask-conical": FlaskConical,
};

const kindLabels: Record<Course["kind"], { bn: string; en: string }> = {
  flagship: { bn: "ফ্ল্যাগশিপ প্রোগ্রাম", en: "Flagship Program" },
  certificate: { bn: "সার্টিফিকেট কোর্স", en: "Certificate Course" },
  diploma: { bn: "ডিপ্লোমা কোর্স", en: "Diploma Course" },
  training: { bn: "প্রশিক্ষণ কার্যক্রম", en: "Training Program" },
};

/** Featured programs — card grid of the institute's courses. */
export function FeaturedPrograms({ lang }: { lang: Language }) {
  return (
    <section className="bg-parchment py-16 sm:py-24 dark:bg-secondary/30">
      <div className="container-site">
        <Reveal>
          <SectionHeading
            eyebrow={lang === "bn" ? "একাডেমিক" : "Academics"}
            title={lang === "bn" ? "চলমান কোর্স ও প্রোগ্রামসমূহ" : "Featured Programs"}
            description={
              lang === "bn"
                ? "আলেম, বিশ্ববিদ্যালয়-স্নাতক ও দাওয়াহকর্মীদের জন্য সাজানো আমাদের কোর্সসমূহ — মেয়াদ, ধরন ও যোগ্যতাসহ।"
                : "Our programs for Ulama, university graduates, and dawah workers — with duration and eligibility at a glance."
            }
            lang={lang}
          />
        </Reveal>

        <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const Icon = courseIcons[course.icon] ?? GraduationCap;
            return (
              <RevealItem key={course.slug}>
                <Link href={`/academics/courses/${course.slug}`} className="group block h-full">
                  <article className="relative flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/10">
                    {/* Colored top ribbon */}
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

                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                        {pick(course.summary, lang)}
                      </p>

                      <div className="mt-5 space-y-2 border-t pt-4 text-[13px]">
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <Clock3 aria-hidden className="h-4 w-4 shrink-0 text-gold" />
                          <span className="font-medium text-foreground/80">
                            {pick(course.durationLabel, lang)}
                          </span>
                        </p>
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <UserCheck aria-hidden className="h-4 w-4 shrink-0 text-gold" />
                          <span className="line-clamp-1">{pick(course.eligibilityLabel, lang)}</span>
                        </p>
                      </div>

                      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                        {lang === "bn" ? "বিস্তারিত দেখুন" : "Learn More"}
                        <ArrowRight
                          aria-hidden
                          className="h-4 w-4 transition-transform group-hover:translate-x-1"
                        />
                      </span>
                    </div>
                  </article>
                </Link>
              </RevealItem>
            );
          })}
        </Stagger>

        <Reveal className="mt-10 text-center">
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <BadgeCheck aria-hidden className="h-4 w-4 text-gold" />
            {lang === "bn"
              ? "সব কোর্সে ১০০% স্কলারশিপের সুযোগ (যাকাত-উপযুক্ত অস্বচ্ছল শিক্ষার্থীদের জন্য)"
              : "100% scholarships available across all courses (for zakat-eligible students in need)"}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
