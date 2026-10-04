import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { alternatesFor, type Lang, langPath } from "@/lib/locale";
import { env } from "@/lib/env";
import { getCourses } from "@/lib/content/courses";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { CourseGrid } from "@/components/academics/course-card";
import { toBnDigits } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  const isBn = lang === "bn";
  const { canonical, languages } = alternatesFor("/academics/courses", env.siteUrl);
  return {
    title: isBn ? "চলমান কোর্সসমূহ | আস-সুন্নাহ ইনস্টিটিউট" : "Courses & Programs | As-Sunnah Institute",
    description:
      "PYS, CCIS, ডিপ্লোমা ইন দাওয়াহ অ্যান্ড ইসলামিক স্টাডিজসহ আস-সুন্নাহ ইনস্টিটিউটের সব কোর্সের তালিকা।",
    alternates: { canonical, languages },
  };
}

/** /academics/courses — the complete course catalog grid. */
export default async function CoursesPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const courses = await getCourses();

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "একাডেমিক" : "Academics"}
        title={{ bn: "চলমান কোর্সসমূহ", en: "Courses & Programs" }}
        description={{
          bn: `মোট ${toBnDigits(courses.length)}টি কোর্স ও প্রশিক্ষণ কার্যক্রম — প্রতিটির বিস্তারিত কারিকুলাম, যোগ্যতা ও ফলাফলসহ।`,
          en: `A total of ${courses.length} courses and training programs — each with full curriculum, eligibility, and outcomes.`,
        }}
        lang={lang}
        breadcrumb={[
          { label: { bn: "একাডেমিক", en: "Academics" }, href: langPath(lang, "/academics") },
          { label: { bn: "চলমান কোর্সসমূহ", en: "Courses" } },
        ]}
        arabicEcho="اطْلُبُوا الْعِلْمَ مِنَ الْمَهْدِ إِلَى اللَّحْدِ"
      />

      <section className="bg-background py-16 sm:py-24">
        <div className="container-site">
          <Reveal>
            <CourseGrid lang={lang} />
          </Reveal>

          <Reveal className="mt-12">
            <div className="flex flex-col items-center justify-between gap-5 rounded-2xl border border-gold/30 bg-gold/5 p-7 text-center sm:flex-row sm:text-left">
              <p className="flex items-center gap-2.5 text-sm font-medium sm:text-[15px]">
                <BadgeCheck aria-hidden className="h-5 w-5 shrink-0 text-gold" />
                {lang === "bn"
                  ? "সব কোর্সে ১০০% স্কলারশিপের সুযোগ — যাকাত-উপযুক্ত অস্বচ্ছল শিক্ষার্থীদের জন্য।"
                  : "100% scholarships available across all courses — for zakat-eligible students in need."}
              </p>
              <Link
                href={langPath(lang, "/admissions")}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-gold-gradient px-6 text-sm font-semibold text-gold-foreground shadow-md transition-all hover:opacity-95"
              >
                {lang === "bn" ? "ভর্তি প্রক্রিয়া দেখুন" : "See Admission Process"}
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
