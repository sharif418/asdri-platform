import type { Course } from "@/types";
import { pys } from "./pys";
import { ccis, diploma } from "./ccis-diploma";
import { arabicTeacherTraining, azanTraining, ramadanTraining, researchMethodology } from "./trainings";

/** The complete course catalog (order = display order). */
export const courses: Course[] = [
  pys,
  ccis,
  diploma,
  arabicTeacherTraining,
  ramadanTraining,
  azanTraining,
  researchMethodology,
];

export function getCourse(slug: string): Course | undefined {
  return courses.find((c) => c.slug === slug);
}

export const featuredCourses: Course[] = courses.filter((c) => c.featured);

/** Student Development Program (SDP) activities — non-credit, mandatory. */
export const studentDevelopmentPrograms = [
  {
    id: "sdp-tarbiyah",
    title: { bn: "তারবিয়াহ সেশন", en: "Tarbiyah Sessions" },
    objective: { bn: "চারিত্রিক গঠন ও আধ্যাত্মিক বিকাশ", en: "Character building & spiritual growth" },
    activities: { bn: "সাপ্তাহিক আলোচনা, আত্মসমীক্ষা", en: "Weekly talk, reflection" },
    hours: 30,
    outcome: { bn: "নৈতিক উন্নয়ন", en: "Moral development" },
  },
  {
    id: "sdp-short-courses",
    title: { bn: "শর্ট কোর্স", en: "Short Courses" },
    objective: { bn: "দক্ষতা বৃদ্ধি", en: "Skill enhancement" },
    activities: { bn: "ওয়ার্কশপ, অ্যাসাইনমেন্ট", en: "Workshops, assignments" },
    hours: 40,
    outcome: { bn: "ব্যবহারিক দক্ষতা", en: "Practical skills" },
  },
  {
    id: "sdp-seminars",
    title: { bn: "সেমিনার ও ওয়ার্কশপ", en: "Seminars & Workshops" },
    objective: { bn: "বিশেষজ্ঞদের সান্নিধ্যে আসা", en: "Exposure to experts" },
    activities: { bn: "অতিথি বক্তৃতা, আলোচনা", en: "Guest lecture, discussion" },
    hours: 10,
    outcome: { bn: "জ্ঞান বিস্তার", en: "Knowledge expansion" },
  },
  {
    id: "sdp-cocurricular",
    title: { bn: "সহ-শিক্ষা কার্যক্রম", en: "Co-Curricular Activities" },
    objective: { bn: "নেতৃত্ব ও দলগত কাজ", en: "Leadership & teamwork" },
    activities: { bn: "গ্রুপ ওয়ার্ক, ইভেন্ট", en: "Group work, events" },
    hours: 50,
    outcome: { bn: "সফট স্কিল", en: "Soft skills" },
  },
  {
    id: "sdp-reading",
    title: { bn: "বাধ্যতামূলক পাঠ", en: "Mandatory Reading" },
    objective: { bn: "পড়ার অভ্যাস গঠন", en: "Reading habit development" },
    activities: { bn: "বই পাঠ, রিভিউ", en: "Book reading, review" },
    hours: 20,
    outcome: { bn: "সমালোচনামূলক চিন্তা", en: "Critical thinking" },
  },
  {
    id: "sdp-service",
    title: { bn: "কমিউনিটি সার্ভিস", en: "Community Service" },
    objective: { bn: "সামাজিক দায়িত্ববোধ", en: "Social responsibility" },
    activities: { bn: "ফিল্ড ওয়ার্ক, স্বেচ্ছাসেবা", en: "Field work, volunteering" },
    hours: 30,
    outcome: { bn: "নাগরিক সংযোগ", en: "Civic engagement" },
  },
] as const;

export { pys, ccis, diploma, arabicTeacherTraining, ramadanTraining, azanTraining, researchMethodology };
