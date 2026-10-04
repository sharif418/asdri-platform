import { BookMarked, GraduationCap } from "lucide-react";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { getFacultyGroups } from "@/lib/content/people";
import { toBnDigits } from "@/lib/format";
import { pick } from "@/types";
import type { FacultyGroup, Language } from "@/types";

function GroupCard({ group, lang }: { group: FacultyGroup; lang: Language }) {
  return (
    <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {group.members.map((member) => (
        <RevealItem key={member.id}>
          <article className="flex h-full flex-col rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-emerald-950/5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-heading text-[15px] font-semibold leading-snug">{pick(member.name, lang)}</h3>
              <span
                aria-hidden
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold"
              >
                <GraduationCap className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-gold">{pick(member.designation, lang)}</p>
            {member.subjects.length > 0 ? (
              <ul className="mt-3 space-y-1.5" aria-label={lang === "bn" ? "পড়ানো বিষয়সমূহ" : "Subjects taught"}>
                {member.subjects.map((subject, subjectIndex) => (
                  <li
                    key={`${member.id}-s${subjectIndex}`}
                    className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground"
                  >
                    <BookMarked aria-hidden className="mt-0.5 h-3 w-3 shrink-0 text-gold/70" />
                    <span>{pick(subject, lang)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        </RevealItem>
      ))}
    </Stagger>
  );
}

/** Full faculty directory — teacher's panel, Arabic team, Tajweed team, language depts. */
export async function FacultyDirectory({ lang }: { lang: Language }) {
  const allGroups = await getFacultyGroups();
  const facultyGroups = allGroups.filter((group) => group.members.length > 0);
  if (facultyGroups.length === 0) {
    return <EmptyState lang={lang} subject={{ bn: "শিক্ষক", en: "faculty members" }} />;
  }
  return (
    <div className="space-y-16">
      {facultyGroups.map((group, groupIndex) => (
        <section key={group.id}>
          <Reveal>
            <div className="mb-8">
              <SectionHeading
                eyebrow={lang === "bn" ? `দল ${toBnDigits(groupIndex + 1)}` : `Team ${groupIndex + 1}`}
                title={group.title}
                description={group.subtitle ?? undefined}
                lang={lang}
                align="center"
                as="h2"
              />
              <p className="mt-3 text-center">
                <Badge variant="outline" className="border-gold/40 bg-gold/10 text-xs font-semibold text-gold">
                  {lang === "bn"
                    ? `মোট ${toBnDigits(group.members.length)} জন সদস্য`
                    : `${group.members.length} members`}
                </Badge>
              </p>
            </div>
          </Reveal>
          <GroupCard group={group} lang={lang} />
        </section>
      ))}
    </div>
  );
}
