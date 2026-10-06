import { GraduationCap, BookOpen, Users, Timer, School, BadgeCheck } from "lucide-react";
import { StatCounter } from "@/components/shared/stat-counter";
import type { Language, StatItem } from "@/types";
import { pick } from "@/types";
import { cn } from "@/lib/utils";

const iconMap: Record<StatItem["icon"], typeof GraduationCap> = {
  students: Users,
  scholar: GraduationCap,
  general: School,
  shortcourse: Timer,
  enrolled: BookOpen,
  alumni: BadgeCheck,
};

interface StatsBandProps {
  lang: Language;
  /** DB-driven impact figures, passed by the server page. */
  stats: StatItem[];
}

/** Impact-at-a-glance band — deep emerald strip with animated gold counters.
 *  Server component: only the per-figure StatCounter is a client island. */
export function StatsBand({ lang, stats }: StatsBandProps) {
  if (stats.length === 0) {
    return (
      <section aria-label={lang === "bn" ? "এক নজরে ইনস্টিটিউট" : "Institute at a glance"} className="relative z-10 -mt-8">
        <div className="container-site">
          <div className="relative overflow-hidden rounded-2xl border border-gold/25 bg-emerald-deep px-6 py-10 text-center text-ivory shadow-xl shadow-emerald-950/20">
            <div aria-hidden className="pattern-lattice-light absolute inset-0" />
            <p className="relative text-sm text-ivory/70">
              {lang === "bn" ? "এখনো কোনো পরিসংখ্যান প্রকাশিত হয়নি।" : "No statistics published yet."}
            </p>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section aria-label={lang === "bn" ? "এক নজরে ইনস্টিটিউট" : "Institute at a glance"} className="relative z-10 -mt-8">
      <div className="container-site">
        <div className="relative overflow-hidden rounded-2xl border border-gold/25 bg-emerald-deep shadow-xl shadow-emerald-950/20">
          <div aria-hidden className="pattern-lattice-light absolute inset-0" />
          <div className="relative grid grid-cols-2 divide-x divide-y divide-ivory/10 sm:grid-cols-3 sm:divide-y-0 lg:grid-cols-6">
            {stats.map((stat) => {
              const Icon = iconMap[stat.icon];
              return (
                <div key={stat.id} className="flex flex-col items-center gap-1.5 px-3 py-6 text-center sm:py-8">
                  <Icon aria-hidden className="h-5 w-5 text-gold" />
                  <span className="font-heading text-2xl font-semibold text-ivory sm:text-3xl">
                    <StatCounter value={stat.value} suffix={stat.suffix} lang={lang} />
                  </span>
                  <span className={cn("text-[11px] leading-tight text-ivory/70 sm:text-xs")}>
                    {pick(stat.label, lang)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
