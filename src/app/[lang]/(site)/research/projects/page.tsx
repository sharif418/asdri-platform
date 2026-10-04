import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FolderKanban, GraduationCap } from "lucide-react";
import { langPath, type Lang } from "@/lib/locale";
import { PageHero } from "@/components/shared/page-hero";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { ProjectCard } from "@/components/research/project-card";
import { CallForPapers } from "@/components/research/call-for-papers";
import { researchProjects } from "@/content/research";
import { siteConfig } from "@/content/site";

export const metadata: Metadata = {
  title: `গবেষণা প্রকল্প ও ফেলোশিপ — ${siteConfig.nameBn}`,
  description:
    "চলমান গবেষণা প্রকল্পের অগ্রগতি, কল ফর পেপার্স (ইনস্টিটিউট জার্নাল) এবং ফেলোশিপ ও গবেষণা-সহযোগিতার সুযোগ।",
};

/** Research projects & fellowships. */
export default async function ProjectsPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const ongoing = researchProjects.filter((p) => p.status === "ongoing");
  const upcoming = researchProjects.filter((p) => p.status === "upcoming");

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "গবেষণা ও প্রকাশনা" : "Research & Publications"}
        title={lang === "bn" ? "গবেষণা প্রকল্প ও ফেলোশিপ" : "Research Projects & Fellowships"}
        description={
          lang === "bn"
            ? "সমকালীন মতাদর্শ, নাস্তিক্যবাদ ও প্রাচ্যবিদ-সমালোচনার ওপর চলমান গবেষণা — স্বচ্ছ অগ্রগতি ট্র্যাকিংসহ।"
            : "Ongoing research on contemporary ideologies, atheism, and orientalist criticism — with transparent progress tracking."
        }
        lang={lang}
        breadcrumb={[
          { label: lang === "bn" ? "গবেষণা" : "Research", href: langPath(lang, "/research") },
          { label: lang === "bn" ? "প্রকল্প ও ফেলোশিপ" : "Projects & Fellowships" },
        ]}
        arabicEcho="وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا"
      />

      {/* ————— ongoing projects ————— */}
      <section className="py-16 sm:py-24">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "চলমান" : "Ongoing"}
              title={lang === "bn" ? "চলমান গবেষণা প্রকল্পসমূহ" : "Ongoing Research Projects"}
              description={
                lang === "bn"
                  ? "প্রতিটি প্রকল্পের অগ্রগতি নিয়মিত হালনাগাদ করা হয় — সোনালি বার দেখায় বর্তমান অবস্থা।"
                  : "Each project's progress is updated regularly — the gold bar shows current status."
              }
              lang={lang}
            />
          </Reveal>
          <Stagger className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ongoing.map((project) => (
              <RevealItem key={project.id}>
                <ProjectCard project={project} lang={lang} />
              </RevealItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ————— call for papers ————— */}
      <section className="bg-parchment py-16 sm:py-24">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "অবদান রাখুন" : "Contribute"}
              title={lang === "bn" ? "ইনস্টিটিউট জার্নালে লেখা পাঠান" : "Write for the Institute Journal"}
              description={
                lang === "bn"
                  ? "মৌলিক গবেষণাপত্র পিয়ার-রিভিউর জন্য আহ্বান করা হচ্ছে — নির্দেশিকা মেনে পাণ্ডুলিপি পাঠান।"
                  : "Original research papers are invited for peer review — submit manuscripts per the guidelines."
              }
              lang={lang}
            />
          </Reveal>
          <Reveal delay={0.1} className="mt-12">
            <CallForPapers lang={lang} />
          </Reveal>
        </div>
      </section>

      {/* ————— upcoming + fellowship ————— */}
      <section className="py-16 sm:py-24">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "আসন্ন" : "Upcoming"}
              title={lang === "bn" ? "আসন্ন প্রকল্প ও ফেলোশিপ সুযোগ" : "Upcoming Projects & Fellowship Openings"}
              description={
                lang === "bn"
                  ? "নতুন প্রকল্প ঘোষণার সঙ্গে ফেলোশিপ বিজ্ঞপ্তিও প্রকাশিত হবে — নোটিশ বোর্ডে নজর রাখুন।"
                  : "Fellowship notices accompany each new project announcement — watch the notice board."
                }
              lang={lang}
            />
          </Reveal>

          <Stagger className="mt-12 grid gap-6 md:grid-cols-2">
            {upcoming.map((project) => (
              <RevealItem key={project.id}>
                <ProjectCard project={project} lang={lang} />
              </RevealItem>
            ))}
            <RevealItem>
              <div className="flex h-full flex-col items-start justify-center rounded-2xl border border-dashed bg-parchment p-7 sm:p-9">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-deep text-gold">
                  <GraduationCap aria-hidden className="h-6 w-6" />
                </div>
                <h3 className="font-heading mt-4 text-base font-semibold sm:text-lg">
                  {lang === "bn" ? "ফেলোশিপ ও গবেষণা-সহযোগিতা" : "Fellowship & Research Collaboration"}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {lang === "bn"
                    ? "বিশ্ববিদ্যালয় শিক্ষক, আলেম ও স্বাধীন গবেষকরা যৌথ গবেষণার জন্য আবেদন করতে পারেন। ফেলোশিপ ঘোষণা, নির্বাচনী নীতিমালা ও আবেদন প্রক্রিয়া নোটিশ বোর্ডে প্রকাশিত হয়।"
                    : "University teachers, ulama, and independent researchers may apply for joint research. Fellowship announcements, selection policy, and application process are published on the notice board."}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link
                    href={langPath(lang, "/notices?category=recruitment")}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <FolderKanban aria-hidden className="h-4 w-4" />
                    {lang === "bn" ? "সংশ্লিষ্ট নোটিশ" : "Related Notices"}
                  </Link>
                  <Link
                    href={langPath(lang, "/contact")}
                    className="inline-flex items-center gap-2 text-[13px] font-semibold text-primary transition-colors hover:text-gold"
                  >
                    {lang === "bn" ? "যোগাযোগ করুন" : "Contact Us"}
                    <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </RevealItem>
          </Stagger>
        </div>
      </section>
    </>
  );
}
