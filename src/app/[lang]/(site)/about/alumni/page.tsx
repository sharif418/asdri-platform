import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { GoldRule } from "@/components/shared/ornaments";
import { AlumniBatchTable, AlumniEngagement, AlumniSummary } from "@/components/about/alumni-sections";
import { AlumniDirectory } from "@/components/about/alumni-directory";
import { getAlumniIntro } from "@/lib/content/about";
import { getInstituteStats } from "@/lib/content/stats";
import { getAlumniDirectory } from "@/lib/alumni";
import { alternatesFor, type Lang, langPath } from "@/lib/locale";
import { env } from "@/lib/env";
import { pick } from "@/types";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  const isBn = lang === "bn";
  const { canonical, languages } = alternatesFor("/about/alumni", env.siteUrl);
  return {
    title: isBn ? "অ্যালামনাই অ্যাসোসিয়েশন | আস-সুন্নাহ ইনস্টিটিউট" : "Alumni Association | As-Sunnah Institute",
    description:
      "আস-সুন্নাহ ইনস্টিটিউটের অ্যালামনাই — PGDID, CCIS ও শিক্ষক প্রশিক্ষণ ব্যাচের পরিসংখ্যান ও অ্যালামনাই সক্রিয়তা।",
    alternates: { canonical, languages },
  };
}

/** /about/alumni — alumni intro, batch statistics, public directory, engagement. */
export default async function AlumniPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: Lang }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang } = await params;
  const sp = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : (v ?? "")).trim();
  const q = first(sp.q).slice(0, 120);
  const course = first(sp.course);
  const requestedPage = Number.parseInt(first(sp.page) || "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const [alumniIntro, stats, directory] = await Promise.all([
    getAlumniIntro(),
    getInstituteStats(),
    getAlumniDirectory({ q: q || undefined, course: course || undefined, page }),
  ]);
  const totalAlumni = stats.find((stat) => stat.id === "alumni")?.value ?? 293;

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "আমাদের সম্পর্কে" : "About Us"}
        title={{ bn: "অ্যালামনাই অ্যাসোসিয়েশন", en: "Alumni Association" }}
        description={{
          bn: "প্রতিটি প্রাক্তন শিক্ষার্থী উম্মাহ-দরদী একজন দাঈ ও গবেষক — দেশ-বিদেশে ছড়িয়ে থাকা আমাদের গর্ব।",
          en: "Every alumnus is an ummah-conscious da'ee and researcher — our pride, spread across the country and beyond.",
        }}
        lang={lang}
        breadcrumb={[
          { label: { bn: "আমাদের সম্পর্কে", en: "About" }, href: langPath(lang, "/about") },
          { label: { bn: "অ্যালামনাই অ্যাসোসিয়েশন", en: "Alumni Association" } },
        ]}
        arabicEcho="خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ"
      />

      {/* ——— Intro + summary counters ——— */}
      <section className="bg-background py-16 sm:py-24">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "পরিচিতি" : "Introduction"}
              title={{ bn: "আমাদের অ্যালামনাই", en: "Our Alumni" }}
              lang={lang}
            />
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-6 max-w-3xl text-center text-[15px] leading-relaxed text-muted-foreground sm:text-base">
              {pick(alumniIntro, lang)}
            </p>
          </Reveal>

          <div className="mt-12">
            <AlumniSummary lang={lang} totalAlumni={totalAlumni} />
          </div>
        </div>
      </section>

      {/* ——— Batch statistics ——— */}
      <section className="bg-parchment py-16 sm:py-24 dark:bg-secondary/30">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "ব্যাচ পরিসংখ্যান" : "Batch Statistics"}
              title={{ bn: "কর্মসূচিভিত্তিক সফল শিক্ষার্থী", en: "Program-wise Successful Graduates" }}
              description={{
                bn: "পোস্ট গ্রাজুয়েট ডিপ্লোমা (PGDID), সার্টিফিকেট কোর্স (CCIS) ও আরবি ভাষা শিক্ষক প্রশিক্ষণ — প্রতিটি সম্পন্ন ব্যাচের সাফল্যের হিসাব।",
                en: "PGDID, CCIS, and the Arabic Teacher Training — the record of every completed batch.",
              }}
              lang={lang}
            />
          </Reveal>

          <div className="mx-auto mt-12 max-w-4xl">
            <AlumniBatchTable lang={lang} />
            <GoldRule className="mt-10" />
          </div>
        </div>
      </section>

      {/* ——— Public directory (published registry rows, contact-free) ——— */}
      <section className="bg-background py-16 sm:py-24">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "ব্যাচ ডিরেক্টরি" : "Batch Directory"}
              title={{ bn: "আমাদের প্রাক্তন শিক্ষার্থীর তালিকা", en: "Our Graduates Directory" }}
              description={{
                bn: "অফিস-অনুমোদিত তালিকা — প্রতিটি প্রাক্তনের নাম, ব্যাচ ও বর্তমান পরিচয়। কারও যোগাযোগের তথ্য এখানে কখনোই প্রকাশ করা হয় না।",
                en: "Office-curated — each graduate's name, batch, and present life. No contact details are ever published here.",
              }}
              lang={lang}
            />
          </Reveal>
          <div className="mt-8">
            <AlumniDirectory lang={lang} result={directory} q={q} course={course} />
          </div>
        </div>
      </section>

      {/* ——— Engagement ——— */}
      <AlumniEngagement lang={lang} />

      {/* ——— CTA ——— */}
      <section className="bg-background py-16 sm:py-20">
        <div className="container-site">
          <Reveal>
            <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-emerald-deep p-8 text-center text-ivory shadow-xl sm:flex-row sm:text-left">
              <div>
                <h2 className="font-heading text-xl font-semibold leading-snug sm:text-2xl">
                  {lang === "bn" ? "আপনি কি আমাদের প্রাক্তন শিক্ষার্থী?" : "Are You One of Our Alumni?"}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ivory/75">
                  {lang === "bn"
                    ? "অ্যালামনাই নেটওয়ার্কে যুক্ত হতে ও কার্যক্রমে অংশ নিতে আমাদের সঙ্গে যোগাযোগ করুন।"
                    : "Connect with the alumni network and join our ongoing activities — get in touch with us."}
                </p>
              </div>
              <Link
                href={langPath(lang, "/contact")}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-gold-gradient px-6 text-sm font-semibold text-gold-foreground shadow-md transition-all hover:opacity-95"
              >
                {lang === "bn" ? "যোগাযোগ করুন" : "Contact Us"}
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
