/* Shared draft types for the course editor module (mirror the API payloads). */

export interface SubjectDraft {
  code: string;
  titleBn: string;
  titleEn: string;
  modulesBn: string;
  modulesEn: string;
  credits: number;
  marks: number;
  isNonCredit: boolean;
}

export interface SemesterDraft {
  number: number;
  year: number;
  titleBn: string;
  titleEn: string;
  durationBn: string;
  durationEn: string;
  subjects: SubjectDraft[];
}

export interface SpecDraft {
  nameBn: string;
  nameEn: string;
  nameAr: string;
}

export interface SdpDraft {
  titleBn: string;
  titleEn: string;
  objectiveBn: string;
  objectiveEn: string;
  activitiesBn: string;
  activitiesEn: string;
  hours: number;
  outcomeBn: string;
  outcomeEn: string;
}

export interface CourseMetaDraft {
  code: string;
  titleBn: string;
  titleEn: string;
  titleAr: string;
  taglineBn: string;
  taglineEn: string;
  overviewBn: string;
  overviewEn: string;
  objectivesBn: string;
  objectivesEn: string;
  eligibilityBn: string;
  eligibilityEn: string;
  careerBn: string;
  careerEn: string;
  durationBn: string;
  durationEn: string;
  courseTypeBn: string;
  courseTypeEn: string;
  seats: number | null;
  coverMediaId: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
}

export interface CourseEditorValues {
  id: string;
  slug: string;
  meta: CourseMetaDraft;
  semesters: SemesterDraft[];
  specializations: SpecDraft[];
  sdp: SdpDraft[];
}

/** Read the CSRF double-submit token for admin mutations. */
export function csrfHeader(): Record<string, string> {
  return { "x-csrf-token": document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "" };
}
