import type { Course } from "@/types";

/* ————— CCIS: Certificate Course in Islamic Studies ————— */

export const ccis: Course = {
  slug: "certificate-course-in-islamic-studies",
  titleBn: "সার্টিফিকেট কোর্স ইন ইসলামিক স্টাডিজ (CCIS)",
  titleEn: "Certificate Course in Islamic Studies (CCIS)",
  kind: "certificate",
  tagline: {
    bn: "উচ্চশিক্ষিত তরুণদের জন্য বেসিক ইসলামিক স্টাডিজ কোর্স",
    en: "A foundational Islamic studies course for university graduates",
  },
  summary: {
    bn: "বিশ্ববিদ্যালয় থেকে উচ্চতর ডিগ্রিধারী শিক্ষার্থীদের জন্য ৬ মাস মেয়াদী কোর্স — আরবি ভাষা, তাজভীদসহ বিশুদ্ধ তিলাওয়াত, বেসিক ইসলাম ও দাওয়াহ-তারবিয়াহর প্রশিক্ষণ।",
    en: "A 6-month course for university graduates covering Arabic language, Tajweed-based Quran recitation, essential Islam, and dawah training.",
  },
  durationLabel: { bn: "৬ মাস", en: "6 Months" },
  eligibilityLabel: { bn: "স্নাতক (CGPA ২.৫+)", en: "Bachelor's degree (CGPA 2.5+)" },
  featured: true,
  icon: "scroll-text",
  accentClass: "from-amber-600 to-amber-800",
  details: {
    intro: {
      bn: "৬ মাস মেয়াদী এই বেসিক কোর্সে বিশ্ববিদ্যালয় থেকে উচ্চতর ডিগ্রিধারী শিক্ষার্থীদের শেখানো হচ্ছে — আরবি ভাষা (সহজ কথোপকথন ও আয়াত অনুধাবন), তাজভীদসহ বিশুদ্ধ কুরআন তিলাওয়াত, বেসিক ইসলাম (আকীদা, ইবাদত ও মাসআলা-মাসায়েল) এবং দাওয়াহ, তারবিয়াহ ও সমকালীন জ্ঞান।",
      en: "This 6-month foundational course teaches university graduates: Arabic (conversation & verse comprehension), Tajweed-based Quran recitation, essential Islam (aqidah, worship, rulings), and dawah, tarbiyah, and contemporary knowledge.",
    },
    objectives: [
      {
        bn: "জেনারেল ধারায় শিক্ষিত মেধাবী তরুণদের কুরআন-সুন্নাহর ফরযে আইন ইলম, তাজভীদভিত্তিক বিশুদ্ধ তিলাওয়াত, প্রাথমিক আরবি ভাষা এবং সীরাতের জ্ঞানে সমৃদ্ধ করা।",
        en: "Enrich educated youth with obligatory Islamic knowledge, Tajweed recitation, elementary Arabic, and Sirah.",
      },
      {
        bn: "শিক্ষার্থীদের মাঝে সুন্নাহর বাস্তবায়ন, চারিত্রিক তারবিয়াহ এবং দাওয়াহর প্রায়োগিক দক্ষতা তৈরি করা।",
        en: "Instill the practice of the Sunnah, character development, and practical dawah skills.",
      },
      {
        bn: "পরবর্তী উচ্চতর দুই বছর মেয়াদী ডিপ্লোমা কোর্সের উপযোগী করে তোলা।",
        en: "Prepare students for the subsequent 2-year advanced diploma.",
      },
    ],
    kind: { bn: "আবাসিক/অনাবাসিক — উভয় সুবিধা, শুধুমাত্র পুরুষদের জন্য", en: "Residential/non-residential, male students only" },
    duration: { bn: "০৬ মাস", en: "6 months" },
    accommodation: { bn: "আবাসিক ও অনাবাসিক — উভয়ই", en: "Both residential and non-residential" },
    eligibility: [
      { bn: "স্বীকৃত কলেজ-বিশ্ববিদ্যালয় থেকে ন্যূনতম স্নাতক সম্পন্ন করা।", en: "Minimum bachelor's degree from a recognized institution." },
      { bn: "সিজিপিএ ২.৫-এর উপরে থাকা।", en: "CGPA above 2.5." },
      { bn: "ব্যস্ততামুক্ত হয়ে পূর্ণকালীন পড়াশোনার সক্ষমতা থাকা।", en: "Ability to study full-time without competing commitments." },
      { bn: "ভর্তি পরীক্ষায় (লিখিত ও মৌখিক) উত্তীর্ণ হওয়া।", en: "Pass the admission test (written and oral)." },
    ],
    curriculum: [
      {
        label: { bn: "কোর্স কারিকুলাম", en: "Course Curriculum" },
        note: null,
        totalCredits: 16,
        totalMarks: 400,
        courses: [
          { code: "CCAIS 101", title: { bn: "কুরআন তিলাওয়াত ও তাজভীদ", en: "Quran Recitation & Tajweed" }, modules: [], credits: 4, marks: 100 },
          { code: "CCAIS 102", title: { bn: "আরবি ভাষা", en: "Arabic Language" }, modules: [], credits: 4, marks: 100 },
          { code: "CCAIS 103", title: { bn: "ইসলামের পরিচিতি", en: "Introduction to Islam" }, modules: [], credits: 2, marks: 50 },
          { code: "CCAIS 104", title: { bn: "প্রয়োজনীয় ফিকহ ও দৈনন্দিন সুন্নাহ", en: "Essential Fiqh & Daily Sunnah" }, modules: [], credits: 2, marks: 50 },
          { code: "CCAIS 105", title: { bn: "সীরাত ও ইসলামের ইতিহাস", en: "Sirah & Islamic History" }, modules: [], credits: 2, marks: 50 },
          { code: "CCAIS 106", title: { bn: "ভাইভা", en: "Viva" }, modules: [], credits: 2, marks: 50 },
        ],
      },
    ],
    extraSections: [],
    outcomes: [
      { bn: "দুই বছর মেয়াদী ডিপ্লোমা ইন দাওয়াহ অ্যান্ড ইসলামিক স্টাডিজে ভর্তির যোগ্যতা অর্জন।", en: "Eligibility for the 2-year Diploma in Dawah & Islamic Studies." },
      { bn: "দৈনন্দিন জীবনে কুরআন-সুন্নাহভিত্তিক আমলের দৃঢ় ভিত্তি।", en: "A firm foundation of Quran-Sunnah-based practice in daily life." },
    ],
  },
};

