import { BadgeCheck } from "lucide-react";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { CornerOrnament } from "@/components/shared/ornaments";
import { EmptyState } from "@/components/shared/empty-state";
import { getLeadershipTeam } from "@/lib/content/people";
import { pick } from "@/types";
import type { Language, LeadershipMember } from "@/types";
import { cn } from "@/lib/utils";

/** Monogram avatar — emerald disc with gold Bengali initial. */
export function LeaderMonogram({
  initials,
  size = "md",
}: {
  initials: string;
  size?: "md" | "lg";
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-700 to-emerald-900 font-heading font-semibold text-gold shadow-md",
        size === "lg" ? "h-16 w-16 text-2xl" : "h-12 w-12 text-xl",
      )}
    >
      {initials}
    </span>
  );
}

function LeaderCard({ member, lang, priority }: { member: LeadershipMember; lang: Language; priority: boolean }) {
  return (
    <article className="relative h-full overflow-hidden rounded-xl border bg-card p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-950/10">
      <CornerOrnament className="-right-3 -top-3" />
      <div className="flex flex-col items-center">
        <LeaderMonogram initials={member.initials} size={priority ? "lg" : "md"} />
        <h3 className="font-heading mt-4 text-lg font-semibold leading-snug">{pick(member.name, lang)}</h3>
        <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-gold">
          <BadgeCheck aria-hidden className="h-4 w-4" />
          {pick(member.role, lang)}
        </p>
        {member.bio ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{pick(member.bio, lang)}</p>
        ) : null}
      </div>
    </article>
  );
}

/** Grid of leadership team cards. The chairman (first entry) is highlighted. */
export async function LeadershipGrid({ lang }: { lang: Language }) {
  const leadershipTeam = await getLeadershipTeam();
  if (leadershipTeam.length === 0) {
    return <EmptyState lang={lang} subject={{ bn: "নেতৃত্ব", en: "leadership members" }} />;
  }
  return (
    <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {leadershipTeam.map((member, index) => (
        <RevealItem key={member.id} className={index === 0 ? "sm:col-span-2 lg:col-span-1" : undefined}>
          <LeaderCard member={member} lang={lang} priority={index === 0} />
        </RevealItem>
      ))}
    </Stagger>
  );
}

/** Compact leadership strip (used on faculty page). */
export async function LeadershipCompact({ lang }: { lang: Language }) {
  const leadershipTeam = await getLeadershipTeam();
  if (leadershipTeam.length === 0) {
    return <EmptyState lang={lang} subject={{ bn: "নেতৃত্ব", en: "leadership members" }} />;
  }
  return (
    <Reveal>
      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {leadershipTeam.map((member) => (
          <RevealItem key={member.id}>
            <article className="flex h-full items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
              <LeaderMonogram initials={member.initials} />
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold leading-snug">{pick(member.name, lang)}</h3>
                <p className="mt-0.5 text-xs text-gold">{pick(member.role, lang)}</p>
              </div>
            </article>
          </RevealItem>
        ))}
      </Stagger>
    </Reveal>
  );
}
