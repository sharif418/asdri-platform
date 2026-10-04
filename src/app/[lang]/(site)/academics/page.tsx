import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, FlaskConical, GraduationCap, ScrollText, Sprout } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { StatCounter } from "@/components/shared/stat-counter";
import { CourseCard, kindLabels } from "@/components/academics/course-card";
import { getCourses, getFeaturedCourses, getSdpPrograms } from "@/lib/content/courses";
import { getInstituteStats } from "@/lib/content/stats";
import { alternatesFor, type Lang, langPath } from "@/lib/locale";
import { env } from "@/lib/env";
import { toBnDigits } from "@/lib/format";
import { pick } from "@/types";
import type { CourseKind } from "@/types";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  const isBn = lang === "bn";
  const { canonical, languages } = alternatesFor("/academics", env.siteUrl);
  return {
    title: isBn ? "একাডেমিক পরিচিতি | আস-সুন্নাহ ইনস্টিটিউট" : "Academic Overview | As-Sunnah Institute",
    description:
      "আস-সুন্নাহ ইনস্টিটিউটের একাডেমিক কাঠামো — ৭টি কোর্স, ৪ ধরনের কর্মসূচি ও শিক্ষার্থী উন্নয়ন কার্যক্রম (SDP)।",
    alternates: { canonical, languages },
  };
}

const kindIcons: Record<CourseKind, LucideIcon> = {
  flagship: GraduationCap,
  certificate: ScrollText,
  diploma: Award,
  training: FlaskConical,
};

