import type { ClarificationTopic, DownloadItem, PublicationItem, ResearchProject } from "@/types";

/** Ongoing & upcoming research projects. */
export const researchProjects: ResearchProject[] = [
  {
    id: "rp-contemporary-ideologies",
    title: { bn: "সমকালীন মতাদর্শ ও ইসলাম: একটি তুলনামূলক গবেষণা", en: "Contemporary Ideologies & Islam: A Comparative Study" },
    description: {
      bn: "সেকুলারিজম, উদারতাবাদ, নারীবাদ ও সায়েন্টিজমের দার্শনিক ভিত্তি বিশ্লেষণ এবং ইসলামী আকীদার আলোকে সমালোচনামূলক পর্যালোচনা।",
      en: "Analyzing the philosophical foundations of secularism, liberalism, feminism, and scientism with critical review under Islamic creed.",
    },
    progress: 65,
    status: "ongoing",
    team: { bn: "গবেষণা বোর্ড, আস-সুন্নাহ ইনস্টিটিউট", en: "Research Board, As-Sunnah Institute" },
  },
  {
    id: "rp-atheism-bangladesh",
    title: { bn: "বাংলাদেশে নাস্তিক্যবাদ ও সংশয়বাদ: কারণ ও করণীয়", en: "Atheism & Skepticism in Bangladesh: Causes and Responses" },
    description: {
      bn: "তরুণ সমাজে নাস্তিক্যবাদের বিস্তারের সামাজিক-মনস্তাত্ত্বিক কারণ চিহ্নিতকরণ এবং দাওয়াতি জবাবের কৌশল প্রণয়ন।",
      en: "Identifying the socio-psychological causes of atheism's spread among youth and formulating dawah response strategies.",
    },
    progress: 40,
    status: "ongoing",
    team: { bn: "ড. মোস্তাফা মনজুরের তত্ত্বাবধানে", en: "Supervised by Dr. Mostafa Manjur" },
  },
  {
    id: "rp-orientalist",
    title: { bn: "প্রাচ্যবিদদের হাদীস-সমালোচনা: একটি প্রামাণ্য পর্যালোচনা", en: "Orientalist Criticism of Hadith: An Evidential Review" },
    description: {
      bn: "প্রাচ্যবিদদের উত্থাপিত আপত্তিসমূহের শ্রেণিবিন্যাস, প্রামাণ্য জবাব ও হাদীস-সমালোচনার পদ্ধতিগত ত্রুটি নিরূপণ।",
      en: "Classifying orientalist objections, evidential responses, and methodological flaws in hadith criticism.",
    },
    progress: 20,
    status: "ongoing",
    team: { bn: "মাওলানা আবু রাফআন সিরাজ ও টিম", en: "Mawlana Abu Rafa'an Siraj & team" },
  },
  {
    id: "rp-islamic-economics",
    title: { bn: "বাংলাদেশে ইসলামী অর্থায়নের সমস্যাবলি ও সমাধান (আসন্ন)", en: "Issues & Solutions of Islamic Finance in Bangladesh (Upcoming)" },
    description: {
      bn: "দেশীয় ইসলামী ব্যাংকিং খাতের গবেষণালব্ধ সমস্যা ও শরীয়াহভিত্তিক সমাধান নিয়ে আসন্ন প্রকল্প। কল ফর পেপার্স প্রকাশিত হবে।",
      en: "An upcoming project on researched issues and Shariah-based solutions in the domestic Islamic banking sector. Call for papers to be announced.",
    },
    progress: 0,
    status: "upcoming",
    team: null,
  },
];

