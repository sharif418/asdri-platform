import Link from "next/link";
import { Pencil, Plus, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatNumber, toBnDigits } from "@/lib/format";
import { TeamsManager, type TeamRow } from "@/components/admin/teams-manager";
import { cn } from "@/lib/utils";

export const metadata = { title: "শিক্ষক ও কর্মকর্তা" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** People directory — grouped by team, with inline team management. */
export default async function AdminPeoplePage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "academics.manage")) redirect("/admin");

  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 120);

  const [teams, people, ungrouped] = await Promise.all([
    db.team.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, key: true, nameBn: true, nameEn: true, sortOrder: true, _count: { select: { people: true } } },
    }),
    db.person.findMany({
      where: q
        ? { OR: [{ nameBn: { contains: q } }, { nameEn: { contains: q, mode: "insensitive" as const } }] }
        : undefined,
      orderBy: [{ teamId: "asc" }, { sortOrder: "asc" }],
      select: { id: true, slug: true, nameBn: true, titleBn: true, teamId: true, isFeatured: true, isPublished: true, sortOrder: true, photoMedia: { select: { key: true } } },
    }),
    db.person.count({ where: { teamId: null } }),
  ]);

  const teamRows: TeamRow[] = teams.map((team) => ({
    id: team.id,
    key: team.key,
    nameBn: team.nameBn,
    nameEn: team.nameEn,
    sortOrder: team.sortOrder,
    peopleCount: team._count.people,
  }));

  const grouped = teams.map((team) => ({ team, people: people.filter((p) => p.teamId === team.id) }));
  const withoutTeam = people.filter((p) => p.teamId === null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
            <Users aria-hidden className="h-6 w-6 text-primary" />
            শিক্ষক ও কর্মকর্তা
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            দলভিত্তিক তালিকা — প্রোফাইল সম্পাদনা, হোমপেজ শোকেস ও ক্রম ব্যবস্থাপনা।
          </p>
        </div>
        <Link
          href="/admin/people/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus aria-hidden className="h-4 w-4" />
          নতুন প্রোফাইল
        </Link>
      </div>

      <form className="mt-6 flex flex-wrap gap-2" action="/admin/people" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="নাম দিয়ে খুঁজুন…"
          className="min-w-52 flex-1 rounded-lg border bg-card px-3.5 py-2 text-sm outline-none focus:border-primary/50"
        />
        <button type="submit" className="rounded-lg border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary">
          অনুসন্ধান
        </button>
      </form>

      <div className="mt-6">
        {/* key forces a clean remount when the server list changes (create/reorder) */}
        <TeamsManager key={teamRows.map((row) => `${row.id}:${row.sortOrder}`).join("|")} teams={teamRows} />
      </div>

      {people.length === 0 && ungrouped === 0 ? (
        <div className="mt-8 rounded-2xl border bg-card px-6 py-14 text-center">
          <p className="font-heading text-lg font-bold">কোনো প্রোফাইল পাওয়া যায়নি</p>
          <p className="mt-1 text-sm text-muted-foreground">{q ? "অনুসন্ধানের সাথে মিলে এমন কেউ নেই।" : "প্রথম প্রোফাইলটি তৈরি করুন।"}</p>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {grouped.map(({ team, people: members }) => (
            <section key={team.id}>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-base font-bold">{team.nameBn}</h2>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {formatNumber(members.length, "bn")}
                </span>
              </div>
              {members.length === 0 ? (
                <p className="mt-2 rounded-xl border border-dashed bg-card/50 px-4 py-5 text-center text-[13px] text-muted-foreground">
                  এই দলে এখনো কেউ নেই।
                </p>
              ) : (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {members.map((person) => (
                    <PersonRow key={person.id} person={person} />
                  ))}
                </div>
              )}
            </section>
          ))}

          {withoutTeam.length > 0 && (
            <section>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-base font-bold text-muted-foreground">দলহীন</h2>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {formatNumber(withoutTeam.length, "bn")}
                </span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {withoutTeam.map((person) => (
                  <PersonRow key={person.id} person={person} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function PersonRow({
  person,
}: {
  person: { id: string; slug: string; nameBn: string; titleBn: string; isFeatured: boolean; isPublished: boolean; sortOrder: number; photoMedia: { key: string } | null };
}) {
  return (
    <Link
      href={`/admin/people/${person.slug}`}
      className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm transition-colors hover:border-gold/50"
    >
      {person.photoMedia ? (
        <img src={`/api/media/${person.photoMedia.key}`} alt={person.nameBn} className="h-11 w-11 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {person.nameBn.slice(0, 1)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold">{person.nameBn}</p>
        <p className="truncate text-[11.5px] text-muted-foreground">{person.titleBn || "—"}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {person.isFeatured && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold">শোকেস</span>}
        <span className={cn("text-[10.5px] font-bold", person.isPublished ? "text-primary" : "text-muted-foreground")}>
          {person.isPublished ? "প্রকাশিত" : "ড্রাফট"}
        </span>
        <span className="text-[10.5px] text-muted-foreground">ক্রম {toBnDigits(person.sortOrder)}</span>
      </div>
      <Pencil aria-hidden className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    </Link>
  );
}
