import { db } from "@/lib/db";
import { getAboutContent, getAlumniIntro as getAlumniIntroSetting } from "@/lib/settings";
import type { LocalizedText } from "@/types";

/**
 * DB → view-model adapters for the About pages. All long-form copy lives in
 * the `site.about` setting (seeded from src/content/about.ts); alumni batch
 * statistics live in the AlumniBatch table grouped by program note.
 */

interface SettingEntry {
  id: string;
  icon: string;
  title: { bn: string; en: string };
  description: { bn: string; en: string };
}

function toEntryList(entries: SettingEntry[]): { id: string; icon: string; title: LocalizedText; description: LocalizedText }[] {
  return entries.map((entry) => ({
    id: entry.id,
    icon: entry.icon,
    title: { bn: entry.title.bn, en: entry.title.en || entry.title.bn },
    description: { bn: entry.description.bn, en: entry.description.en || entry.description.bn },
  }));
}

/** Institute introduction — top of the About page. */
export async function getInstituteIntro(): Promise<LocalizedText[]> {
  const about = await getAboutContent();
  return about.intro.map((p) => ({ bn: p.bn, en: p.en || p.bn }));
}

/** The 14 objectives from the requirement document. */
export async function getObjectivesList(): Promise<LocalizedText[]> {
  const about = await getAboutContent();
  return about.objectives.map((p) => ({ bn: p.bn, en: p.en || p.bn }));
}

/** Campus & facilities intro copy. */
export async function getCampusIntro(): Promise<LocalizedText> {
  const about = await getAboutContent();
  return { bn: about.campusIntro.bn, en: about.campusIntro.en || about.campusIntro.bn };
}

/** Organizational structure — leadership & administration page. */
export async function getOrgStructure(): Promise<ReturnType<typeof toEntryList>> {
  const about = await getAboutContent();
  return toEntryList(about.orgStructure);
}

/** Alumni engagement highlights. */
export async function getAlumniEngagement(): Promise<ReturnType<typeof toEntryList>> {
  const about = await getAboutContent();
  return toEntryList(about.alumniEngagement);
}

/** Alumni intro paragraph (site.alumni setting). */
export async function getAlumniIntro(): Promise<LocalizedText> {
  const alumni = await getAlumniIntroSetting();
  return { bn: alumni.introBn, en: alumni.introEn || alumni.introBn };
}

/** Alumni batches grouped by program (the note carries the program title). */
export async function getAlumniBatches(): Promise<
  { program: LocalizedText; batches: { batch: LocalizedText; count: number }[] }[]
> {
  const rows = await db.alumniBatch.findMany({
    orderBy: { year: "asc" },
    select: { courseKey: true, year: true, batchNoBn: true, batchNoEn: true, count: true, noteBn: true, noteEn: true },
  });
  const groups = new Map<string, { program: LocalizedText; batches: { batch: LocalizedText; count: number }[] }>();
  for (const row of rows) {
    const programBn = row.noteBn || row.courseKey;
    const programEn = row.noteEn || row.noteBn || row.courseKey;
    const key = programBn;
    const group = groups.get(key) ?? { program: { bn: programBn, en: programEn }, batches: [] };
    group.batches.push({
      batch: { bn: row.batchNoBn, en: row.batchNoEn || row.batchNoBn },
      count: row.count,
    });
    groups.set(key, group);
  }
  return [...groups.values()];
}
