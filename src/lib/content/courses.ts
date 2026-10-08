import { db } from "@/lib/db";
import type { Course, CourseDetails, CourseKind, CurriculumCourse, CurriculumSemester, LocalizedText, SdpItem } from "@/types";

/**
 * DB → view-model adapters for courses. Pages keep consuming the same rich
 * shapes the approved design components expect; the data now lives in
 * PostgreSQL and is editable from the admin.
 */

interface DbSubject {
  code: string;
  titleBn: string;
  titleEn: string;
  modulesBn: string;
  modulesEn: string;
  credits: number;
  marks: number;
  hours: number | null;
  isNonCredit: boolean;
  sortOrder: number;
}

interface DbSemester {
  id: string;
  number: number;
  year: number;
  titleBn: string;
  titleEn: string;
  subjects: DbSubject[];
}

interface DbSpecialization {
  nameBn: string;
  nameEn: string;
  nameAr: string | null;
  sortOrder: number;
}

interface DbCourse {
  id: string;
  slug: string;
  code: string;
  titleBn: string;
  titleEn: string;
  titleAr: string | null;
  taglineBn: string;
  taglineEn: string;
  overviewBn: string;
  overviewEn: string;
  objectivesBn: string;
  objectivesEn: string;
  careerBn: string;
  careerEn: string;
  durationBn: string;
  durationEn: string;
  eligibilityBn: string;
  eligibilityEn: string;
  courseTypeBn: string;
  courseTypeEn: string;
  isFeatured: boolean;
  sortOrder: number;
  coverMedia: { key: string } | null;
  semesters: DbSemester[];
  specializations: DbSpecialization[];
}

const COURSE_INCLUDE = {
  coverMedia: { select: { key: true } },
  semesters: {
    orderBy: { number: "asc" as const },
    include: { subjects: { orderBy: { sortOrder: "asc" as const } } },
  },
  specializations: { orderBy: { sortOrder: "asc" as const } },
};

/** Course code → view kind + icon + accent gradient (seed's curation). */
const COURSE_STYLE: Record<string, { kind: CourseKind; icon: string; accentClass: string }> = {
  PYS: { kind: "flagship", icon: "graduation-cap", accentClass: "from-emerald-700 to-emerald-900" },
  CCIS: { kind: "certificate", icon: "scroll-text", accentClass: "from-amber-600 to-amber-800" },
  DDIS: { kind: "diploma", icon: "library-big", accentClass: "from-teal-700 to-emerald-900" },
  ATT: { kind: "training", icon: "languages", accentClass: "from-emerald-600 to-teal-800" },
  RDT: { kind: "training", icon: "mic-vocal", accentClass: "from-amber-700 to-emerald-900" },
  AZAN: { kind: "training", icon: "bell-ring", accentClass: "from-teal-600 to-emerald-800" },
  IRM: { kind: "training", icon: "flask-conical", accentClass: "from-emerald-800 to-teal-900" },
};

