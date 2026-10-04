import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, Play } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { StarMotif } from "@/components/shared/ornaments";
import { ClarificationTopicSection } from "@/components/research/clarification-topic-section";
import { CounterQuestionForm } from "@/components/research/counter-question-form";
import { getClarificationTopics } from "@/lib/content/research";
import { getArticlesByCategorySlug } from "@/lib/content/blog";
import { getSiteConfig } from "@/lib/content/site";
import { alternatesFor, type Lang, langPath } from "@/lib/locale";
import { isFeatureEnabled } from "@/lib/settings";
import { ModuleUnavailable } from "@/components/shared/module-unavailable";
import { env } from "@/lib/env";
import { pick } from "@/types";
import type { BlogArticle } from "@/types";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  const isBn = lang === "bn";
  const siteConfig = await getSiteConfig();
  const { canonical, languages } = alternatesFor("/research/clarifications", env.siteUrl);
  return {
    title: isBn ? `সংশয় নিরসন ও জবাব — ${siteConfig.shortBn}` : `Intellectual Clarifications — ${siteConfig.shortEn}`,
    description:
      "সায়েন্টিজম, সেকুলারিজম, নাস্তিক্যবাদ, নারীবাদ, প্রাচ্যবাদ ও জেন্ডার ফিতনা — গবেষণালব্ধ বুদ্ধিবৃত্তিক জবাব ও প্রতিপ্রশ্ন জমার সুযোগ।",
    alternates: { canonical, languages },
  };
}

/** Intellectual clarifications & refutations — topic sections with anchors. */
export default async function ClarificationsPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  if (!(await isFeatureEnabled("clarifications"))) {
    return <ModuleUnavailable lang={lang} moduleLabelBn="সংশয় নিরসন" moduleLabelEn="Clarifications" />;
  }
  const clarificationTopics = await getClarificationTopics();
  const allArticles = await getArticlesByCategorySlug("clar-all");
  const relatedByTopic = new Map<string, BlogArticle[]>();
  for (const topic of clarificationTopics) {
    const related = await getArticlesByCategorySlug(`clar-${topic.id}`);
    relatedByTopic.set(
      topic.id,
      related.length > 0 ? related.slice(0, 3) : allArticles.slice(0, 2),
    );
  }

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "গবেষণা ও প্রকাশনা" : "Research & Publications"}
        title={lang === "bn" ? "সংশয় নিরসন ও জবাব" : "Intellectual Clarifications & Refutations"}
        description={
          lang === "bn"
            ? "ছয়টি প্রধান মতাদর্শের আপত্তির বিপরীতে আমাদের গবেষণালব্ধ জবাব — প্রতিটি বিষয়ে আর্টিকেল, ভিডিও ও পিডিএফ।"
            : "Our researched responses to objections across six major ideologies — each topic covered in article, video, and PDF formats."
        }
        lang={lang}
        breadcrumb={[
          { label: lang === "bn" ? "গবেষণা" : "Research", href: langPath(lang, "/research") },
          { label: lang === "bn" ? "সংশয় নিরসন" : "Clarifications" },
        ]}
        arabicEcho="فَبِأَيِّ حَدِيثٍ بَعْدَ اللَّهِ وَآيَاتِهِ يُؤْمِنُونَ"
      />

      {/* ————— quick topic jump ————— */}
      <nav
        aria-label={lang === "bn" ? "বিষয়সমূহে দ্রুত যান" : "Jump to topics"}
        className="border-b bg-parchment"
      >
        <div className="container-site flex items-center gap-3 overflow-x-auto py-4">
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {lang === "bn" ? "বিষয়সমূহ:" : "Topics:"}
          </span>
          <ul className="flex items-center gap-2">
            {clarificationTopics.map((topic) => (
              <li key={topic.id}>
                <a
                  href={`#topic-${topic.id}`}
                  className="inline-flex shrink-0 items-center rounded-full border border-primary/25 bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-gold/60 hover:text-gold"
                >
                  {pick(topic.title, lang)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* ————— topic sections ————— */}
      <section className="py-16 sm:py-20">
        <div className="container-site space-y-8 sm:space-y-10">
          {clarificationTopics.map((topic, index) => (
            <Reveal key={topic.id} delay={Math.min(index * 0.05, 0.2)}>
              <ClarificationTopicSection
                topic={topic}
                index={index}
                lang={lang}
                related={relatedByTopic.get(topic.id) ?? []}
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ————— multi-format band ————— */}
      <section className="bg-parchment py-14">
        <div className="container-site">
          <Reveal>
            <div className="grid gap-5 sm:grid-cols-3">
              {[
                {
                  icon: FileText,
                  title: { bn: "লিখিত আর্টিকেল", en: "Written Articles" },
                  note: {
                    bn: "যুক্তি ও দলিলসহ দীর্ঘ প্রামাণ্য আলোচনা — ব্লগে প্রকাশিত।",
                    en: "Long-form evidenced discussions with reasoning and sources — published on the blog.",
                  },
                  href: "/media/blog",
                },
                {
                  icon: Play,
                  title: { bn: "ভিডিও জবাব", en: "Video Responses" },
                  note: {
                    bn: "গবেষণা বোর্ডের উস্তাযদের মুখে সংক্ষিপ্ত ও স্পষ্ট জবাব।",
                    en: "Crisp, clear answers from the research board's teachers.",
                  },
                  href: "/media/videos",
                },
                {
                  icon: FileText,
                  title: { bn: "পিডিএফ প্রকাশনা", en: "PDF Publications" },
                  note: {
                    bn: "ডাউনলোডযোগ্য পূর্ণাঙ্গ রিসার্চ পেপার — রেফারেন্সসহ।",
                    en: "Downloadable full research papers — complete with references.",
                  },
                  href: "/research/library",
                },
              ].map((format) => (
                <Link
                  key={format.title.en}
                  href={langPath(lang, format.href)}
                  className="group rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md"
                >
                  <format.icon aria-hidden className="h-6 w-6 text-gold" />
                  <h3 className="font-heading mt-3.5 text-base font-semibold group-hover:text-primary">
                    {pick(format.title, lang)}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{pick(format.note, lang)}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-gold">
                    {lang === "bn" ? "দেখুন" : "Explore"}
                    <ArrowRight aria-hidden className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ————— counter-question ————— */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div aria-hidden className="absolute -right-24 bottom-0 h-72 w-72 opacity-[0.04]">
          <StarMotif className="h-full w-full text-primary" />
        </div>
        <div className="container-site relative">
          <div className="mx-auto max-w-2xl">
            <Reveal>
              <CounterQuestionForm
                lang={lang}
                topicLabel={lang === "bn" ? "সংশয় নিরসন" : "Doubt Resolution"}
              />
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
