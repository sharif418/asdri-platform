import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, FlaskConical, GraduationCap, Landmark, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { LeadershipGrid } from "@/components/about/leadership-grid";
import { getOrgStructure } from "@/lib/content/about";
import { alternatesFor, type Lang, langPath } from "@/lib/locale";
import { env } from "@/lib/env";
import { pick } from "@/types";

const orgIcons: Record<string, LucideIcon> = {
  landmark: Landmark,
  "graduation-cap": GraduationCap,
  users: Users,
  "flask-conical": FlaskConical,
  "book-open-check": BookOpenCheck,
};

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  const isBn = lang === "bn";
  const { canonical, languages } = alternatesFor("/about/leadership", env.siteUrl);
  return {
    title: isBn ? "নেতৃত্ব ও প্রশাসন | আস-সুন্নাহ ইনস্টিটিউট" : "Leadership & Administration | As-Sunnah Institute",
    description:
      "আস-সুন্নাহ ইনস্টিটিউটের নেতৃত্ব দল ও প্রশাসনিক কাঠামো — চেয়ারম্যান, ইনচার্জ, কো-অর্ডিনেটর ও সাংগঠনিক কাঠামো।",
    alternates: { canonical, languages },
  };
}

/** /about/leadership — leadership team cards + organizational structure. */
export default async function LeadershipPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const orgStructure = await getOrgStructure();

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "আমাদের সম্পর্কে" : "About Us"}
        title={{ bn: "নেতৃত্ব ও প্রশাসন", en: "Leadership & Administration" }}
        description={{
          bn: "অভিজ্ঞ আলেম ও শিক্ষাবিদদের সমন্বয়ে গঠিত ইনস্টিটিউটের নেতৃত্ব — যাঁদের তত্ত্বাবধানে চলে প্রতিটি একাডেমিক ও গবেষণা কার্যক্রম।",
          en: "An experienced team of scholars and educators guiding every academic and research endeavor of the institute.",
        }}
        lang={lang}
        breadcrumb={[
          { label: { bn: "আমাদের সম্পর্কে", en: "About" }, href: langPath(lang, "/about") },
          { label: { bn: "নেতৃত্ব ও প্রশাসন", en: "Leadership" } },
        ]}
        arabicEcho="وَأَمْرُهُمْ شُورَىٰ بَيْنَهُمْ"
      />

      {/* ——— Leadership team ——— */}
      <section className="bg-background py-16 sm:py-24">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "নেতৃত্ব দল" : "Leadership Team"}
              title={{ bn: "প্রতিষ্ঠানের নেতৃত্ব", en: "Institute Leadership" }}
              description={{
                bn: "চেয়ারম্যানের নেতৃত্বে ইনচার্জ, অ্যাসিস্ট্যান্ট ইনচার্জ ও একাডেমিক কো-অর্ডিনেটরদের সমন্বয়ে প্রশাসনিক দায়িত্ব পরিচালিত হয়।",
                en: "Administration runs under the Chairman's leadership with the In-Charge, Assistant In-Charges, and Academic Coordinators.",
              }}
              lang={lang}
            />
          </Reveal>

          <div className="mt-12">
            <LeadershipGrid lang={lang} />
          </div>
        </div>
      </section>

      {/* ——— Organizational structure ——— */}
      <section className="bg-parchment py-16 sm:py-24 dark:bg-secondary/30">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "সাংগঠনিক কাঠামো" : "Organizational Structure"}
              title={{ bn: "প্রতিষ্ঠান পরিচালনার কাঠামো", en: "How the Institute Is Organized" }}
              description={{
                bn: "পরিচালনা পর্ষদ থেকে তারবিয়াহ বিভাগ — স্তরে স্তরে সাজানো দায়িত্ব ও সমন্বয়।",
                en: "From the governing body to the tarbiyah wing — layered responsibilities in coordination.",
              }}
              lang={lang}
            />
          </Reveal>

          <ol className="relative mt-12 space-y-6 before:absolute before:bottom-6 before:left-[27px] before:top-6 before:w-px before:bg-gold/40 md:space-y-0">
            {orgStructure.map((unit, index) => {
              const Icon = orgIcons[unit.icon] ?? Landmark;
              return (
                <li key={unit.id} className="relative md:grid md:grid-cols-2 md:gap-12">
                  <Reveal delay={index * 0.08} className={index % 2 === 1 ? "md:col-start-2" : undefined}>
                    <article className="ml-16 flex h-full gap-5 rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:shadow-emerald-950/10 md:ml-0">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-700 to-emerald-900 text-gold shadow-md">
                        <Icon aria-hidden className="h-7 w-7" />
                      </span>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-heading text-xs font-bold uppercase tracking-widest text-gold">
                            {lang === "bn" ? `স্তর ${["১", "২", "৩", "৪", "৫"][index] ?? index + 1}` : `Tier ${index + 1}`}
                          </span>
                        </div>
                        <h3 className="font-heading mt-1 text-lg font-semibold leading-snug">{pick(unit.title, lang)}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pick(unit.description, lang)}</p>
                      </div>
                    </article>
                  </Reveal>
                  <span
                    aria-hidden
                    className="absolute left-[19px] top-7 z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 border-gold bg-background md:left-1/2 md:-translate-x-1/2"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ——— CTA to faculty ——— */}
      <section className="bg-background py-16 sm:py-20">
        <div className="container-site">
          <Reveal>
            <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-gold/30 bg-gold/5 p-8 text-center sm:flex-row sm:text-left">
              <div>
                <h2 className="font-heading text-xl font-semibold leading-snug sm:text-2xl">
                  {lang === "bn" ? "শিক্ষক প্যানেল ও বিভাগসমূহ দেখুন" : "See the Teacher's Panel & Departments"}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {lang === "bn"
                    ? "দেশ-বিদেশের শিক্ষাবিদ ও গবেষকদের সমন্বয়ে গঠিত আমাদের পূর্ণাঙ্গ ফ্যাকাল্টি ডিরেক্টরি।"
                    : "Our complete faculty directory of educators and researchers from home and abroad."}
                </p>
              </div>
              <Link
                href={langPath(lang, "/academics/faculty")}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-gold-gradient px-6 text-sm font-semibold text-gold-foreground shadow-md transition-all hover:opacity-95"
              >
                {lang === "bn" ? "ফ্যাকাল্টি ডিরেক্টরি" : "Faculty Directory"}
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