function courseStyle(code: string, isFeatured: boolean): { kind: CourseKind; icon: string; accentClass: string } {
  return COURSE_STYLE[code] ?? {
    kind: isFeatured ? "flagship" : "certificate",
    icon: "book-open",
    accentClass: "from-emerald-700 to-emerald-900",
  };
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function splitBilingualList(bnHtml: string, enHtml: string): LocalizedText[] {
  const bnItems = (bnHtml.match(/<li[^>]*>[\s\S]*?<\/li>/gi) ?? []).map(stripTags);
  const enItems = (enHtml.match(/<li[^>]*>[\s\S]*?<\/li>/gi) ?? []).map(stripTags);
  const len = Math.max(bnItems.length, enItems.length);
  const out: LocalizedText[] = [];
  for (let i = 0; i < len; i++) {
    out.push({ bn: bnItems[i] ?? "", en: enItems[i] ?? "" });
  }
  return out.filter((t) => t.bn || t.en);
}

function splitParagraphs(bnHtml: string, enHtml: string): LocalizedText[] {
  const bnItems = (bnHtml.match(/<p[^>]*>[\s\S]*?<\/p>/gi) ?? []).map(stripTags);
  const enItems = (enHtml.match(/<p[^>]*>[\s\S]*?<\/p>/gi) ?? []).map(stripTags);
  const len = Math.max(bnItems.length, enItems.length);
  const out: LocalizedText[] = [];
  for (let i = 0; i < len; i++) {
    out.push({ bn: bnItems[i] ?? "", en: enItems[i] ?? "" });
  }
  return out.filter((t) => t.bn || t.en);
}

function toViewCourse(row: DbCourse, sdp: SdpItem[]): Course {
  const [kindBn = "", accomBn = ""] = row.courseTypeBn.split("·").map((s) => s.trim());
  const [kindEn = "", accomEn = ""] = row.courseTypeEn.split("·").map((s) => s.trim());

  const curriculum: CurriculumSemester[] = row.semesters.map((sem) => {
    const isSupplementary = sem.titleBn.includes("সম্পূরক") || sem.titleEn.toLowerCase().includes("supplementary");
    const courses: CurriculumCourse[] = sem.subjects.map((subject) => ({
      code: subject.code,
      title: { bn: subject.titleBn, en: subject.titleEn },
      modules: subject.modulesBn
        .split("\n")
        .map((name, i) => ({
          name: {
            bn: name.trim(),
            en: (subject.modulesEn.split("\n")[i] ?? name).trim(),
          },
        }))
        .filter((m) => m.name.bn.length > 0),
      credits: subject.credits,
      marks: subject.marks,
    }));
    const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
    const totalMarks = courses.reduce((sum, c) => sum + c.marks, 0);
    return {
      label: { bn: sem.titleBn, en: sem.titleEn },
      note: isSupplementary
        ? {
            bn: "এই সম্পূরক কোর্সগুলো ভাষাগত, ডিজিটাল ও একাডেমিক দক্ষতা উন্নয়নের জন্য — প্রাতিষ্ঠানিকভাবে মূল্যায়ন হলেও চূড়ান্ত ক্রেডিট বা সিজিপিএ (CGPA)-তে যুক্ত হয় না।",
            en: "Supplementary courses build language, digital, and academic skills — institutionally assessed, but not counted toward final credits or CGPA.",
          }
        : null,
      totalCredits,
      totalMarks,
      courses,
    };
  });

  const details: CourseDetails = {
    intro: { bn: row.overviewBn, en: row.overviewEn },
    objectives: splitBilingualList(row.objectivesBn, row.objectivesEn),
    kind: { bn: kindBn, en: kindEn },
    duration: { bn: row.durationBn, en: row.durationEn },
    accommodation: { bn: accomBn, en: accomEn },
    eligibility: splitBilingualList(row.eligibilityBn, row.eligibilityEn),
    curriculum,
    extraSections:
      row.specializations.length > 0
        ? [
            {
              title: { bn: "তাখাসসুস বিভাগসমূহ", en: "Specialization Departments" },
              body: [
                {
                  bn: "প্রস্তুতিমূলক বর্ষ ও ফলাফলের ভিত্তিতে চূড়ান্ত বিভাগ নির্বাচন করা হয়। নির্বাচিত বিভাগে ২ বছর মেয়াদী উচ্চশিক্ষা কোর্স করা যায়।",
                  en: "The final department is selected based on the preparatory year results; a 2-year advanced program follows in the chosen department.",
                },
              ],
            },
          ]
        : [],
    outcomes: splitParagraphs(row.careerBn, row.careerEn),
  };

  return {
    slug: row.slug,
    titleBn: row.titleBn,
    titleEn: row.titleEn,
    titleAr: row.titleAr ?? undefined,
    ...courseStyle(row.code, row.isFeatured),
    tagline: { bn: row.taglineBn, en: row.taglineEn },
    summary: { bn: row.overviewBn, en: row.overviewEn },
    durationLabel: { bn: row.durationBn, en: row.durationEn },
    eligibilityLabel: { bn: stripTags(row.eligibilityBn).slice(0, 80), en: stripTags(row.eligibilityEn).slice(0, 80) },
    featured: row.isFeatured,
    details,
    code: row.code,
    coverUrl: row.coverMedia ? `/api/media/${row.coverMedia.key}` : undefined,
    sdp,
    specializations: row.specializations.map((z) => ({ bn: z.nameBn, en: z.nameEn, ar: z.nameAr ?? undefined })),
  };
}

export async function getCourses(): Promise<Course[]> {
  const rows = await db.course.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
    include: COURSE_INCLUDE,
  });
  return rows.map((row) => toViewCourse(row, []));
}

