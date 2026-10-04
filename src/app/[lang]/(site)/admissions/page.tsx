import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BellRing, ClipboardList, Mail } from "lucide-react";
import { langPath, type Lang } from "@/lib/locale";
import { PageHero } from "@/components/shared/page-hero";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { StarMotif } from "@/components/shared/ornaments";
import { AdmissionTimeline } from "@/components/admissions/admission-timeline";
import { ExamSubjects } from "@/components/admissions/exam-subjects";
import { CourseEligibility } from "@/components/admissions/course-eligibility";
import { siteConfig } from "@/content/site";

export const metadata: Metadata = {
  title: `ভর্তি প্রক্রিয়া — ${siteConfig.nameBn}`,
  description:
    "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউটে ভর্তির ৫ ধাপ — অনলাইন আবেদন, প্রাথমিক যাচাই-বাছাই, লিখিত পরীক্ষা, মৌখিক পরীক্ষা (ভাইভা) ও চূড়ান্ত ভর্তি।",
};

/** Admissions — the structured 5-step admission journey. */
export default async function AdmissionsPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "ভর্তি" : "Admissions"}
        title={lang === "bn" ? "ভর্তি প্রক্রিয়া" : "Admission Process"}
        description={
          lang === "bn"
            ? "৫টি ধাপে সম্পন্ন হয় আস-সুন্নাহ ইনস্টিটিউটের ভর্তি প্রক্রিয়া — প্রতিটি ধাপ স্বচ্ছ, ন্যায্য ও যোগ্যতাভিত্তিক।"
            : "Admission at As-Sunnah Institute completes in five transparent, merit-based steps."
        }
        lang={lang}
        breadcrumb={[{ label: lang === "bn" ? "ভর্তি প্রক্রিয়া" : "Admission Process" }]}
        arabicEcho="وَقُل رَّبِّ زِدْنِي عِلْمًا"
      />

      {/* ————— 5-step timeline ————— */}
      <section className="py-16 sm:py-24">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "৫ ধাপে ভর্তি" : "Five Steps"}
              title={lang === "bn" ? "আবেদন থেকে চূড়ান্ত ভর্তি পর্যন্ত" : "From Application to Final Admission"}
              description={
                lang === "bn"
                  ? "প্রতিটি কোর্সের ভর্তি বিজ্ঞপ্তি প্রকাশের পর এই পাঁচটি ধাপ অনুসরণ করে শিক্ষার্থী নির্বাচন করা হয়।"
                  : "Once a circular is published, students are selected through these five stages."
              }
              lang={lang}
            />
          </Reveal>
          <div className="mt-14">
            <AdmissionTimeline lang={lang} />
          </div>
        </div>
      </section>

      {/* ————— exam subjects ————— */}
      <section className="bg-parchment py-16 sm:py-24">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "প্রস্তুতি" : "Preparation"}
              title={lang === "bn" ? "লিখিত পরীক্ষায় কী কী থাকে?" : "What Does the Written Test Cover?"}
              description={
                lang === "bn"
                  ? "সাধারণ শিক্ষার্থীদের জন্য প্রধান তিনটি ক্ষেত্রে প্রশ্ন করা হয় — কোর্সভেদে স্তর ভিন্ন হতে পারে।"
                  : "For general students, questions span three key areas — depth varies by course."
              }
              lang={lang}
            />
          </Reveal>
          <Reveal delay={0.1} className="mt-12">
            <ExamSubjects lang={lang} />
          </Reveal>
        </div>
      </section>

      {/* ————— eligibility per course ————— */}
      <section className="py-16 sm:py-24">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "যোগ্যতা" : "Eligibility"}
              title={lang === "bn" ? "কোর্সভেদে ভর্তির যোগ্যতা" : "Eligibility by Course"}
              description={
                lang === "bn"
                  ? "কোন কোর্সে আবেদনের আগে প্রয়োজনীয় শিক্ষাগত যোগ্যতা ও মেয়াদ দেখে নিন।"
                  : "Check the required academic background and duration before applying to any course."
              }
              lang={lang}
            />
          </Reveal>
          <Reveal delay={0.1} className="mt-12">
            <CourseEligibility lang={lang} />
          </Reveal>
        </div>
      </section>

      {/* ————— apply CTA ————— */}
      <section className="relative overflow-hidden bg-emerald-deep py-16 text-ivory sm:py-20">
        <div aria-hidden className="pattern-lattice-light absolute inset-0" />
        <div aria-hidden className="absolute -right-20 -top-20 h-64 w-64 opacity-[0.06]">
          <StarMotif className="h-full w-full text-gold" />
        </div>
        <div className="container-site relative">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-heading text-2xl font-semibold sm:text-3xl">
                {lang === "bn"
                  ? "ভর্তি বিজ্ঞপ্তি প্রকাশিত হলেই আবেদন শুরু হয়"
                  : "Applications Open When a Circular Is Published"}
              </h2>
              <p className="mt-4 leading-relaxed text-ivory/75">
                {lang === "bn"
                  ? "চলমান ও আসন্ন ভর্তি বিজ্ঞপ্তি, আবেদনের লিঙ্ক ও শেষ তারিখ জানতে নোটিশ বোর্ডের ভর্তি বিজ্ঞপ্তি অংশটি দেখুন।"
                  : "See the admission section of the notice board for ongoing and upcoming circulars, application links, and deadlines."}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={langPath(lang, "/notices?category=admission")}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold-gradient px-7 py-3 text-sm font-bold text-gold-foreground shadow-lg transition-all outline-none hover:scale-[1.02] focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <BellRing aria-hidden className="h-4 w-4" />
                  {lang === "bn" ? "ভর্তি বিজ্ঞপ্তি দেখুন" : "View Admission Notices"}
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
                <Link
                  href={langPath(lang, "/admissions/scholarships")}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-7 py-3 text-sm font-semibold text-gold transition-colors outline-none hover:bg-gold hover:text-gold-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {lang === "bn" ? "স্কলারশিপ ও আর্থিক সহায়তা" : "Scholarships & Aid"}
                </Link>
              </div>
              <div className="mt-8 flex flex-col items-center justify-center gap-2 text-sm text-ivory/60 sm:flex-row sm:gap-6">
                <span className="inline-flex items-center gap-2">
                  <Mail aria-hidden className="h-4 w-4 text-gold/80" />
                  {siteConfig.emailAdmission}
                </span>
                <span className="inline-flex items-center gap-2">
                  <ClipboardList aria-hidden className="h-4 w-4 text-gold/80" />
                  {lang === "bn"
                    ? "আবেদন সম্পূর্ণ অনলাইনে — ফর্মে সঠিক তথ্য বাধ্যতামূলক"
                    : "Applications are fully online — accurate information is mandatory"}
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
