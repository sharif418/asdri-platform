import { db } from "@/lib/db";
import { stripTags } from "@/lib/content/html";
import type { FacultyGroup, FacultyMember, LeadershipMember, LocalizedText } from "@/types";

/**
 * DB → view-model adapters for people. Teams come from the Team table
 * (teachers-panel, arabic-team, tajweed-team, language-support); leadership is
 * the `leadership` team (featured people belong there too).
 */

const FACULTY_TEAM_KEYS = ["teachers-panel", "arabic-team", "tajweed-team", "language-support"] as const;

const CATEGORY_BY_TEAM: Record<string, FacultyMember["category"]> = {
  "teachers-panel": "teacher",
  "arabic-team": "language",
  "tajweed-team": "tajweed",
  "language-support": "language",
};

interface DbPerson {
  id: string;
  slug: string;
  nameBn: string;
  nameEn: string;
  titleBn: string;
  titleEn: string;
  roleTitleBn: string;
  roleTitleEn: string;
  bioBn: string;
  bioEn: string;
  subjectsBn: string;
  subjectsEn: string;
  isFeatured: boolean;
  sortOrder: number;
  team: { key: string; nameBn: string; nameEn: string; descriptionBn: string; descriptionEn: string } | null;
}

const PERSON_SELECT = {
  id: true,
  slug: true,
  nameBn: true,
  nameEn: true,
  titleBn: true,
  titleEn: true,
  roleTitleBn: true,
  roleTitleEn: true,
  bioBn: true,
  bioEn: true,
  subjectsBn: true,
  subjectsEn: true,
  isFeatured: true,
  sortOrder: true,
  team: { select: { key: true, nameBn: true, nameEn: true, descriptionBn: true, descriptionEn: true } },
} as const;

function toLocalized(bn: string, en: string): LocalizedText {
  return { bn, en: en || bn };
}

/** subjectsBn/En are comma-joined lists — split them back into pairs. */
function toSubjects(bn: string, en: string): LocalizedText[] {
  const bnItems = bn ? bn.split(/[,;]/).map((s) => s.trim()).filter(Boolean) : [];
  const enItems = en ? en.split(/[,;]/).map((s) => s.trim()).filter(Boolean) : [];
  const len = Math.max(bnItems.length, enItems.length);
  const out: LocalizedText[] = [];
  for (let i = 0; i < len; i++) {
    out.push({ bn: bnItems[i] ?? "", en: enItems[i] ?? "" });
  }
  return out.filter((t) => t.bn || t.en);
}

function designationOf(person: DbPerson): LocalizedText {
  const bn = person.roleTitleBn || person.titleBn;
  const en = person.roleTitleEn || person.titleEn;
  return toLocalized(bn, en);
}

function initialsOf(nameBn: string): string {
  const trimmed = nameBn.trim();
  return trimmed ? trimmed.charAt(0) : "?";
}

/** Institute leadership & administration (leadership team / featured people). */
export async function getLeadershipTeam(): Promise<LeadershipMember[]> {
  const rows = await db.person.findMany({
    where: {
      isPublished: true,
      OR: [{ team: { key: "leadership" } }, { isFeatured: true }],
    },
    orderBy: { sortOrder: "asc" },
    select: PERSON_SELECT,
  });
  return rows.map((row) => ({
    id: row.slug,
    name: toLocalized(row.nameBn, row.nameEn),
    role: designationOf(row),
    bio: row.bioBn || row.bioEn
      ? toLocalized(stripTags(row.bioBn), stripTags(row.bioEn))
      : null,
    initials: initialsOf(row.nameBn),
  }));
}

/** Teacher's panel, Arabic team, Tajweed team, and language departments. */
export async function getFacultyGroups(): Promise<FacultyGroup[]> {
  const [teams, people] = await Promise.all([
    db.team.findMany({
      where: { key: { in: [...FACULTY_TEAM_KEYS] }, isPublished: true },
      orderBy: { sortOrder: "asc" },
      select: { key: true, nameBn: true, nameEn: true, descriptionBn: true, descriptionEn: true },
    }),
    db.person.findMany({
      where: { isPublished: true, team: { key: { in: [...FACULTY_TEAM_KEYS] } } },
      orderBy: { sortOrder: "asc" },
      select: PERSON_SELECT,
    }),
  ]);

  const byKey = new Map<string, { title: LocalizedText; subtitle: LocalizedText | null; members: FacultyMember[] }>();
  for (const team of teams) {
    byKey.set(team.key, {
      title: toLocalized(team.nameBn, team.nameEn),
      subtitle: team.descriptionBn || team.descriptionEn ? toLocalized(team.descriptionBn, team.descriptionEn) : null,
      members: [],
    });
  }
  for (const person of people) {
    const teamKey = person.team?.key;
    if (!teamKey) continue;
    const group = byKey.get(teamKey);
    if (!group) continue;
    group.members.push({
      id: person.slug,
      name: toLocalized(person.nameBn, person.nameEn),
      designation: designationOf(person),
      subjects: toSubjects(person.subjectsBn, person.subjectsEn),
      category: CATEGORY_BY_TEAM[teamKey] ?? "teacher",
    });
  }
  return [...byKey.entries()].map(([key, group]) => ({ id: key, ...group }));
}