/** Call for papers banner data. */
export const callForPapers = {
  active: true,
  title: { bn: "কল ফর পেপার্স — ইনস্টিটিউট জার্নাল (বার্ষিক সংখ্যা)", en: "Call for Papers — Institute Journal (Annual Issue)" },
  deadline: "2026-03-31",
  guidelines: [
    { bn: "প্রবন্ধ হতে হবে মৌলিক গবেষণালব্ধ; প্রকাশিত কোনো লেখার অনুবাদ হলে উৎস উল্লেখ বাধ্যতামূলক।", en: "Submissions must be original research; translations must clearly cite sources." },
    { bn: "আরবি প্রবন্ধের সঙ্গে ইংরেজি/বাংলা সারসংক্ষেপ এবং বাংলা প্রবন্ধের সঙ্গে ইংরেজি সারসংক্ষেপ থাকতে হবে।", en: "Arabic papers need English/Bangla abstracts; Bangla papers need English abstracts." },
    { bn: "রেফারেন্স শৈলী: Chicago Manual of Style (17th edition)।", en: "Reference style: Chicago Manual of Style (17th edition)." },
    { bn: "পাণ্ডুলিপি জমা দিন: research@assunnah-institute.org", en: "Submit manuscripts to: research@assunnah-institute.org" },
  ],
} as const;

/** Library journals & faculty publications. */
export const publications: PublicationItem[] = [
  {
    id: "journal-annual-vol1",
    title: { bn: "আস-সুন্নাহ জার্নাল — বার্ষিক গবেষণা সংখ্যা (১ম খণ্ড)", en: "As-Sunnah Journal — Annual Research Issue (Vol. 1)" },
    author: "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট গবেষণা বোর্ড",
    authorRole: { bn: "সম্পাদনায়: গবেষণা বোর্ড", en: "Edited by: Research Board" },
    type: "journal",
    year: 2025,
    description: {
      bn: "সমকালীন চিন্তা, তুলনামূলক ধর্মতত্ত্ব ও ইসলামী শাস্ত্রের ওপর পিয়ার-রিভিউড গবেষণাপত্রের সংকলন।",
      en: "A compilation of peer-reviewed research papers on contemporary thought, comparative religion, and Islamic sciences.",
    },
    issnIsbn: "ISSN 2789-XXXX (sample)",
    accentClass: "from-emerald-700 to-emerald-900",
  },
  {
    id: "book-dai-personality",
    title: { bn: "দাঈর ব্যক্তিত্ব ও গুণাবলি", en: "The Da'ee's Personality and Qualities" },
    author: "শায়খ আহমাদুল্লাহ",
    authorRole: { bn: "চেয়ারম্যান, আস-সুন্নাহ ফাউন্ডেশন", en: "Chairman, As-Sunnah Foundation" },
    type: "book",
    year: 2024,
    description: {
      bn: "একজন আদর্শ দাঈর চারিত্রিক গুণাবলি, আমল ও সামাজিক আচরণ নিয়ে PYS কোর্সের পাঠ্য রচনা।",
      en: "The PYS course text on the ideal da'ee's character, practices, and social conduct.",
    },
    issnIsbn: null,
    accentClass: "from-amber-600 to-amber-800",
  },
  {
    id: "paper-scientism",
    title: { bn: "সায়েন্টিজম: বিজ্ঞান নাকি বিশ্বাস?", en: "Scientism: Science or Faith?" },
    author: "ড. মোস্তাফা মনজুর",
    authorRole: { bn: "উস্তাজ, রিসার্চ মেথডোলজি", en: "Ustadh, Research Methodology" },
    type: "paper",
    year: 2025,
    description: {
      bn: "বিজ্ঞানবাদের দার্শনিক পূর্বধারণা ও তার সীমাবদ্ধতা — জ্ঞানতত্ত্বের আলোকে একটি সমালোচনা।",
      en: "A critique of scientism's philosophical presuppositions and limits in the light of epistemology.",
    },
    issnIsbn: null,
    accentClass: "from-teal-700 to-emerald-900",
  },
  {
    id: "book-history-civilization",
    title: { bn: "ইসলামী সভ্যতার বুদ্ধিবৃত্তিক ইতিহাস (১ম পর্ব)", en: "Intellectual History of Islamic Civilization (Part 1)" },
    author: "খালেদ মুহাম্মাদ সাইফুল্লাহ",
    authorRole: { bn: "ইনচার্জ, আস-সুন্নাহ ইনস্টিটিউট", en: "In-Charge, As-Sunnah Institute" },
    type: "book",
    year: 2024,
    description: {
      bn: "প্রাথমিক যুগ থেকে আধুনিক যুগ পর্যন্ত মুসলিম চিন্তার বিকাশের ধারাবাহিক ইতিহাস।",
      en: "A sequential history of Muslim intellectual development from the early era to the modern age.",
    },
    issnIsbn: null,
    accentClass: "from-emerald-800 to-teal-900",
  },
  {
    id: "paper-women-rights",
    title: { bn: "ইসলামে নারীর অধিকার: প্রাচ্যবিদ আপত্তির জবাব", en: "Women's Rights in Islam: Answering Orientalist Objections" },
    author: "মুশফিকুর রহমান মিনার",
    authorRole: { bn: "উস্তাজ, তুলনামূলক ধর্মতত্ত্ব", en: "Ustadh, Comparative Religion" },
    type: "paper",
    year: 2025,
    description: {
      bn: "নারীর মর্যাদা, উত্তরাধিকার ও অধিকার বিষয়ে প্রাচ্যবিদ ও নারীবাদী আপত্তিগুলোর প্রামাণ্য জবাব।",
      en: "Evidential responses to orientalist and feminist objections on women's dignity, inheritance, and rights.",
    },
    issnIsbn: null,
    accentClass: "from-amber-700 to-emerald-900",
  },
  {
    id: "journal-bulletin",
    title: { bn: "গবেষণা বার্তা ও বুলেটিন", en: "Research Bulletins" },
    author: "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট",
    authorRole: { bn: "নিয়মিত প্রকাশনা", en: "Periodic publication" },
    type: "journal",
    year: 2025,
    description: {
      bn: "চলমান গবেষণা প্রকল্পের সংক্ষিপ্ত প্রতিবেদন, সেমিনার সারসংক্ষেপ ও নতুন প্রকাশনার ঘোষণা।",
      en: "Brief reports on ongoing projects, seminar summaries, and new publication announcements.",
    },
    issnIsbn: null,
    accentClass: "from-teal-600 to-emerald-800",
  },
];

