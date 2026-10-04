import Link from "next/link";
import { ArrowRight, FlaskConical, Landmark, HelpCircle, Venus, Globe, ShieldAlert } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { StarMotif } from "@/components/shared/ornaments";
import { clarificationTopics } from "@/content/research";
import { langPath } from "@/lib/locale";
import { pick } from "@/types";
import type { Language } from "@/types";

const topicIcons: Record<string, typeof FlaskConical> = {
  "flask-conical": FlaskConical,
  landmark: Landmark,
  "help-circle": HelpCircle,
  venus: Venus,
  globe: Globe,
  "shield-alert": ShieldAlert,
};

/** Intellectual refutations & research highlights band. */
export function ResearchHighlights({ lang }: { lang: Language }) {
  return (
    <section className="relative overflow-hidden bg-emerald-deep py-16 text-ivory sm:py-24">
      <div aria-hidden className="pattern-lattice-light absolute inset-0" />
      <div
        aria-hidden
        className="absolute -left-24 top-1/2 hidden h-72 w-72 -translate-y-1/2 opacity-[0.05] lg:block"
      >
        <StarMotif className="h-full w-full text-gold" />
      </div>

      <div className="container-site relative">
        <Reveal>
          <SectionHeading
            eyebrow={lang === "bn" ? "গবেষণা ও জবাব" : "Research & Responses"}
            title={lang === "bn" ? "সংশয় নিরসন ও বুদ্ধিবৃত্তিক জবাব" : "Intellectual Refutations & Research"}
            description={
              lang === "bn"
                ? "সায়েন্টিজম, সেকুলারিজম, নাস্তিক্যবাদ, নারীবাদ, প্রাচ্যবাদ ও জেন্ডার ফিতনার মোকাবিলায় গবেষণালব্ধ ও যুক্তিনির্ভর জবাব।"
                : "Research-based, rational responses to scientism, secularism, atheism, feminism, orientalism, and gender fitnah."
            }
            lang={lang}
            tone="on-dark"
          />
        </Reveal>

        <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clarificationTopics.map((topic) => {
            const Icon = topicIcons[topic.icon] ?? HelpCircle;
            return (
              <RevealItem key={topic.id}>
                <Link
                  href={langPath(lang, `/research/clarifications#topic-${topic.id}`)}
                  className="group block h-full rounded-xl border border-ivory/15 bg-white/[0.06] p-5 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:bg-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/15 text-gold">
                      <Icon aria-hidden className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-medium text-ivory/50">
                      {lang === "bn" ? "আর্টিকেল" : "Articles"} {topic.articleCount} ·{" "}
                      {lang === "bn" ? "ভিডিও" : "Videos"} {topic.videoCount}
                    </span>
                  </div>
                  <h3 className="font-heading mt-4 text-base font-semibold text-ivory transition-colors group-hover:text-gold">
                    {pick(topic.title, lang)}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ivory/65">
                    {pick(topic.description, lang)}
                  </p>
                </Link>
              </RevealItem>
            );
          })}
        </Stagger>

        <Reveal className="mt-10 flex justify-center">
          <Link
            href={langPath(lang, "/research/clarifications")}
            className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-6 py-2.5 text-sm font-semibold text-gold transition-all hover:bg-gold hover:text-gold-foreground"
          >
            {lang === "bn" ? "সংশয় নিরসন দেখুন" : "Browse Intellectual Clarifications"}
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
