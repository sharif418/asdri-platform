import { db } from "@/lib/db";
import { rotateFallback, splitParagraphs } from "@/lib/content/html";
import type { AdmissionStep, FaqGroup, LocalizedText } from "@/types";

/**
 * DB → view-model adapters for the admissions pages: the 5-step process,
 * scholarship copy, campus facilities, campus-life band (sortOrder ≥ 100) and
 * the FAQ groups (Faq rows grouped by category).
 */

const CAMPUS_ICONS: { icon: string; test: RegExp }[] = [
  { icon: "messages-square", test: /বুদ্ধি|চর্চা|debate|intellectual/i },
  { icon: "presentation", test: /সেমিনার|ওয়ার্কশপ|seminar/i },
  { icon: "book-open-check", test: /পাঠচক্র|study|circle/i },
  { icon: "map-pinned", test: /ফিল্ডওয়ার্ক|field/i },
  { icon: "volleyball", test: /শরীরচর্চা|খেলা|সফর|sport|tour/i },
  { icon: "award", test: /নেতৃত্ব|leadership|দক্ষতা/i },
];

const FACILITY_ICONS: { icon: string; test: RegExp }[] = [
  { icon: "bed-double", test: /আবাসিক|residential/i },
  { icon: "library", test: /লাইব্রেরি|library/i },
  { icon: "notebook-pen", test: /আমলি|ট্র্যাকার|tracker/i },
  { icon: "moon-star", test: /আধ্যাত্মিক|spiritual/i },
];

function iconFor(tests: { icon: string; test: RegExp }[], fallback: string, haystack: string): string {
  return tests.find((entry) => entry.test.test(haystack))?.icon ?? fallback;
}

/** Fallback images for campus-life cards without an attached image. */
const CAMPUS_FALLBACKS = [
  "/images/student-debate.png",
  "/images/campus-seminar.png",
  "/images/study-circle.png",
  "/images/campus-fieldwork.png",
  "/images/campus-mosque.png",
  "/images/campus-graduation.png",
] as const;

/** The structured 5-step admission process. */
export async function getAdmissionSteps(): Promise<AdmissionStep[]> {
  const rows = await db.admissionStep.findMany({
    where: { isPublished: true },
    orderBy: { stepNumber: "asc" },
    select: { stepNumber: true, titleBn: true, titleEn: true, descriptionBn: true, descriptionEn: true },
  });
  return rows.map((row) => ({
    step: row.stepNumber,
    title: { bn: row.titleBn, en: row.titleEn || row.titleBn },
    description: { bn: row.descriptionBn, en: row.descriptionEn || row.descriptionBn },
  }));
}

/** Scholarship & financial aid copy (description + criteria paragraphs). */
export async function getScholarshipInfo(): Promise<{ headline: LocalizedText; body: LocalizedText[] }> {
  const row = await db.scholarship.findFirst({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
    select: { nameBn: true, nameEn: true, descriptionBn: true, descriptionEn: true, criteriaBn: true, criteriaEn: true },
  });
  if (!row) return { headline: { bn: "", en: "" }, body: [] };
  return {
    headline: { bn: row.nameBn, en: row.nameEn || row.nameBn },
    body: [
      ...splitParagraphs(row.descriptionBn, row.descriptionEn),
      ...splitParagraphs(row.criteriaBn, row.criteriaEn),
    ],
  };
}

/** Core facilities (residential, library, tracker, spiritual environment). */
export async function getFacilities(): Promise<
  { id: string; title: LocalizedText; description: LocalizedText; icon: string }[]
> {
  const rows = await db.facility.findMany({
    where: { isPublished: true, sortOrder: { lt: 100 } },
    orderBy: { sortOrder: "asc" },
    select: { id: true, titleBn: true, titleEn: true, descriptionBn: true, descriptionEn: true },
  });
  return rows.map((row) => ({
    id: row.id,
    title: { bn: row.titleBn, en: row.titleEn || row.titleBn },
    description: { bn: row.descriptionBn, en: row.descriptionEn || row.descriptionBn },
    icon: iconFor(FACILITY_ICONS, "school", `${row.titleBn} ${row.titleEn}`),
  }));
}

/** Campus-life highlights (the sortOrder ≥ 100 band on Facility). */
export async function getCampusLifeItems(): Promise<
  { id: string; title: LocalizedText; description: LocalizedText; image: string; icon: string }[]
> {
  const rows = await db.facility.findMany({
    where: { isPublished: true, sortOrder: { gte: 100 } },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      titleBn: true,
      titleEn: true,
      descriptionBn: true,
      descriptionEn: true,
      imageMedia: { select: { key: true } },
    },
  });
  return rows.map((row, index) => ({
    id: row.id,
    title: { bn: row.titleBn, en: row.titleEn || row.titleBn },
    description: { bn: row.descriptionBn, en: row.descriptionEn || row.descriptionBn },
    image: row.imageMedia ? `/api/media/${row.imageMedia.key}` : rotateFallback(CAMPUS_FALLBACKS, index),
    icon: iconFor(CAMPUS_ICONS, "messages-square", `${row.titleBn} ${row.titleEn}`),
  }));
}

/** FAQ groups, grouped by the Faq category columns (first-seen order). */
export async function getFaqGroups(): Promise<FaqGroup[]> {
  const rows = await db.faq.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
    select: {
      categoryBn: true,
      categoryEn: true,
      questionBn: true,
      questionEn: true,
      answerBn: true,
      answerEn: true,
    },
  });
  const groups = new Map<string, FaqGroup>();
  for (const row of rows) {
    const key = row.categoryBn || row.categoryEn;
    const group = groups.get(key) ?? {
      id: key ? `faq-${key}` : "faq-general",
      title: { bn: row.categoryBn || "সাধারণ", en: row.categoryEn || row.categoryBn || "General" },
      items: [],
    };
    group.items.push({
      question: { bn: row.questionBn, en: row.questionEn || row.questionBn },
      answer: { bn: row.answerBn, en: row.answerEn || row.answerBn },
    });
    groups.set(key, group);
  }
  return [...groups.values()];
}
