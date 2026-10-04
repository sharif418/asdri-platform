import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { LeadershipCompact } from "@/components/about/leadership-grid";
import { FacultyDirectory } from "@/components/academics/faculty-sections";
import { getFacultyGroups } from "@/lib/content/people";
import { alternatesFor, type Lang, langPath } from "@/lib/locale";
import { env } from "@/lib/env";
import { toBnDigits } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  const isBn = lang === "bn";
  const { canonical, languages } = alternatesFor("/academics/faculty", env.siteUrl);
  return {
    title: isBn ? "শিক্ষক ও গবেষকবৃন্দ | আস-সুন্নাহ ইনস্টিটিউট" : "Faculty & Teachers | As-Sunnah Institute",
    description:
      "আস-সুন্নাহ ইনস্টিটিউটের শিক্ষক প্যানেল, আরবি টিম, তাজবিদ টিম ও ভাষা বিভাগ — দেশ-বিদেশের শিক্ষাবিদ ও গবেষকদের সমন্বয়ে।",
    alternates: { canonical, languages },
  };
}

/** /academics/faculty — leadership strip + full faculty directory. */
export default async function FacultyPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const facultyGroups = await getFacultyGroups();
  const totalMembers = facultyGroups.reduce((sum, group) => sum + group.members.length, 0);

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "একাডেমিক" : "Academics"}
        title={{ bn: "শিক্ষক ও গবেষকবৃন্দ", en: "Faculty & Teachers" }}
        description={{
          bn: `দেশ-বিদেশের স্বীকৃত শিক্ষাবিদ ও গবেষকদের সমন্বয়ে গঠিত আমাদের শিক্ষক-সম্প্রদায় — মোট ${toBnDigits(totalMembers)} সদস্য।`,
          en: `Our teaching community of recognized scholars and researchers from home and abroad — ${totalMembers} members in total.`,
        }}
        lang={lang}
        breadcrumb={[
          { label: { bn: "একাডেমিক", en: "Academics" }, href: langPath(lang, "/academics") },
          { label: { bn: "শিক্ষক ও গবেষকবৃন্দ", en: "Faculty & Teachers" } },
        ]}
        arabicEcho="خَيْرُكُمْ مَنْ تَعَلَّمَ الْعِلْمَ وَعَلَّمَهُ"
      />

      {/* ——— Leadership strip ——— */}
      <section className="bg-background pt-16 sm:pt-20">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "প্রশাসনিক নেতৃত্ব" : "Administrative Leadership"}
              title={{ bn: "নেতৃত্ব দল", en: "Leadership Team" }}
              description={{
                bn: "পাঠদানের পাশাপাশি প্রশাসনিক দায়িত্বে নিয়োজিত নেতৃত্ব — বিস্তারিত নেতৃত্ব পাতায়।",
                en: "The leadership also serving administrative duties — see the full leadership page.",
              }}
              lang={lang}
            />
          </Reveal>
          <div className="mt-10">
            <LeadershipCompact lang={lang} />
          </div>
          <Reveal className="mt-6 text-center">
            <Link
              href={langPath(lang, "/about/leadership")}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-6 text-sm font-semibold text-gold transition-all hover:bg-gold hover:text-gold-foreground"
            >
              {lang === "bn" ? "নেতৃত্ব ও প্রশাসন বিস্তারিত" : "Full Leadership & Administration"}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ——— Faculty directory ——— */}
      <section className="bg-background py-16 sm:py-20">
        <div className="container-site">
          <Reveal>
            <div aria-hidden className="mx-auto mb-14 mt-6 h-px w-24 bg-gold/50" />
          </Reveal>
          <FacultyDirectory lang={lang} />
        </div>
      </section>
    </>
  );
}
