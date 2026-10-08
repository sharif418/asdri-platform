import { db } from "@/lib/db";
import type { Lang } from "@/lib/locale";
import { pick } from "@/types";

/**
 * Alumni data layer (round-9 restore of the round-6 module).
 *
 * Three read surfaces, three scopes:
 *   - admin registry list  — admissions officers see everything
 *   - public directory     — isPublished rows ONLY, and the select is
 *                            contact-free BY CONSTRUCTION (privacy-by-default:
 *                            the public layer cannot leak what it never reads)
 *   - portal self view     — the one row linked to the signed-in alumnus
 */

export const ALUMNI_COURSE_LABELS: Record<string, { bn: string; en: string }> = {
  PYS: { bn: "প্রি-পারেটরি ইয়ার (PYS)", en: "Preparatory Year (PYS)" },
  PGDID: { bn: "পোস্ট গ্র্যাজুয়েট ডিপ্লোমা (PGDID)", en: "Post Graduate Diploma (PGDID)" },
  CCIS: { bn: "সার্টিফিকেট কোর্স (CCIS)", en: "Certificate Course (CCIS)" },
  ATT: { bn: "আরবি ভাষা শিক্ষক প্রশিক্ষণ (ATT)", en: "Arabic Teacher Training (ATT)" },
};

export function alumniCourseLabel(courseKey: string, lang: Lang): string {
  return pick(ALUMNI_COURSE_LABELS[courseKey] ?? { bn: courseKey, en: courseKey }, lang);
}

/**
 * The next office handle — AL-<year>-<NNNN> over the existing count, so the
 * officer never invents one. Races are impossible in practice (single office
 * writer) and the unique index guards the rest.
 */
export async function nextAlumniRegistryNo(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `AL-${year}-`;
  const latest = await db.alumniProfile.findFirst({
    where: { registryNo: { startsWith: prefix } },
    orderBy: { registryNo: "desc" },
    select: { registryNo: true },
  });
  const lastSeq = latest ? Number.parseInt(latest.registryNo.slice(prefix.length), 10) : 0;
  return `${prefix}${String(lastSeq + 1).padStart(4, "0")}`;
}

/** Fields the public directory may ever read — no contact, no address. */
const DIRECTORY_SELECT = {
  id: true,
  registryNo: true,
  nameBn: true,
  nameEn: true,
  courseKey: true,
  batchYear: true,
  batchNoBn: true,
  occupationBn: true,
  occupationEn: true,
  organizationBn: true,
  organizationEn: true,
  districtBn: true,
  districtEn: true,
} as const;

export type AlumniDirectoryRow = {
  id: string;
  registryNo: string;
  nameBn: string;
  nameEn: string;
  courseKey: string;
  batchYear: number;
  batchNoBn: string;
  occupationBn: string;
  occupationEn: string;
  organizationBn: string;
  organizationEn: string;
  districtBn: string;
  districtEn: string;
};

export type AlumniDirectoryFacet = { courseKey: string; count: number };

export interface AlumniDirectoryResult {
  rows: AlumniDirectoryRow[];
  facets: AlumniDirectoryFacet[];
  total: number;
  page: number;
  pageCount: number;
}

const DIRECTORY_PAGE_SIZE = 12;

/** The public directory: published rows only, contact-free select, facets + paging. */
export async function getAlumniDirectory(params: {
  q?: string;
  course?: string;
  page?: number;
}): Promise<AlumniDirectoryResult> {
  const page = Math.max(1, params.page ?? 1);
  const q = params.q?.trim() ?? "";

  const where = {
    isPublished: true,
    ...(params.course ? { courseKey: params.course } : {}),
    ...(q
      ? {
          OR: [
            { nameBn: { contains: q } },
            { nameEn: { contains: q, mode: "insensitive" as const } },
            { organizationBn: { contains: q } },
            { organizationEn: { contains: q, mode: "insensitive" as const } },
            { districtBn: { contains: q } },
            { districtEn: { contains: q, mode: "insensitive" as const } },
            { registryNo: { contains: q } },
          ],
        }
      : {}),
  };

  const [total, facetGroups, rows] = await Promise.all([
    db.alumniProfile.count({ where }),
    db.alumniProfile.groupBy({
      by: ["courseKey"],
      where: { isPublished: true },
      _count: { _all: true },
    }),
    db.alumniProfile.findMany({
      where,
      orderBy: [{ batchYear: "desc" }, { nameBn: "asc" }],
      select: DIRECTORY_SELECT,
      skip: (page - 1) * DIRECTORY_PAGE_SIZE,
      take: DIRECTORY_PAGE_SIZE,
    }),
  ]);

  return {
    rows,
    facets: facetGroups
      .map((group) => ({ courseKey: group.courseKey, count: group._count._all }))
      .sort((a, b) => b.count - a.count),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / DIRECTORY_PAGE_SIZE)),
  };
}

/**
 * The signed-in alumnus's own row: the linked profile, or — before the office
 * links an account — the still-unclaimed row carrying this user's email (the
 * same claim rule the self-update API applies, so the card and the form always
 * describe the same row).
 */
export async function getAlumniSelf(userId: string) {
  const linked = await db.alumniProfile.findUnique({ where: { userId }, include: { user: { select: { email: true } } } });
  if (linked) return linked;
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) return null;
  return db.alumniProfile.findFirst({
    where: { userId: null, email: user.email },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { email: true } } },
  });
}
