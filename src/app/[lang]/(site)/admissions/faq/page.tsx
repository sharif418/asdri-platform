import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageCircleQuestion } from "lucide-react";
import { langPath, type Lang } from "@/lib/locale";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { FaqExplorer } from "@/components/admissions/faq-explorer";
import { faqGroups } from "@/content/admission";
import { siteConfig } from "@/content/site";

export const metadata: Metadata = {
  title: `সচরাচর জিজ্ঞাসা (FAQ) — ${siteConfig.nameBn}`,
  description:
    "ভর্তি, কোর্স ও অনুদান সংক্রান্ত সচরাচর জিজ্ঞাসার উত্তর — আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট।",
};

/** FAQ — tabbed groups with smooth accordions. */
export default async function FaqPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "ভর্তি" : "Admissions"}
        title={lang === "bn" ? "সচরাচর জিজ্ঞাসা" : "Frequently Asked Questions"}
        description={
          lang === "bn"
            ? "ভর্তি, কোর্স ও অনুদান — তিনটি ভাগে সাজানো হয়েছে সবচেয়ে বেশি জিজ্ঞাসিত প্রশ্নগুলোর উত্তর।"
            : "Answers to the most-asked questions, organized into admission, course, and donation groups."
        }
        lang={lang}
        breadcrumb={[
          { label: lang === "bn" ? "ভর্তি" : "Admissions", href: langPath(lang, "/admissions") },
          { label: lang === "bn" ? "সচরাচর জিজ্ঞাসা" : "FAQ" },
        ]}
      />

      <section className="bg-parchment py-16 sm:py-24">
        <div className="container-site">
          <Reveal>
            <FaqExplorer groups={[...faqGroups]} lang={lang} />
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mx-auto mt-14 max-w-2xl rounded-2xl border bg-card p-6 text-center shadow-sm sm:p-8">
              <MessageCircleQuestion aria-hidden className="mx-auto h-8 w-8 text-gold" />
              <h2 className="font-heading mt-4 text-lg font-semibold">
                {lang === "bn" ? "আরও কিছু জানার আছে?" : "Still Have a Question?"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {lang === "bn"
                  ? "এখানে উত্তর না পেলে ফতোয়া ও অনলাইন জিজ্ঞাসা বিভাগে প্রশ্ন করুন, অথবা ভর্তি সংক্রান্ত ইমেইলে যোগাযোগ করুন।"
                  : "If your question isn't answered here, ask via the fatwa gateway or email the admissions office."}
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={langPath(lang, "/research/fatwa")}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {lang === "bn" ? "প্রশ্ন করুন" : "Ask a Question"}
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
                <a
                  href={`mailto:${siteConfig.emailAdmission}`}
                  className="text-sm font-semibold text-primary underline-offset-4 transition-colors hover:text-gold hover:underline"
                >
                  {siteConfig.emailAdmission}
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