/** Intellectual clarification topics (সংশয় নিরসন). */
export const clarificationTopics: ClarificationTopic[] = [
  {
    id: "scientism",
    title: { bn: "সায়েন্টিজম", en: "Scientism" },
    description: {
      bn: "বিজ্ঞান ও বিজ্ঞানবাদের পার্থক্য, বৈজ্ঞানিক পদ্ধতির সীমা এবং 'বিজ্ঞানের নামে' উত্থাপিত আপত্তির জবাব।",
      en: "Science vs scientism, the limits of the scientific method, and answers to objections raised 'in the name of science'.",
    },
    articleCount: 6,
    videoCount: 4,
    icon: "flask-conical",
  },
  {
    id: "secularism",
    title: { bn: "সেকুলারিজম", en: "Secularism" },
    description: {
      bn: "সেকুলার চিন্তার উৎস, ধর্ম-রাষ্ট্র বিচ্ছিন্নতার দর্শন এবং ইসলামী জীবনদর্শনের আলোকে পর্যালোচনা।",
      en: "Origins of secular thought, the philosophy of religion-state separation, and review under the Islamic worldview.",
    },
    articleCount: 5,
    videoCount: 3,
    icon: "landmark",
  },
  {
    id: "atheism",
    title: { bn: "নাস্তিক্যবাদ ও সংশয়বাদ", en: "Atheism & Skepticism" },
    description: {
      bn: "আল্লাহর অস্তিত্বের প্রমাণ, নাস্তিক যুক্তিগুলোর যুক্তিগত দুর্বলতা এবং সংশয় দূরীকরণের পথ।",
      en: "Proofs of God's existence, logical weaknesses of atheist arguments, and paths out of doubt.",
    },
    articleCount: 8,
    videoCount: 6,
    icon: "help-circle",
  },
  {
    id: "feminism",
    title: { bn: "নারীবাদ", en: "Feminism" },
    description: {
      bn: "ইসলামে নারীর মর্যাদা ও অধিকার, নারীবাদী মতবাদের পর্যালোচনা এবং প্রকৃত নারীমুক্তির ইসলামী পথ।",
      en: "Women's dignity and rights in Islam, a review of feminist ideology, and Islam's true path to women's emancipation.",
    },
    articleCount: 5,
    videoCount: 3,
    icon: "venus",
  },
  {
    id: "orientalism",
    title: { bn: "প্রাচ্যবাদ", en: "Orientalism" },
    description: {
      bn: "প্রাচ্যবিদদের ইসলাম-চর্চার পদ্ধতি, হাদীস-কুরআন সংক্রান্ত আপত্তির জবাব এবং পাশ্চাত্য একাডেমিয়ার পক্ষপাত।",
      en: "Orientalist methodology, responses to Quran-Hadith objections, and bias in Western academia.",
    },
    articleCount: 4,
    videoCount: 2,
    icon: "globe",
  },
  {
    id: "lgbtq-gender",
    title: { bn: "LGBTQ ও জেন্ডার ফিতনা", en: "LGBTQ & Gender Fitnah" },
    description: {
      bn: "জেন্ডার তত্ত্বের দার্শনিক ভিত্তি, সামাজিক পরিণতি এবং ইসলামী জীবনব্যবস্থার স্পষ্ট অবস্থান।",
      en: "The philosophical basis of gender theory, its social consequences, and the clear position of the Islamic way of life.",
    },
    articleCount: 3,
    videoCount: 3,
    icon: "shield-alert",
  },
];

