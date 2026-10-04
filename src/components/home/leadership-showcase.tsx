import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { EmptyState } from "@/components/shared/empty-state";
import { getLeadershipTeam } from "@/lib/content/people";
import { langPath } from "@/lib/locale";
import { pick } from "@/types";
import type { Language } from "@/types";
import { cn } from "@/lib/utils";

/** Featured leadership — prominent figures with elegant monogram avatars. */
export async function LeadershipShowcase({ lang }: { lang: Language }) {
  const leadershipTeam = await getLeadershipTeam();
  return (
    <section className="py-16 sm:py-24">
      <div className="container-site">
        <Reveal>
          <SectionHeading
            eyebrow={lang === "bn" ? "নেতৃত্ব" : "Leadership"}
            title={lang === "bn" ? "পরিচালনা পর্ষদ ও শিক্ষকমণ্ডলী" : "Featured Leadership & Faculty"}
            description={
              lang === "bn"
                ? "দেশ-বিদেশের স্বীকৃত শিক্ষাবিদ, গবেষক ও দাঈদের সমন্বয়ে গঠিত আমাদের নেতৃত্ব।"
                : "Our leadership comprises recognized scholars, researchers, and da'ees from home and abroad."
            }
            lang={lang}
          />
        </Reveal>

        <Stagger className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {leadershipTeam.length === 0 ? (
            <div className="col-span-2 sm:col-span-3 lg:col-span-5">
              <EmptyState lang={lang} subject={{ bn: "নেতৃত্ব", en: "leadership" }} />
            </div>
          ) : null}
          {leadershipTeam.map((member) => (
            <RevealItem key={member.id}>
              <Link href={langPath(lang, "/academics/faculty")} className="group block">
                <article className="relative h-full overflow-hidden rounded-xl border bg-card p-5 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-gold/60 hover:shadow-lg">
                  <div
                    aria-hidden
                    className={cn(
                      "absolute inset-x-0 top-0 h-1 bg-gold-gradient opacity-0 transition-opacity",
                      "group-hover:opacity-100",
                    )}
                  />
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold/40 bg-gradient-to-br from-emerald-700 to-emerald-900 text-2xl font-semibold text-gold shadow-inner transition-transform group-hover:scale-105">
                    <span className="font-heading">{member.initials}</span>
                  </div>
                  <h3 className="font-heading mt-4 text-[15px] font-semibold leading-snug">
                    {pick(member.name, lang)}
                  </h3>
                  <p className="mt-1 text-[12px] font-medium text-gold">{pick(member.role, lang)}</p>
                  {member.bio ? (
                    <p className="mt-2.5 line-clamp-3 text-[12px] leading-relaxed text-muted-foreground">
                      {pick(member.bio, lang)}
                    </p>
                  ) : null}
                </article>
              </Link>
            </RevealItem>
          ))}
        </Stagger>

        <Reveal className="mt-10 text-center">
          <Link
            href={langPath(lang, "/academics/faculty")}
            className="inline-flex items-center gap-2 rounded-full border px-6 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            {lang === "bn" ? "সম্পূর্ণ শিক্ষক প্যানেল" : "Full Faculty Panel"}
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
