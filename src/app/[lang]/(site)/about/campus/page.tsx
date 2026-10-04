import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { langPath, type Lang } from "@/lib/locale";
import { PageHero } from "@/components/shared/page-hero";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { CampusLifeGrid } from "@/components/about/campus-life-grid";
import { FacilitiesGrid } from "@/components/about/facilities-grid";
import { CampusAddress } from "@/components/about/campus-address";
import { campusIntro } from "@/content/about";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "ক্যাম্পাস ও সুবিধাসমূহ | Campus & Facilities",
    description:
      "সাঁতারকুলে অবস্থিত আস-সুন্নাহ ইনস্টিটিউটের আবাসিক ক্যাম্পাস — লাইব্রেরি, কম্পিউটার ল্যাব, আবাসন ও আধ্যাত্মিক পরিবেশ।",
    alternates: { canonical: "/about/campus" },
  };
}

/** /about/campus — campus life grid, facilities, residential campus address. */
export default async function CampusPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "আমাদের সম্পর্কে" : "About Us"}
        title={{ bn: "ক্যাম্পাস ও সুবিধাসমূহ", en: "Campus & Facilities" }}
        description={{
          bn: "সাঁতারকুলের সবুজ পরিবেশে আবাসিক ক্যাম্পাস — যেখানে প্রতিদিন গড়ে ওঠে জ্ঞান, চরিত্র ও নেতৃত্ব।",
          en: "A residential campus in the green surroundings of Satarkul — where knowledge, character, and leadership grow daily.",
        }}
        lang={lang}
        breadcrumb={[
          { label: { bn: "আমাদের সম্পর্কে", en: "About" }, href: langPath(lang, "/about") },
          { label: { bn: "ক্যাম্পাস ও সুবিধাসমূহ", en: "Campus & Facilities" } },
        ]}
        arabicEcho="فِي بُيُوتٍ أَذِنَ اللَّهُ أَن تُرْفَعَ"
      />

      {/* ——— Intro + campus life ——— */}
      <section className="bg-background py-16 sm:py-24">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "ক্যাম্পাস লাইফ" : "Campus Life"}
              title={{ bn: "আবাসিক ক্যাম্পাসের জীবন", en: "Life at the Residential Campus" }}
              description={campusIntro}
              lang={lang}
            />
          </Reveal>

          <div className="mt-12">
            <CampusLifeGrid lang={lang} />
          </div>
        </div>
      </section>

      {/* ——— Facilities ——— */}
      <FacilitiesGrid lang={lang} />

      {/* ——— Campus address + map ——— */}
      <CampusAddress
        title={{ bn: "আবাসিক ক্যাম্পাসের ঠিকানা", en: "Residential Campus Address" }}
        description={{
          bn: "ইনস্টিটিউটের সব একাডেমিক ও আবাসিক কার্যক্রম এই ক্যাম্পাসে পরিচালিত হয়। ভর্তি বা ভিজিটের জন্য অফিস সময়ে যোগাযোগ করুন।",
          en: "All academic and residential activities take place at this campus. Contact the office during working hours for admissions or visits.",
        }}
        lang={lang}
      />

      {/* ——— Gallery CTA ——— */}
      <section className="bg-background pb-16 sm:pb-24">
        <div className="container-site">
          <Reveal>
            <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-emerald-deep p-8 text-center text-ivory shadow-xl sm:flex-row sm:text-left">
              <div>
                <h2 className="font-heading text-xl font-semibold leading-snug sm:text-2xl">
                  {lang === "bn" ? "ফটো গ্যালারিতে ক্যাম্পাস দেখুন" : "See the Campus in Photos"}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ivory/75">
                  {lang === "bn"
                    ? "লাইব্রেরি থেকে সেমিনার হল — ক্যাম্পাসের প্রতিটি মুহূর্ত আমাদের গ্যালারিতে সংরক্ষিত।"
                    : "From the library to the seminar hall — moments of campus life preserved in our gallery."}
                </p>
              </div>
              <Link
                href={langPath(lang, "/media/gallery")}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-gold-gradient px-6 text-sm font-semibold text-gold-foreground shadow-md transition-all hover:opacity-95"
              >
                {lang === "bn" ? "গ্যালারিতে যান" : "Open Gallery"}
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