/** /academics — academic overview: course kinds, featured courses, SDP intro, CTA. */
export default async function AcademicsPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const [courses, featuredCourses, studentDevelopmentPrograms, instituteStats] = await Promise.all([
    getCourses(),
    getFeaturedCourses(),
    getSdpPrograms(),
    getInstituteStats(),
  ]);
  const enrolled = instituteStats.find((stat) => stat.id === "currently-enrolled") ?? instituteStats[4];
  const totalSdpHours = studentDevelopmentPrograms.reduce((sum, program) => sum + program.hours, 0);
  const kindCounts = (Object.keys(kindLabels) as CourseKind[]).map((kind) => ({
    kind,
    count: courses.filter((course) => course.kind === kind).length,
  }));

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "একাডেমিক" : "Academics"}
        title={{ bn: "একাডেমিক পরিচিতি", en: "Academic Overview" }}
        description={{
          bn: "আলেম, বিশ্ববিদ্যালয়-স্নাতক ও দাওয়াহকর্মীদের জন্য সাজানো ৭টি কোর্স — ঐতিহ্যবাহী শাস্ত্রচর্চা ও আধুনিক জ্ঞানের সমন্বয়ে।",
          en: "Seven programs for Ulama, university graduates, and dawah workers — blending classical scholarship with modern disciplines.",
        }}
        lang={lang}
        breadcrumb={[{ label: { bn: "একাডেমিক", en: "Academics" }, href: langPath(lang, "/academics") }]}
        arabicEcho="وَعَلَّمَ الْإِنسَانَ مَا لَمْ يَعْلَمْ"
      />

      {/* ——— By-the-numbers strip ——— */}
      <section className="bg-background py-14 sm:py-16">
        <div className="container-site grid gap-6 sm:grid-cols-3">
          <Reveal>
            <article className="flex items-center gap-4 rounded-xl border bg-card p-6 shadow-sm">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-700 to-emerald-900 text-gold shadow-md">
                <GraduationCap aria-hidden className="h-6 w-6" />
              </span>
              <div>
                <p className="font-heading text-3xl font-semibold">
                  <StatCounter value={courses.length} lang={lang} />
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {lang === "bn" ? "চলমান কোর্স ও প্রোগ্রাম" : "Courses & programs"}
                </p>
              </div>
            </article>
          </Reveal>
          <Reveal delay={0.1}>
            <article className="flex items-center gap-4 rounded-xl border bg-card p-6 shadow-sm">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-700 to-emerald-900 text-gold shadow-md">
                <Sprout aria-hidden className="h-6 w-6" />
              </span>
              <div>
                <p className="font-heading text-3xl font-semibold">
                  {enrolled ? <StatCounter value={enrolled.value} lang={lang} /> : "—"}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {lang === "bn" ? "বর্তমানে অধ্যয়নরত শিক্ষার্থী" : "Currently enrolled students"}
                </p>
              </div>
            </article>
          </Reveal>
          <Reveal delay={0.2}>
            <article className="flex items-center gap-4 rounded-xl border bg-card p-6 shadow-sm">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-700 to-emerald-900 text-gold shadow-md">
                <FlaskConical aria-hidden className="h-6 w-6" />
              </span>
              <div>
                <p className="font-heading text-3xl font-semibold">
                  <StatCounter value={totalSdpHours} suffix={lang === "bn" ? " ঘণ্টা" : " hrs"} lang={lang} />
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {lang === "bn" ? "SDP কার্যক্রমের পরিকল্পিত ঘণ্টা" : "Planned SDP activity hours"}
                </p>
              </div>
            </article>
          </Reveal>
        </div>
      </section>

      {/* ——— Course kinds summary ——— */}
      <section className="bg-parchment py-16 sm:py-24 dark:bg-secondary/30">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "কোর্সের ধরন" : "Course Kinds"}
              title={{ bn: "চার ধরনের কর্মসূচি", en: "Four Kinds of Programs" }}
              description={{
                bn: "উচ্চশিক্ষা থেকে স্বল্প মেয়াদী প্রশিক্ষণ — প্রয়োজন অনুযায়ী বেছে নেওয়ার জন্য সাজানো কাঠামো।",
                en: "From higher education to short trainings — a structured spread for every need.",
              }}
              lang={lang}
            />
          </Reveal>

          <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {kindCounts.map(({ kind, count }) => {
              const Icon = kindIcons[kind];
              return (
                <RevealItem key={kind}>
                  <Link
                    href={langPath(lang, "/academics/courses")}
                    className="group block h-full rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <article className="flex h-full flex-col rounded-xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg hover:shadow-emerald-950/10">
                      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-700 to-emerald-900 text-gold shadow-md">
                        <Icon aria-hidden className="h-6 w-6" />
                      </span>
                      <h3 className="font-heading mt-4 text-base font-semibold leading-snug">
                        {pick(kindLabels[kind], lang)}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {lang === "bn"
                          ? `${toBnDigits(count)}টি ${kind === "training" ? "প্রশিক্ষণ কার্যক্রম" : "কোর্স"}`
                          : `${count} ${kind === "training" ? "programs" : count === 1 ? "course" : "courses"}`}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                        {lang === "bn" ? "কোর্স দেখুন" : "View courses"}
                        <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </article>
                  </Link>
                </RevealItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* ——— Featured courses ——— */}
      <section className="bg-background py-16 sm:py-24">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "ফিচার্ড প্রোগ্রাম" : "Featured Programs"}
              title={{ bn: "আমাদের প্রধান কোর্সসমূহ", en: "Our Flagship Courses" }}
              lang={lang}
            />
          </Reveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCourses.map((course) => (
              <Reveal key={course.slug} className="h-full">
                <CourseCard course={course} lang={lang} />
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-10 text-center">
            <Link
              href={langPath(lang, "/academics/courses")}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold-gradient px-8 text-sm font-semibold text-gold-foreground shadow-md transition-all outline-none hover:opacity-95 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {lang === "bn"
                ? `সব ${toBnDigits(courses.length)}টি কোর্স দেখুন`
                : `Browse All ${courses.length} Courses`}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ——— SDP intro ——— */}
      <section className="relative overflow-hidden bg-emerald-deep py-16 text-ivory sm:py-24">
        <div aria-hidden className="pattern-lattice-light absolute inset-0" />
        <div className="container-site relative">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "SDP" : "SDP"}
              title={{ bn: "শিক্ষার্থী উন্নয়ন কার্যক্রম", en: "Student Development Programs" }}
              description={{
                bn: "পাঠ্যক্রমের বাইরে ৬টি বাধ্যতামূলক (অ-ক্রেডিট) কার্যক্রম — তারবিয়াহ, শর্ট কোর্স, সেমিনার, সহ-শিক্ষা, বাধ্যতামূলক পাঠ ও কমিউনিটি সার্ভিস।",
                en: "Six mandatory (non-credit) programs beyond the curriculum — tarbiyah, short courses, seminars, co-curriculars, reading, and community service.",
              }}
              lang={lang}
              tone="on-dark"
            />
          </Reveal>

          <Reveal className="mt-8 text-center">
            <Link
              href={langPath(lang, "/academics/development")}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-8 text-sm font-semibold text-gold transition-all outline-none hover:bg-gold hover:text-gold-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {lang === "bn" ? "SDP বিস্তারিত দেখুন" : "Explore SDP Details"}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