export async function getFeaturedCourses(): Promise<Course[]> {
  const rows = await db.course.findMany({
    where: { isPublished: true, isFeatured: true },
    orderBy: { sortOrder: "asc" },
    include: COURSE_INCLUDE,
  });
  return rows.map((row) => toViewCourse(row, []));
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const row = await db.course.findUnique({ where: { slug }, include: COURSE_INCLUDE });
  if (!row || !row.isPublished) return null;
  return toViewCourse(row, await loadSdp(row.id));
}

/**
 * Preview variant (round 11): by id, bypasses the isPublished gate — the
 * course editor mints a signed /preview/<token> link and the draft renders
 * through the SAME view-model + components as the public page. Reached only
 * through that link; never linked from any public route.
 */
export async function getCourseForPreview(id: string): Promise<Course | null> {
  const row = await db.course.findUnique({ where: { id }, include: COURSE_INCLUDE });
  if (!row) return null;
  return toViewCourse(row, await loadSdp(row.id));
}

/** SDP rows for one course, in office order (shared by slug + preview loaders). */
async function loadSdp(courseId: string): Promise<SdpItem[]> {
  const sdpRows = await db.sdpProgram.findMany({
    where: { courseId },
    orderBy: { sortOrder: "asc" },
    select: { titleBn: true, titleEn: true, objectiveBn: true, objectiveEn: true, activitiesBn: true, activitiesEn: true, hours: true, outcomeBn: true, outcomeEn: true },
  });
  return sdpRows.map((s) => ({
    title: { bn: s.titleBn, en: s.titleEn },
    objective: { bn: s.objectiveBn, en: s.objectiveEn },
    activities: { bn: s.activitiesBn, en: s.activitiesEn },
    hours: s.hours,
    outcome: { bn: s.outcomeBn, en: s.outcomeEn },
  }));
}

/** Total credits + marks across a course's credit-bearing semesters. */
export function courseTotals(course: Course): { credits: number; marks: number } {
  let credits = 0;
  let marks = 0;
  for (const sem of course.details.curriculum) {
    credits += sem.totalCredits;
    marks += sem.totalMarks;
  }
  return { credits, marks };
}

/** Student Development Programs — mandatory, non-credit activities. */
export async function getSdpPrograms(): Promise<SdpItem[]> {
  const rows = await db.sdpProgram.findMany({
    where: { courseId: { not: null } },
    orderBy: { sortOrder: "asc" },
    select: {
      titleBn: true,
      titleEn: true,
      objectiveBn: true,
      objectiveEn: true,
      activitiesBn: true,
      activitiesEn: true,
      hours: true,
      outcomeBn: true,
      outcomeEn: true,
    },
  });
  return rows.map((row) => ({
    title: { bn: row.titleBn, en: row.titleEn || row.titleBn },
    objective: { bn: row.objectiveBn, en: row.objectiveEn || row.objectiveBn },
    activities: { bn: row.activitiesBn, en: row.activitiesEn || row.activitiesBn },
    hours: row.hours,
    outcome: { bn: row.outcomeBn, en: row.outcomeEn || row.outcomeBn },
  }));
}
