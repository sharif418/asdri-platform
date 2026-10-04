import type { Course, CurriculumSemester } from "@/types";

/* ————— PYS: Preparatory Year for Specialization ————— */

const pysSemester1: CurriculumSemester = {
  label: { bn: "১ম সেমিস্টার (মূল কোর্স)", en: "Semester 1 (Core Courses)" },
  note: {
    bn: "মূল কোর্সগুলো এই শিক্ষাক্রমের প্রধান একাডেমিক ভিত্তি। এগুলো নির্দিষ্ট একাডেমিক ক্রেডিট বহন করে, যা মোট ক্রেডিট ও সিজিপিএ (CGPA) অর্জনে ভূমিকা রাখে।",
    en: "Core courses form the primary academic foundation of this program, carrying academic credits that count toward the CGPA.",
  },
  totalCredits: 17,
  totalMarks: 600,
  courses: [
    {
      code: "PYS 1101",
      title: { bn: "ইসলাম ও দাওয়াহ", en: "Islam and Da'wah" },
      modules: [
        { name: { bn: "ইসলামের পরিচিতি", en: "Introduction to Islam" } },
        { name: { bn: "দাওয়াহর পরিচিতি", en: "Introduction to Da'wah" } },
      ],
      credits: 3,
      marks: 100,
    },
    {
      code: "PYS 1102",
      title: { bn: "ইসলামী শাস্ত্রের পরিচিতি", en: "Introduction to Islamic Sciences" },
      modules: [
        { name: { bn: "উলুমুল কুরআন", en: "Ulumul Quran" } },
        { name: { bn: "উলুমুল হাদীস", en: "Ulumul Hadith" } },
        { name: { bn: "উসুলুল ফিকহ", en: "Usulul Fiqh" } },
      ],
      credits: 3,
      marks: 100,
    },
    {
      code: "PYS 1103",
      title: { bn: "ইসলামের ইতিহাস ও সভ্যতা", en: "Islamic History and Civilization" },
      modules: [
        { name: { bn: "দক্ষিণ এশিয়ায় ইসলাম", en: "Islam in South Asia" } },
        { name: { bn: "ইসলামী সভ্যতার বুদ্ধিবৃত্তিক ইতিহাস", en: "Intellectual History of Islamic Civilization" } },
      ],
      credits: 3,
      marks: 100,
    },
    {
      code: "PYS 1104",
      title: { bn: "মিডিয়া ও সমাজ", en: "Media and Society" },
      modules: [
        { name: { bn: "বৈশ্বিক রাজনৈতিক প্রেক্ষাপটে মিডিয়া ও সাংবাদিকতা", en: "Media and Journalism in Global Political Context" } },
        { name: { bn: "বিশ্ব সভ্যতা ও সংস্কৃতি", en: "World Civilizations and Cultures" } },
        { name: { bn: "রাষ্ট্রবিজ্ঞান ও আন্তর্জাতিক সম্পর্কের ভিত্তি", en: "Foundation of Politics & International Relations" } },
        { name: { bn: "আইনি ব্যবস্থা ও সাধারণ আইনশাস্ত্র", en: "Legal Systems & General Jurisprudence" } },
      ],
      credits: 4,
      marks: 100,
    },
    {
      code: "PYS 1105",
      title: { bn: "সমালোচনামূলক পাঠ (ক্রিটিক্যাল রিডিং)", en: "Critical Reading" },
      modules: [{ name: { bn: "সমালোচনামূলক পাঠ পদ্ধতি", en: "Critical Reading" } }],
      credits: 4,
      marks: 100,
    },
  ],
};

