import type { Metadata } from "next";
import { BookMarked, CircleCheckBig, Mail, ShieldCheck } from "lucide-react";
import { langPath, type Lang } from "@/lib/locale";
import { PageHero } from "@/components/shared/page-hero";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { StarMotif } from "@/components/shared/ornaments";
import { FatwaBankExplorer } from "@/components/research/fatwa-bank-explorer";
import { FatwaAskForm } from "@/components/research/fatwa-ask-form";
import { siteConfig } from "@/content/site";

export const metadata: Metadata = {
  title: `ফতোয়া ও অনলাইন জিজ্ঞাসা — ${siteConfig.nameBn}`,
  description:
    "সার্চেবল ফতোয়া ব্যাংক — ইবাদত, লেনদেন, আকীদা, পারিবারিক ও সমকালীন বিষয়ে প্রামাণ্য জবাব, সঙ্গে অনলাইনে প্রশ্ন জমার সুযোগ।",
};

/** Fatwa & online queries — the full searchable bank + ask form. */
export default async function FatwaPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: Lang }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang } = await params;
  const sp = await searchParams;
  const initialQuery = typeof sp.q === "string" ? sp.q.trim().slice(0, 120) : "";
  const focusSlug = typeof sp.focus === "string" ? sp.focus.trim().slice(0, 160) : "";

  const principles = [
    {
      icon: BookMarked,
      title: { bn: "প্রামাণ্য দলিল", en: "Authentic Evidence" },
      note: {
        bn: "প্রতিটি উত্তর কুরআন, সহীহ সুন্নাহ ও নির্ভরযোগ্য ফিকহি সূত্রের আলোকে প্রস্তুত করা হয়।",
        en: "Every answer is prepared in light of the Quran, authentic Sunnah, and reliable fiqh sources.",
      },
    },
    {
      icon: ShieldCheck,
      title: { bn: "গোপনীয়তা সুরক্ষিত", en: "Privacy Protected" },
      note: {
        bn: "প্রশ্নকারীর পরিচয় গোপন থাকে; চাইলে উত্তর শুধু ইমেইলে পাঠানো হয় — প্রকাশ্যে আসে না।",
        en: "Questioners stay anonymous; answers can be emailed privately — never published if you opt out.",
      },
    },
    {
      icon: CircleCheckBig,
      title: { bn: "গবেষণা বোর্ডের তত্ত্বাবধান", en: "Research Board Oversight" },
      note: {
        bn: "উত্তর প্রস্তুত ও পর্যালোচনা করে ইনস্টিটিউটের ফিকহ ও গবেষণা বোর্ড।",
        en: "Answers are prepared and reviewed by the institute's fiqh & research board.",
      },
    },
  ];

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "গবেষণা ও প্রকাশনা" : "Research & Publications"}
        title={lang === "bn" ? "ফতোয়া ও অনলাইন জিজ্ঞাসা" : "Fatwa & Online Queries"}
        description={
          lang === "bn"
            ? "প্রকাশিত ফতোয়াগুলো ক্যাটাগরি ও কী-ওয়ার্ড অনুযায়ী খুঁজুন — পূর্ণ উত্তর, উত্তরদাতা ও তারিখসহ। নতুন প্রশ্ন পাঠাতে নিচের ফর্ম ব্যবহার করুন।"
            : "Search published fatwas by category and keyword — with full answers, respondent, and date. Use the form below to send a new question."
        }
        lang={lang}
        breadcrumb={[
          { label: lang === "bn" ? "গবেষণা" : "Research", href: langPath(lang, "/research") },
          { label: lang === "bn" ? "ফতোয়া" : "Fatwa" },
        ]}
        arabicEcho="فَاسْأَلُوا أَهْلَ الذِّكْرِ إِنْ كُنْتُمْ لَا تَعْلَمُونَ"
      />

      {/* ————— principles strip ————— */}
      <section className="border-b bg-parchment py-10">
        <div className="container-site">
          <Stagger className="grid gap-5 sm:grid-cols-3">
            {principles.map((principle) => (
              <RevealItem key={principle.title.en}>
                <div className="flex h-full items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-deep text-gold">
                    <principle.icon aria-hidden className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold">{principle.title[lang]}</h2>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                      {principle.note[lang]}
                    </p>
                  </div>
                </div>
              </RevealItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ————— the bank ————— */}
      <section id="bank" className="scroll-mt-28 py-16 sm:py-20">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "ফতোয়া ব্যাংক" : "The Bank"}
              title={lang === "bn" ? "প্রকাশিত ফতোয়ার সংগ্রহশালা" : "Published Fatwa Archive"}
              description={
                lang === "bn"
                  ? "যেকোনো ফতোয়ায় ক্লিক করে পূর্ণ উত্তর পড়ুন — সঙ্গে অফিসিয়াল প্যাডে প্রিন্ট/পিডিএফ ও শেয়ারের সুবিধা।"
                  : "Click any fatwa to read the full answer — with official-pad print/PDF and share options."
              }
              lang={lang}
            />
          </Reveal>
          <Reveal delay={0.1} className="mt-12">
            <FatwaBankExplorer lang={lang} initialQuery={initialQuery} focusSlug={focusSlug} />
          </Reveal>
        </div>
      </section>

      {/* ————— ask a question ————— */}
      <section id="ask" className="relative scroll-mt-28 overflow-hidden bg-parchment py-16 sm:py-24">
        <div aria-hidden className="absolute -left-24 top-1/2 hidden h-72 w-72 -translate-y-1/2 opacity-[0.04] lg:block">
          <StarMotif className="h-full w-full text-primary" />
        </div>
        <div className="container-site relative">
          <div className="grid gap-10 lg:grid-cols-5 lg:gap-14">
            <Reveal className="lg:col-span-2">
              <SectionHeading
                align="left"
                eyebrow={lang === "bn" ? "জিজ্ঞাসা করুন" : "Ask Away"}
                title={lang === "bn" ? "সরাসরি প্রশ্ন পাঠান" : "Send a Question Directly"}
                description={
                  lang === "bn"
                    ? "ব্যাংকে উত্তর না পেলে সরাসরি ফিকহ ও গবেষণা বোর্ডের কাছে প্রশ্ন পাঠান — উত্তর প্রস্তুত হলে ইমেইলে জানানো হবে।"
                    : "If the bank doesn't answer your query, send it straight to the fiqh & research board — you'll be emailed once answered."
                }
                lang={lang}
              />
              <div className="mt-8 space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
                <p className="text-sm font-semibold">
                  {lang === "bn" ? "প্রত্যুত্তরের সময়" : "Response Time"}
                </p>
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  {lang === "bn"
                    ? "সাধারণ প্রশ্নের উত্তর ৩–৭ কার্যদিবসে ইনশাআল্লাহ। জটিল গবেষণাধীন বিষয়ে সময় বেশি লাগতে পারে।"
                    : "Standard questions are answered within 3–7 working days, in shaa Allah. Complex research topics may take longer."}
                </p>
                <p className="flex items-center gap-2 border-t pt-4 text-[13px] font-semibold text-primary">
                  <Mail aria-hidden className="h-4 w-4 text-gold" />
                  {siteConfig.email}
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.1} className="lg:col-span-3">
              <FatwaAskForm lang={lang} />
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
