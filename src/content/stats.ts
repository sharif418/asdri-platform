import type { StatItem } from "@/types";

/** Impact-at-a-glance figures from the official requirement document. */
export const instituteStats: StatItem[] = [
  {
    id: "total-students",
    value: 420,
    suffix: "+",
    label: { bn: "মোট শিক্ষার্থী", en: "Total Students" },
    icon: "students",
  },
  {
    id: "alem-students",
    value: 128,
    suffix: "+",
    label: { bn: "আলেম শিক্ষার্থী", en: "Alem (Scholar) Students" },
    icon: "scholar",
  },
  {
    id: "general-students",
    value: 102,
    suffix: "+",
    label: { bn: "জেনারেল শিক্ষার্থী", en: "General Stream Students" },
    icon: "general",
  },
  {
    id: "shortcourse-students",
    value: 190,
    suffix: "+",
    label: { bn: "স্বল্প মেয়াদী কোর্স", en: "Short-Term Course Students" },
    icon: "shortcourse",
  },
  {
    id: "currently-enrolled",
    value: 127,
    suffix: "",
    label: { bn: "বর্তমানে অধ্যয়নরত", en: "Currently Enrolled" },
    icon: "enrolled",
  },
  {
    id: "alumni",
    value: 293,
    suffix: "+",
    label: { bn: "সফল অ্যালামনাই", en: "Successful Alumni" },
    icon: "alumni",
  },
];

/** Core vision statement — used on home + about pages. */
export const visionStatement = {
  bn: "সমকালীন চিন্তাগত বিভ্রান্তি ও সামাজিক ফিতনাসমূহের মোকাবিলায় চিন্তাশীল, জ্ঞানসমৃদ্ধ ও কার্যকর দাওয়াহকর্মী ও গবেষক তৈরি করা। পাশাপাশি ইসলামের বিরুদ্ধে উত্থাপিত বিভিন্ন প্রশ্ন, আপত্তি ও অভিযোগের গবেষণালব্ধ ও যুক্তিনির্ভর জবাব প্রদান করে বুদ্ধিবৃত্তিক দাওয়াহকে শক্তিশালী করতে কাজ করে যাওয়া।",
  en: "Preparing thoughtful, knowledgeable, and effective dawah workers and researchers to address contemporary intellectual confusion and social fitnah — providing research-based, rational responses to misconceptions against Islam to strengthen intellectual dawah.",
};

export const corePillars = [
  {
    id: "pillar-quran-sunnah",
    title: { bn: "কুরআন-সুন্নাহভিত্তিক বুদ্ধিবৃত্তিক দাওয়াহ", en: "Authentic Quran-Sunnah-based Intellectual Dawah" },
    description: {
      bn: "বিশুদ্ধ আকীদা ও প্রামাণ্য জ্ঞানের আলোকে ইসলামের দাওয়াহকে যুক্তি ও গবেষণার ভিত্তিতে সুপ্রতিষ্ঠিত করা।",
      en: "Establishing the dawah of Islam upon authentic creed and evidential knowledge through reason and research.",
    },
    icon: "book-open",
  },
  {
    id: "pillar-bridge",
    title: { bn: "ঐতিহ্যবাহী ও আধুনিক জ্ঞানের সেতুবন্ধন", en: "Bridging Traditional & Modern Sciences" },
    description: {
      bn: "ঐতিহ্যবাহী ইসলামী শাস্ত্রের সঙ্গে মনোবিজ্ঞান, দর্শন, গণমাধ্যম প্রভৃতি আধুনিক শাস্ত্রের সমন্বয় ঘটানো।",
      en: "Integrating classical Islamic sciences with modern disciplines such as psychology, philosophy, and media.",
    },
    icon: "git-merge",
  },
  {
    id: "pillar-tarbiyah",
    title: { bn: "চারিত্রিক তারবিয়াহ, নেতৃত্ব ও সমাজ-সংযোগ", en: "Character Tarbiyah, Leadership & Engagement" },
    description: {
      bn: "শিক্ষার্থীদের নৈতিক গঠন, নেতৃত্বের গুণাবলি ও জনসংযোগ দক্ষতায় প্রস্তুত করে তোলা।",
      en: "Developing students' moral character, leadership qualities, and public engagement skills.",
    },
    icon: "sprout",
  },
] as const;