const pysSemester2: CurriculumSemester = {
  label: { bn: "২য় সেমিস্টার (মূল কোর্স)", en: "Semester 2 (Core Courses)" },
  note: null,
  totalCredits: 17,
  totalMarks: 600,
  courses: [
    {
      code: "PYS 1201",
      title: { bn: "মানব ও সামাজিক ব্যবস্থা", en: "Human and Social Systems" },
      modules: [
        { name: { bn: "মনোবিজ্ঞান", en: "Psychology" } },
        { name: { bn: "সমাজবিজ্ঞান", en: "Sociology" } },
        { name: { bn: "অর্থনীতি ও ইসলামী অর্থায়ন", en: "Economics & Islamic Finance" } },
        { name: { bn: "ইসলামী শাসনতন্ত্র (সিয়াসাহ শারইয়্যাহ)", en: "Islamic Governance (Siyasah Shar'iyyah)" } },
      ],
      credits: 4,
      marks: 100,
    },
    {
      code: "PYS 1202",
      title: { bn: "দর্শন ও ধর্ম", en: "Philosophy and Religion" },
      modules: [
        { name: { bn: "দর্শনের পরিচিতি", en: "Introduction to Philosophy" } },
        { name: { bn: "আধুনিক মতাদর্শ ও চিন্তাপ্রবাহ", en: "Modern Ideologies & Intellectual Trends" } },
        { name: { bn: "তুলনামূলক ধর্মতত্ত্বের ভিত্তি", en: "Foundation of Comparative Religion" } },
      ],
      credits: 3,
      marks: 100,
    },
    {
      code: "PYS 1203",
      title: { bn: "বেসিক সায়েন্স", en: "Basic Science" },
      modules: [
        {
          name: {
            bn: "পদার্থ, রসায়ন, জীববিজ্ঞান, জ্যোতির্বিজ্ঞান, পরিবেশবিজ্ঞান, আবহাওয়াবিজ্ঞান, বিদ্যুৎ ও আইসিটি",
            en: "Physics, Chemistry, Biology, Astronomy, Environmental Science, Meteorology, Electricity, ICT",
          },
        },
      ],
      credits: 4,
      marks: 100,
    },
    {
      code: "PYS 1204",
      title: { bn: "রিসার্চ মেথডোলজি", en: "Research Methodology" },
      modules: [{ name: { bn: "গবেষণা পদ্ধতিবিদ্যা", en: "Research Methodology" } }],
      credits: 4,
      marks: 100,
    },
    {
      code: "PYS 1205",
      title: { bn: "ভাইভা", en: "Viva" },
      modules: [],
      credits: 2,
      marks: 100,
    },
  ],
};

const pysSupplementary: CurriculumSemester = {
  label: { bn: "সম্পূরক কোর্স (নন-ক্রেডিট, বাধ্যতামূলক)", en: "Supplementary Courses (Non-credit, Mandatory)" },
  note: {
    bn: "শিক্ষার্থীদের ভাষাগত, ডিজিটাল, গাণিতিক ও একাডেমিক দক্ষতা উন্নয়নের কোর্স। ফলাফল চূড়ান্ত ক্রেডিট বা সিজিপিএতে যুক্ত হয় না।",
    en: "Skill-development courses; institutionally assessed but not counted toward the final CGPA.",
  },
  totalCredits: 0,
  totalMarks: 500,
  courses: [
    {
      code: "PYS 1001",
      title: { bn: "ইংরেজি ভাষা (২০০ ঘণ্টা)", en: "English Language (200 hrs)" },
      modules: [],
      credits: 0,
      marks: 200,
    },
    {
      code: "PYS 1002",
      title: { bn: "বেসিক কম্পিউটার (১০০ ঘণ্টা)", en: "Basic Computer, MS Office (100 hrs)" },
      modules: [],
      credits: 0,
      marks: 100,
    },
    {
      code: "PYS 1003",
      title: { bn: "বেসিক গণিত (১০০ ঘণ্টা)", en: "Basic Mathematics (100 hrs)" },
      modules: [],
      credits: 0,
      marks: 100,
    },
    {
      code: "PYS 1004",
      title: { bn: "বাংলা ভাষা (১০০ ঘণ্টা)", en: "Bangla Language (100 hrs)" },
      modules: [],
      credits: 0,
      marks: 100,
    },
  ],
};

export const pysSpecializations = [
  { bn: "দাওয়াহ ও তুলনামূলক ধর্মতত্ত্ব", en: "Dawah and Comparative Religion", ar: "الدعوة ومقارنة الأديان" },
  { bn: "কুরআন শাস্ত্র ও তাফসীর", en: "Quranic Sciences and Tafsir", ar: "علوم القرآن والتفسير" },
  { bn: "ফিকহ ও ইফতা", en: "Fiqh and Ifta", ar: "الفقه والإفتاء" },
  { bn: "ইসলামী অর্থনীতি", en: "Islamic Economics", ar: "الاقتصاد الإسلامي" },
  { bn: "ইসলামের ইতিহাস", en: "History of Islam", ar: "التاريخ الإسلامي" },
];