/* ————— Diploma in Dawah & Islamic Studies ————— */

export const diploma: Course = {
  slug: "diploma-in-dawah-and-islamic-studies",
  titleBn: "ডিপ্লোমা ইন দাওয়াহ অ্যান্ড ইসলামিক স্টাডিজ",
  titleEn: "Diploma in Dawah & Islamic Studies",
  kind: "diploma",
  tagline: {
    bn: "CCIS উত্তীর্ণদের জন্য উচ্চতর দুই বছর মেয়াদী ডিপ্লোমা",
    en: "An advanced 2-year diploma for CCIS graduates",
  },
  summary: {
    bn: "৬ মাসের সার্টিফিকেট কোর্স সফলতার সঙ্গে সম্পন্নকারীদের জন্য — আরবি ভাষা ও শাস্ত্রীয় জ্ঞানের (নাহু, সরফ, ফিকহ, হাদীস) মজবুত ভিত্তিসহ ৪ সেমিস্টারের উচ্চতর ডিপ্লোমা।",
    en: "For graduates of the 6-month certificate course — a 4-semester advanced diploma building a strong foundation in Arabic and classical sciences (Nahw, Sarf, Fiqh, Hadith).",
  },
  durationLabel: { bn: "২ বছর (৪ সেমিস্টার)", en: "2 Years (4 Semesters)" },
  eligibilityLabel: { bn: "CCIS উত্তীর্ণ", en: "CCIS graduates" },
  featured: true,
  icon: "library-big",
  accentClass: "from-teal-700 to-emerald-900",
  details: {
    intro: {
      bn: "যারা পূর্বে বর্ণিত ০৬ মাসের প্রাথমিক সার্টিফিকেট কোর্সটি সফলতার সাথে সম্পন্ন করে উত্তীর্ণ হয়েছেন, তাঁদের জন্য এই উচ্চতর ডিপ্লোমা কোর্সটি সাজানো হয়েছে। দ্বীনের দাঈ হিসেবে পথচলার নিমিত্তে ইসলামের বুনিয়াদি ও মাধ্যমিক স্তরের গভীর জ্ঞান অর্জনে আগ্রহী শিক্ষার্থীদের আরবি ভাষা ও শাস্ত্রীয় জ্ঞানের (নাহু, সরফ, ফিকহ ও হাদীস) একটি মজবুত ভিত্তি তৈরি করে দিতে এই কোর্সে উচ্চতর পাঠদান করা হয়।",
      en: "This advanced diploma is designed for those who successfully completed the 6-month certificate course, building a solid foundation in Arabic and classical sciences (Nahw, Sarf, Fiqh, Hadith) for a life of dawah.",
    },
    objectives: [
      {
        bn: "শিক্ষার্থীদের আরবি ভাষা ও শাস্ত্রীয় জ্ঞানের মজবুত ভিত্তি তৈরি করে দেওয়া, যেন তাঁরা সরাসরি মূল উৎস থেকে কুরআন ও হাদীসের মর্ম অনুধাবন করতে পারেন।",
        en: "Build a strong foundation in Arabic and classical sciences so students can understand the Quran and Hadith directly from primary sources.",
      },
      {
        bn: "সমকালীন প্রেক্ষাপট ও দাওয়াহর আধুনিক কলাকৌশল শিক্ষার মাধ্যমে দক্ষ দাঈ ও আদর্শ মানুষ হিসেবে গড়ে তোলা।",
        en: "Develop skilled da'ees through contemporary context and modern dawah methodologies.",
      },
      { bn: "সমাজ সংস্কারে বুদ্ধিবৃত্তিক ও কার্যকর ভূমিকা পালনের যোগ্যতা তৈরি করা।", en: "Prepare students for an effective intellectual role in societal reform." },
    ],
    kind: { bn: "আবাসিক/অনাবাসিক — উভয় সুবিধা", en: "Residential/non-residential" },
    duration: { bn: "০২ বছর (৪টি সেমিস্টার)", en: "2 years (4 semesters)" },
    accommodation: { bn: "আবাসিক ও অনাবাসিক — উভয়ই", en: "Both residential and non-residential" },
    eligibility: [{ bn: "৬ মাস মেয়াদী সার্টিফিকেট কোর্সে সফলভাবে উত্তীর্ণ শিক্ষার্থী।", en: "Successful graduates of the 6-month certificate course." }],
    curriculum: [
      {
        label: { bn: "১ম বছর — ১ম সেমিস্টার", en: "Year 1 — Semester 1" },
        note: { bn: "মোট ক্রেডিট ২৪ | মোট মার্কস ৮০০ | সময়কাল ৬ মাস", en: "24 credits | 800 marks | 6 months" },
        totalCredits: 24,
        totalMarks: 800,
        courses: [
          { code: "PGD-DIS 1101", title: { bn: "কুরআন তিলাওয়াত ও তাজভীদ (২য় পর্যায়)", en: "Beautifying Quran Recitation & Tajweed (II)" }, modules: [], credits: 3, marks: 100 },
          { code: "PGD-DIS 1102", title: { bn: "কুরআন অনুবাদ (৫ পারা)", en: "Quran Translation (5 Parts)" }, modules: [], credits: 3, marks: 100 },
          { code: "PGD-DIS 1103", title: { bn: "হাদীস স্টাডিজ (১)", en: "Hadith Studies (I)" }, modules: [], credits: 3, marks: 100 },
          { code: "PGD-DIS 1104", title: { bn: "ফিকহ স্টাডিজ", en: "Fiqh Studies" }, modules: [], credits: 3, marks: 100 },
          { code: "PGD-DIS 1105", title: { bn: "আরবি ভাষা ও সাহিত্য", en: "Arabic Language & Literature" }, modules: [], credits: 3, marks: 100 },
          { code: "PGD-DIS 1106", title: { bn: "আরবি ব্যাকরণ", en: "Arabic Grammar" }, modules: [], credits: 3, marks: 100 },
          { code: "PGD-DIS 1107", title: { bn: "দাওয়াহর পরিচিতি", en: "Introduction to Da'wah" }, modules: [], credits: 3, marks: 100 },
          { code: "PGD-DIS 1108", title: { bn: "ইসলামী বুদ্ধিবৃত্তিক ইতিহাস", en: "Islamic Intellectual History" }, modules: [], credits: 3, marks: 100 },
        ],
      },
      {
        label: { bn: "১ম বছর — ২য় সেমিস্টার", en: "Year 1 — Semester 2" },
        note: { bn: "মোট ক্রেডিট ২৩ | মোট মার্কস ৭৫০ | সময়কাল ৬ মাস", en: "23 credits | 750 marks | 6 months" },
        totalCredits: 23,
        totalMarks: 750,
        courses: [
          { code: "PGD-DIS 1201", title: { bn: "কুরআন অনুবাদ (৭ পারা)", en: "Quran Translation (7 Parts)" }, modules: [], credits: 3, marks: 100 },
          { code: "PGD-DIS 1202", title: { bn: "হাদীস স্টাডিজ (২)", en: "Hadith Studies (II)" }, modules: [], credits: 3, marks: 100 },
          { code: "PGD-DIS 1203", title: { bn: "ফিকহুল ইবাদত", en: "Fiqhul Ibadat" }, modules: [], credits: 3, marks: 100 },
          { code: "PGD-DIS 1204", title: { bn: "উন্নত আরবি ভাষা ও সাহিত্য", en: "Advanced Arabic Language & Literature" }, modules: [], credits: 3, marks: 100 },
          { code: "PGD-DIS 1205", title: { bn: "উন্নত আরবি ব্যাকরণ", en: "Advanced Arabic Grammar" }, modules: [], credits: 3, marks: 100 },
          { code: "PGD-DIS 1206", title: { bn: "সমকালীন দাওয়াহ", en: "Contemporary Da'wah" }, modules: [], credits: 3, marks: 100 },
          { code: "PGD-DIS 1207", title: { bn: "দক্ষিণ এশিয়ায় দাওয়াহ", en: "Dawah in South Asia" }, modules: [], credits: 3, marks: 100 },
          { code: "PGD-DIS 1208", title: { bn: "ভাইভা", en: "Viva" }, modules: [], credits: 2, marks: 50 },
        ],
      },
      {
        label: { bn: "২য় বছর — ১ম সেমিস্টার", en: "Year 2 — Semester 1" },
        note: { bn: "মোট ক্রেডিট ২২ | মোট মার্কস ৭০০ | সময়কাল ৬ মাস", en: "22 credits | 700 marks | 6 months" },
        totalCredits: 22,
        totalMarks: 700,
        courses: [
          { code: "PGD-DIS 2101", title: { bn: "কুরআন অধ্যয়ন ও সংক্ষিপ্ত তাফসীর (৮ পারা)", en: "Study of al-Quran & Short Tafsir (8 Parts)" }, modules: [], credits: 4, marks: 100 },
          { code: "PGD-DIS 2102", title: { bn: "উন্নত হাদীস স্টাডিজ (১)", en: "Advanced Hadith Studies (I)" }, modules: [], credits: 4, marks: 100 },
          { code: "PGD-DIS 2103", title: { bn: "ফিকহুল মুআমালাত ও উসুলুল ফিকহ (১)", en: "Fiqhul Muamalat & Usulul Fiqh (I)" }, modules: [], credits: 4, marks: 100 },
          { code: "PGD-DIS 2104", title: { bn: "আরবি সাহিত্য ও ইলমুল বালাগাহ (১)", en: "Arabic Literature & Ilmul Balagah (I)" }, modules: [], credits: 4, marks: 100 },
          { code: "PGD-DIS 2105", title: { bn: "তুলনামূলক ধর্মতত্ত্ব", en: "Comparative Religion" }, modules: [], credits: 3, marks: 100 },
          { code: "PGD-DIS 2106", title: { bn: "সমকালীন মতাদর্শ", en: "Contemporary Ideologies" }, modules: [], credits: 3, marks: 100 },
        ],
      },
      {
        label: { bn: "২য় বছর — ২য় সেমিস্টার", en: "Year 2 — Semester 2" },
        note: { bn: "মোট ক্রেডিট ২৪ | মোট মার্কস ৬৫০ | সময়কাল ৬ মাস", en: "24 credits | 650 marks | 6 months" },
        totalCredits: 24,
        totalMarks: 650,
        courses: [
          { code: "PGD-DIS 2201", title: { bn: "কুরআন অধ্যয়ন ও সংক্ষিপ্ত তাফসীর (১০ পারা)", en: "Study of al-Quran & Short Tafsir (10 Parts)" }, modules: [], credits: 4, marks: 100 },
          { code: "PGD-DIS 2202", title: { bn: "উন্নত হাদীস স্টাডিজ (২)", en: "Advanced Hadith Studies (II)" }, modules: [], credits: 4, marks: 100 },
          { code: "PGD-DIS 2203", title: { bn: "ফিকহুল মুআমালাত ও উসুলুল ফিকহ (২)", en: "Fiqhul Muamalat & Usulul Fiqh (II)" }, modules: [], credits: 4, marks: 100 },
          { code: "PGD-DIS 2204", title: { bn: "উন্নত আরবি সাহিত্য", en: "Advanced Arabic Literature" }, modules: [], credits: 3, marks: 100 },
          { code: "PGD-DIS 2205", title: { bn: "ইসলামী শাস্ত্রসমূহ", en: "Islamic Sciences" }, modules: [], credits: 3, marks: 100 },
          { code: "PGD-DIS 2206", title: { bn: "গবেষণামূলক প্রবন্ধ (ডিজার্টেশন)", en: "Dissertation" }, modules: [], credits: 4, marks: 100 },
          { code: "PGD-DIS 2207", title: { bn: "ভাইভা", en: "Viva" }, modules: [], credits: 2, marks: 50 },
        ],
      },
    ],
    extraSections: [
      {
        title: { bn: "কোর্স সম্পন্নকারীদের পরবর্তী শিক্ষাক্রম ও কর্মপরিকল্পনা", en: "Pathways After Completion" },
        body: [
          {
            bn: "উচ্চশিক্ষা ও আন্তর্জাতিক ডিগ্রি: দেশ-বিদেশের বিশ্ববিদ্যালয় থেকে ইসলামিক স্টাডিজ ও সংশ্লিষ্ট বিষয়ে উচ্চতর ডিগ্রি অর্জনের সুযোগ।",
            en: "Higher education & international degrees in Islamic Studies and related fields at home and abroad.",
          },
          {
            bn: "প্রথাগত ধারায় আলেম হওয়ার সুযোগ: দেশের স্বনামধন্য মাদরাসাসমূহের 'শরহে বেকায়া' জামাতে সরাসরি ভর্তির সুযোগ।",
            en: "Traditional scholarship: direct admission to the 'Sharh-e-Bekaya' level at renowned madrasas.",
          },
          {
            bn: "কর্মক্ষেত্রে প্রবেশ ও দাওয়াহ কার্যক্রম: অর্জিত জ্ঞান ও দক্ষতা অনুযায়ী কর্মক্ষেত্রে পেশাদারিত্বের সঙ্গে প্রবেশ এবং বৃহত্তর পরিসরে দাওয়াহ কার্যক্রম পরিচালনা।",
            en: "Professional careers and large-scale dawah activity using the acquired knowledge and skills.",
          },
        ],
      },
    ],
    outcomes: [
      { bn: "মূল উৎস থেকে কুরআন-হাদীস অনুধাবনের সক্ষমতা।", en: "Ability to understand the Quran and Hadith from primary sources." },
      { bn: "সমাজ সংস্কারে বুদ্ধিবৃত্তিক দাওয়াহর কার্যকর ভূমিকা।", en: "An effective role in intellectual dawah for societal reform." },
    ],
  },
};