/** Download center resources. */
export const downloadItems: DownloadItem[] = [
  {
    id: "dl-prospectus",
    title: { bn: "ইনস্টিটিউট প্রসপেক্টাস (সম্পূর্ণ)", en: "Institute Prospectus (Complete)" },
    category: "prospectus",
    fileType: "PDF",
    sizeLabel: "4.2 MB",
    url: "/downloads/prospectus.pdf",
  },
  {
    id: "dl-pys-syllabus",
    title: { bn: "PYS কোর্স সিলেবাস ও কারিকুলাম", en: "PYS Syllabus & Curriculum" },
    category: "syllabus",
    fileType: "PDF",
    sizeLabel: "1.8 MB",
    url: "/downloads/pys-syllabus.pdf",
  },
  {
    id: "dl-ccis-syllabus",
    title: { bn: "CCIS কোর্স সিলেবাস", en: "CCIS Syllabus" },
    category: "syllabus",
    fileType: "PDF",
    sizeLabel: "1.2 MB",
    url: "/downloads/ccis-syllabus.pdf",
  },
  {
    id: "dl-diploma-syllabus",
    title: { bn: "ডিপ্লোমা কোর্স সিলেবাস (৪ সেমিস্টার)", en: "Diploma Syllabus (4 Semesters)" },
    category: "syllabus",
    fileType: "PDF",
    sizeLabel: "2.1 MB",
    url: "/downloads/diploma-syllabus.pdf",
  },
  {
    id: "dl-admission-form",
    title: { bn: "ভর্তি আবেদন ফর্ম (অফলাইন)", en: "Admission Application Form (Offline)" },
    category: "form",
    fileType: "DOC",
    sizeLabel: "320 KB",
    url: "/downloads/admission-form.doc",
  },
  {
    id: "dl-zakat-form",
    title: { bn: "স্কলারশিপ/যাকাত আবেদন ফর্ম", en: "Scholarship/Zakat Application Form" },
    category: "form",
    fileType: "DOC",
    sizeLabel: "280 KB",
    url: "/downloads/zakat-form.doc",
  },
  {
    id: "dl-dawah-leaflet",
    title: { bn: "দাওয়াহ লিফলেট সিরিজ (প্রিন্ট-রেডি)", en: "Dawah Leaflet Series (Print-ready)" },
    category: "dawah",
    fileType: "ZIP",
    sizeLabel: "12.5 MB",
    url: "/downloads/dawah-leaflets.zip",
  },
  {
    id: "dl-dawah-poster",
    title: { bn: "দাওয়াহ পোস্টার সংগ্রহ", en: "Dawah Poster Collection" },
    category: "dawah",
    fileType: "ZIP",
    sizeLabel: "18.3 MB",
    url: "/downloads/dawah-posters.zip",
  },
];