export const pys: Course = {
  slug: "preparatory-year-for-specialization",
  titleBn: "প্রিপারেটরি ইয়ার ফর স্পেশালাইজেশন (PYS)",
  titleEn: "Preparatory Year for Specialization (PYS)",
  titleAr: "السنة التمهيدية للتخصص",
  kind: "flagship",
  tagline: {
    bn: "তরুণ ও মেধাবী আলেমদের জন্য গবেষণানির্ভর উচ্চশিক্ষা প্রোগ্রাম",
    en: "A research-oriented higher-education program for talented young Ulama",
  },
  summary: {
    bn: "কওমি মাদরাসা পড়ুয়া মেধাবী আলেমদের আধুনিক জ্ঞান-বিজ্ঞানে দক্ষ করে আন্তর্জাতিক মানের দাঈ ও গবেষক হিসেবে গড়ে তোলার লক্ষ্যে এই কোর্সটি চালু করা হয়েছে।",
    en: "Designed for talented Khowmi madrasa graduates, this program trains them in modern sciences to become internationally-standard da'ees and researchers.",
  },
  durationLabel: { bn: "৩ বছর (আবাসিক)", en: "3 Years (Residential)" },
  eligibilityLabel: { bn: "কওমি তাকমিল / সমমান", en: "Khowmi Takmil / equivalent" },
  featured: true,
  icon: "graduation-cap",
  accentClass: "from-emerald-700 to-emerald-900",
  details: {
    intro: {
      bn: "এটি তরুণ ও মেধাবী আলেমদের জন্য গবেষণানির্ভর উচ্চশিক্ষা প্রোগ্রাম। যোগ্য আলেমদের আধুনিক জ্ঞান-বিজ্ঞানে দক্ষ করে আন্তর্জাতিক মানের দাঈ ও গবেষক হিসেবে গড়ে তোলার লক্ষ্যে এই কোর্সটি চালু করা হয়েছে। বিশেষভাবে এই কোর্সটি কওমি মাদরাসা পড়ুয়া মেধাবী আলেমদের জন্য ডিজাইন করা হয়েছে, যাতে তারা সমসাময়িক চ্যালেঞ্জ মোকাবেলা করে ইসলামের দাওয়াহ দিতে পারেন।",
      en: "A research-oriented higher education program for young, talented Ulama — training qualified scholars in modern sciences to become internationally recognized da'ees and researchers who can address contemporary challenges.",
    },
    objectives: [
      {
        bn: "মেধাবী আলেমদের আধুনিক জ্ঞান-বিজ্ঞানে দক্ষ করে আন্তর্জাতিক মানের দাঈ ও গবেষক হিসেবে গড়ে তোলা।",
        en: "Train talented Ulama in modern sciences to become internationally standard da'ees and researchers.",
      },
      {
        bn: "সমসাময়িক চ্যালেঞ্জ মোকাবেলায় গবেষণালব্ধ ও যুক্তিনির্ভর জবাব দেওয়ার সক্ষমতা তৈরি করা।",
        en: "Build the capacity to deliver research-based, rational responses to contemporary challenges.",
      },
    ],
    kind: { bn: "সম্পূর্ণ আবাসিক, শুধুমাত্র পুরুষদের জন্য", en: "Fully residential, male students only" },
    duration: {
      bn: "সম্পূর্ণ কোর্সের মেয়াদ ৩ বছর। PYS ১ বছর মেয়াদী বাধ্যতামূলক প্রস্তুতিমূলক বর্ষ; এরপর নির্বাচিত বিভাগে ২ বছর মেয়াদী উচ্চশিক্ষা কোর্স।",
      en: "Total 3 years. PYS is a mandatory 1-year preparatory year, followed by a 2-year specialization in a chosen department.",
    },
    accommodation: { bn: "সম্পূর্ণ আবাসিক", en: "Fully residential" },
    eligibility: [
      { bn: "কওমি মাদরাসা থেকে তাকমিল সম্পন্নকারী মেধাবী আলেম।", en: "Talented Ulama who completed Takmil from a Khowmi madrasa." },
      { bn: "ভর্তি পরীক্ষায় (লিখিত ও মৌখিক) উত্তীর্ণ হওয়া।", en: "Passing the admission test (written and oral)." },
      { bn: "পূর্ণকালীন অধ্যয়নের মানসিকতা ও সক্ষমতা থাকা।", en: "Commitment and capacity for full-time study." },
    ],
    curriculum: [pysSemester1, pysSemester2, pysSupplementary],
    extraSections: [
      {
        title: { bn: "তাখাসসুস বিভাগসমূহ", en: "Specialization Departments" },
        body: [
          {
            bn: "প্রস্তুতিমূলক বর্ষ ও ফলাফলের ভিত্তিতে চূড়ান্ত বিভাগ নির্বাচন করা হয়। নির্বাচিত বিভাগে ২ বছর মেয়াদী উচ্চশিক্ষা কোর্স করা যায়।",
            en: "The final department is selected based on the preparatory year results and aptitude, followed by a 2-year advanced program.",
          },
        ],
      },
    ],
    outcomes: [
      {
        bn: "পাঁচটি তাখাসসুস বিভানে বিশেষজ্ঞ গবেষক ও দাঈ হিসেবে ক্যারিয়ার।",
        en: "Career as a specialized researcher and da'ee across five specialization tracks.",
      },
      {
        bn: "আধুনিক জ্ঞান-বিজ্ঞানের সঙ্গে ইসলামী শাস্ত্রের গভীর সমন্বয়সম্পন্ন জ্ঞান।",
        en: "Deep, integrated knowledge of Islamic sciences and modern disciplines.",
      },
    ],
  },
};
