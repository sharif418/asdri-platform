import Link from "next/link";
import { BookOpen, GitMerge, Sprout, ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { CornerOrnament } from "@/components/shared/ornaments";
import { corePillars, visionStatement } from "@/content/stats";
import { pick } from "@/types";
import type { Language } from "@/types";

const pillarIcons = { "book-open": BookOpen, "git-merge": GitMerge, sprout: Sprout } as const;

/** Vision & core pillars section. */
export function VisionPillars({ lang }: { lang: Language }) {
  return (
    <section className="py-16 sm:py-24">
      <div className="container-site">
        <Reveal>
          <SectionHeading
            eyebrow={lang === "bn" ? "আমাদের মূল লক্ষ্য" : "Our Vision"}
            title={lang === "bn" ? "মূল লক্ষ্য ও কোর স্তম্ভসমূহ" : "Vision & Core Pillars"}
            description={visionStatement}
            lang={lang}
          />
        </Reveal>

        <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
          {corePillars.map((pillar) => {
            const Icon = pillarIcons[pillar.icon as keyof typeof pillarIcons];
            return (
              <RevealItem key={pillar.id}>
                <article className="group relative h-full overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg hover:shadow-emerald-950/10">
                  <CornerOrnament className="-right-10 -top-10 rotate-90 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon aria-hidden className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading mt-5 text-lg font-semibold leading-snug">
                    {pick(pillar.title, lang)}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {pick(pillar.description, lang)}
                  </p>
                </article>
              </RevealItem>
            );
          })}
        </Stagger>

        <Reveal className="mt-10 text-center">
          <Link
            href="/about"
            className="link-sweep inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
          >
            {lang === "bn" ? "লক্ষ্য ও উদ্দেশ্য সম্পর্কে আরও" : "More about vision & objectives"}
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
