import type { FacultyGroup, LeadershipMember } from "@/types";

/** Institute leadership & administration. */
export const leadershipTeam: LeadershipMember[] = [
  {
    id: "ahmadullah",
    name: { bn: "শায়খ আহমাদুল্লাহ", en: "Shaykh Ahmadullah" },
    role: { bn: "চেয়ারম্যান", en: "Chairman" },
    bio: {
      bn: "আস-সুন্নাহ ফাউন্ডেশনের প্রতিষ্ঠাতা ও চেয়ারম্যান। দাঈর ব্যক্তিত্ব ও গুণাবলি বিষয়ে নিয়মিত পাঠদান করেন।",
      en: "Founder & Chairman of As-Sunnah Foundation. Regularly teaches on the Da'ee's personality and qualities.",
    },
    initials: "আ",
  },
  {
    id: "khaled-saifullah",
    name: { bn: "খালেদ মুহাম্মাদ সাইফুল্লাহ", en: "Khaled Muhammad Saifullah" },
    role: { bn: "ইনচার্জ", en: "In-Charge" },
    bio: {
      bn: "ইনস্টিটিউটের দায়িত্বশীল ইনচার্জ। 'ইসলামী সভ্যতার বুদ্ধিবৃত্তিক ইতিহাস (১ম পর্ব)' পড়ান।",
      en: "In-Charge of the institute. Teaches 'Intellectual History of Islamic Civilization (Part 1)'.",
    },
    initials: "খ",
  },
  {
    id: "abir-muhsin",
    name: { bn: "আবির মুহসিন", en: "Abir Muhsin" },
    role: { bn: "অ্যাসিস্ট্যান্ট ইনচার্জ", en: "Assistant In-Charge" },
    bio: null,
    initials: "আ",
  },
  {
    id: "shoaib-mahmud",
    name: { bn: "শোয়াইব মাহমুদ", en: "Shoaib Mahmud" },
    role: { bn: "অ্যাসিস্ট্যান্ট ইনচার্জ", en: "Assistant In-Charge" },
    bio: null,
    initials: "শ",
  },
  {
    id: "salahuddin-tarek",
    name: { bn: "সালাহুদ্দীন তারেক", en: "Salahuddin Tarek" },
    role: { bn: "একাডেমিক কো-অর্ডিনেটর", en: "Academic Coordinator" },
    bio: {
      bn: "'ইসলামী সভ্যতার বুদ্ধিবৃত্তিক ইতিহাস (২য় পর্ব)' ও 'টেক্সচুয়াল স্কিলস (১ম পর্ব)' পড়ান।",
      en: "Teaches 'Intellectual History of Islamic Civilization (Part 2)' and 'Textual Skills (Part 1)'.",
    },
    initials: "স",
  },
];

/** Teacher's panel + language/tajweed teams. */
export const facultyGroups: FacultyGroup[] = [
  {
    id: "teachers-panel",
    title: { bn: "শিক্ষক প্যানেল", en: "Teacher's Panel" },
    subtitle: { bn: "দেশ-বিদেশের স্বীকৃত শিক্ষাবিদ ও গবেষকদের সমন্বয়ে গঠিত", en: "Comprising recognized scholars and researchers from home and abroad" },
    members: [
      {
        id: "t-ahmadullah",
        name: { bn: "শায়খ আহমাদুল্লাহ", en: "Shaykh Ahmadullah" },
        designation: { bn: "উস্তাজ", en: "Ustadh" },
        subjects: [{ bn: "দাঈর ব্যক্তিত্ব ও গুণাবলি", en: "The Da'ee's Personality & Qualities" }],
        category: "leadership",
      },
      {
        id: "t-mostafa-manjur",
        name: { bn: "ড. মোস্তাফা মনজুর", en: "Dr. Mostafa Manjur" },
        designation: { bn: "উস্তাজ", en: "Ustadh" },
        subjects: [
          { bn: "রিসার্চ মেথডোলজি ও মেথডস", en: "Research Methodology & Methods" },
          { bn: "ইসলামিক রিসার্চ মেথডোলজি", en: "Islamic Research Methodology" },
          { bn: "তারবিয়াহ", en: "Tarbiyah" },
        ],
        category: "teacher",
      },
      {
        id: "t-liaquat-ali",
        name: { bn: "মাওলানা লিয়াকত আলী", en: "Mawlana Liaquat Ali" },
        designation: { bn: "উস্তাজ", en: "Ustadh" },
        subjects: [
          { bn: "ইসলামের পরিচিতি", en: "Introduction to Islam" },
          { bn: "তারবিয়াহ", en: "Tarbiyah" },
        ],
        category: "teacher",
      },
      {
        id: "t-arif-billah",
        name: { bn: "উস্তায আরিফ বিল্লাহ", en: "Ustadh Arif Billah" },
        designation: { bn: "উস্তাজ", en: "Ustadh" },
        subjects: [
          { bn: "দাওয়াহর পরিচিতি", en: "Introduction to Da'wah" },
          { bn: "বৈশ্বিক রাজনৈতিক প্রেক্ষাপটে মিডিয়া ও সাংবাদিকতা", en: "Media & Journalism in Global Political Context" },
          { bn: "বিশ্ব সভ্যতা ও সংস্কৃতি", en: "World Civilizations and Cultures" },
          { bn: "দর্শনের পরিচিতি", en: "Introduction to Philosophy" },
          { bn: "সমাজবিজ্ঞান", en: "Sociology" },
        ],
        category: "teacher",
      },
      {
        id: "t-khaled",
        name: { bn: "উস্তায খালেদ মুহাম্মাদ সাইফুল্লাহ", en: "Ustadh Khaled Muhammad Saifullah" },
        designation: { bn: "উস্তাজ", en: "Ustadh" },
        subjects: [{ bn: "ইসলামী সভ্যতার বুদ্ধিবৃত্তিক ইতিহাস (১ম পর্ব)", en: "Intellectual History of Islamic Civilization (Part 1)" }],
        category: "leadership",
      },
      {
        id: "t-salahuddin",
        name: { bn: "উস্তায সালাহুদ্দীন তারেক", en: "Ustadh Salahuddin Tarek" },
        designation: { bn: "উস্তাজ", en: "Ustadh" },
        subjects: [
          { bn: "ইসলামী সভ্যতার বুদ্ধিবৃত্তিক ইতিহাস (২য় পর্ব)", en: "Intellectual History of Islamic Civilization (Part 2)" },
          { bn: "টেক্সচুয়াল স্কিলস (১ম পর্ব)", en: "Textual Skills (Part 1)" },
        ],
        category: "teacher",
      },
      {
        id: "t-alauddin-rafiq",
        name: { bn: "উস্তায আলাউদ্দীন রফিক", en: "Ustadh Alauddin Rafiq" },
        designation: { bn: "উস্তাজ", en: "Ustadh" },
        subjects: [
          { bn: "রাষ্ট্রবিজ্ঞান ও আন্তর্জাতিক সম্পর্কের ভিত্তি", en: "Foundation of Politics & International Relations" },
          { bn: "আধুনিক মতাদর্শ ও চিন্তাপ্রবাহ (১ম পর্ব)", en: "Modern Ideologies & Intellectual Trends (Part 1)" },
        ],
        category: "teacher",
      },
      {
        id: "t-zubayer-ehsanul",
        name: { bn: "ড. যুবায়ের এহসানুল হক", en: "Dr. Zubayer Ehsanul Haque" },
        designation: { bn: "উস্তাজ", en: "Ustadh" },
        subjects: [{ bn: "দক্ষিণ এশিয়ায় ইসলাম", en: "Islam in South Asia" }],
        category: "teacher",
      },
      {
        id: "t-zubayer-rashid",
        name: { bn: "মাওলানা যুবায়ের রশীদ", en: "Mawlana Zubayer Rashid" },
        designation: { bn: "উস্তাজ", en: "Ustadh" },
        subjects: [{ bn: "আইনি ব্যবস্থা ও সাধারণ আইনশাস্ত্র", en: "Legal Systems & General Jurisprudence" }],
        category: "teacher",
      },
      {
        id: "t-lokman-hassan",
        name: { bn: "মাওলানা লোকমান হাসান", en: "Mawlana Lokman Hassan" },
        designation: { bn: "উস্তাজ", en: "Ustadh" },
        subjects: [
          { bn: "উসুলুল ফিকহ", en: "Usulul Fiqh" },
          { bn: "অর্থনীতি ও ইসলামী অর্থায়ন", en: "Economics & Islamic Finance" },
        ],
        category: "teacher",
      },
      {
        id: "t-hasibur-azhari",
        name: { bn: "মাওলানা হাসিবুর রহমান আজহারী", en: "Mawlana Hasibur Rahman Azhari" },
        designation: { bn: "উস্তাজ", en: "Ustadh" },
        subjects: [{ bn: "উসুলুত তাফসীর", en: "Usulut Tafsir" }],
        category: "teacher",
      },
      {
        id: "t-abu-rafa",
        name: { bn: "মাওলানা আবু রাফআন সিরাজ", en: "Mawlana Abu Rafa'an Siraj" },
        designation: { bn: "উস্তাজ", en: "Ustadh" },
        subjects: [{ bn: "উলুমুল হাদীস", en: "Ulumul Hadith" }],
        category: "teacher",
      },
      {
        id: "t-hafizur-rahman",
        name: { bn: "হাফিজুর রহমান", en: "Hafizur Rahman" },
        designation: { bn: "উস্তাজ", en: "Ustadh" },
        subjects: [{ bn: "মনোবিজ্ঞানের পরিচিতি", en: "Introduction to Psychology" }],
        category: "teacher",
      },
      {
        id: "t-shoaib-mumin",
        name: { bn: "উস্তায শোয়াইব মুমিন", en: "Ustadh Shoaib Mumin" },
        designation: { bn: "উস্তাজ", en: "Ustadh" },
        subjects: [{ bn: "ইসলামী শাসনতন্ত্র (সিয়াসাহ শারইয়্যাহ)", en: "Islamic Governance (Siyasah Shar'iyyah)" }],
        category: "teacher",
      },
      {
        id: "t-mushfiqur-minar",
        name: { bn: "মুশফিকুর রহমান মিনার", en: "Mushfiqur Rahman Minar" },
        designation: { bn: "উস্তাজ", en: "Ustadh" },
        subjects: [{ bn: "তুলনামূলক ধর্মতত্ত্বের ভিত্তি", en: "Foundation of Comparative Religion" }],
        category: "teacher",
      },
      {
        id: "t-zakaria",
        name: { bn: "উস্তায যাকারিয়া", en: "Ustadh Zakaria" },
        designation: { bn: "উস্তাজ", en: "Ustadh" },
        subjects: [{ bn: "টেক্সচুয়াল স্কিলস (২য় পর্ব)", en: "Textual Skills (Part 2)" }],
        category: "teacher",
      },
      {
        id: "t-junaid",
        name: { bn: "উস্তায জুনায়েদ আল আসজাদ", en: "Ustadh Junaid Al Asjad" },
        designation: { bn: "উস্তাজ", en: "Ustadh" },
        subjects: [{ bn: "আধুনিক মতাদর্শ ও চিন্তাপ্রবাহ (২য় পর্ব)", en: "Modern Ideologies & Intellectual Trends (Part 2)" }],
        category: "teacher",
      },
    ],
  },
  {
    id: "arabic-team",
    title: { bn: "আরবি টিম", en: "Arabic Team" },
    subtitle: null,
    members: [
      {
        id: "ar-saad-hasan",
        name: { bn: "উস্তায সাআদ হাসান", en: "Ustadh Sa'ad Hasan" },
        designation: { bn: "কো-অর্ডিনেটর ও আরবি শিক্ষক", en: "Coordinator & Arabic Teacher" },
        subjects: [],
        category: "language",
      },
      { id: "ar-hammad-nadvi", name: { bn: "উস্তায হাম্মাদ নদভী", en: "Ustadh Hammad Nadvi" }, designation: { bn: "আরবি শিক্ষক", en: "Arabic Teacher" }, subjects: [], category: "language" },
      { id: "ar-lokman-hakim", name: { bn: "উস্তাজ লোকমান হাকিম", en: "Ustadh Lokman Hakim" }, designation: { bn: "আরবি শিক্ষক", en: "Arabic Teacher" }, subjects: [], category: "language" },
      { id: "ar-mizan-muhsin", name: { bn: "উস্তায মিজান মুহসিন", en: "Ustadh Mizan Muhsin" }, designation: { bn: "আরবি শিক্ষক", en: "Arabic Teacher" }, subjects: [], category: "language" },
    ],
  },
  {
    id: "tajweed-team",
    title: { bn: "তাজবিদ টিম", en: "Tajweed Team" },
    subtitle: null,
    members: [
      { id: "tj-mahmudul", name: { bn: "উস্তায মাহমুদুল হাসান", en: "Ustadh Mahmudul Hasan" }, designation: { bn: "প্রধান তাজবিদ শিক্ষক", en: "Head Tajweed Teacher" }, subjects: [], category: "tajweed" },
      { id: "tj-muhammad-sad", name: { bn: "উস্তায মুহাম্মদ সা'দ", en: "Ustadh Muhammad Sa'ad" }, designation: { bn: "তাজবিদ শিক্ষক", en: "Tajweed Teacher" }, subjects: [], category: "tajweed" },
      { id: "tj-al-amin", name: { bn: "উস্তায আল-আমিন", en: "Ustadh Al-Amin" }, designation: { bn: "তাজবিদ শিক্ষক", en: "Tajweed Teacher" }, subjects: [], category: "tajweed" },
      { id: "tj-fariduddin", name: { bn: "উস্তায মাও. ফরিদুদ্দীন মাদানী", en: "Ustadh Maw. Fariduddin Madani" }, designation: { bn: "তারবিয়াহ টিচার", en: "Tarbiyah Teacher" }, subjects: [], category: "tajweed" },
    ],
  },
  {
    id: "language-team",
    title: { bn: "ভাষা ও সাধারণ বিভাগ", en: "Language & General Subjects" },
    subtitle: { bn: "ইংরেজি, বাংলা, কম্পিউটার, গণিত ও বেসিক সায়েন্স টিম", en: "English, Bangla, Computer, Mathematics & Basic Science teams" },
    members: [
      { id: "lt-english", name: { bn: "ইংরেজি বিভাগ", en: "English Department" }, designation: { bn: "উস্তায আল-আমীন, নাইমুর রহমান, উবায়দুল্লাহ", en: "Ustadh Al-Amin, Naimur Rahman, Ubaydullah" }, subjects: [], category: "language" },
      { id: "lt-bangla", name: { bn: "বাংলা বিভাগ", en: "Bangla Department" }, designation: { bn: "সাব্বির জাদিদ, আবুল কাসেম আদিল", en: "Sabbir Jadid, Abul Kasem Adil" }, subjects: [], category: "language" },
      { id: "lt-computer", name: { bn: "কম্পিউটার বিভাগ", en: "Computer Department" }, designation: { bn: "আতীক, জিসান", en: "Atik, Zisan" }, subjects: [], category: "language" },
      { id: "lt-math", name: { bn: "গণিত বিভাগ", en: "Mathematics Department" }, designation: { bn: "টিম", en: "Team" }, subjects: [], category: "language" },
      { id: "lt-science", name: { bn: "বেসিক সায়েন্স বিভাগ", en: "Basic Science Department" }, designation: { bn: "টিম", en: "Team" }, subjects: [], category: "language" },
    ],
  },
];

/** Campus-life highlights (home + about/campus page). */
export const campusLifeItems = [
  {
    id: "intellectual",
    title: { bn: "বুদ্ধিবৃত্তিক চর্চা", en: "Intellectual Discussions" },
    description: {
      bn: "আত্মবিশ্বাস ও যৌক্তিক উপস্থাপন ক্ষমতা বৃদ্ধির লক্ষ্যে নিয়মিত বক্তৃতা, প্যানেল ডিসকাশন ও বিতর্ক প্রতিযোগিতা।",
      en: "Regular speeches, panel discussions, and debate competitions building confidence and logical presentation.",
    },
    image: "/images/student-debate.png",
    icon: "messages-square",
  },
  {
    id: "seminars",
    title: { bn: "সেমিনার ও ওয়ার্কশপ", en: "Seminars & Workshops" },
    description: {
      bn: "দেশ-বিদেশের বরেণ্য আলেম, শিক্ষাবিদ ও চিন্তাবিদদের উপস্থিতিতে সমকালীন বিষয়ে নিয়মিত সেমিনার।",
      en: "Regular seminars on contemporary topics with renowned scholars, educators, and thinkers from home and abroad.",
    },
    image: "/images/campus-seminar.png",
    icon: "presentation",
  },
  {
    id: "reading-circle",
    title: { bn: "পাঠচক্র", en: "Study Circles" },
    description: {
      bn: "পাঠ্যক্রমের বাইরে নির্দিষ্ট বইয়ের ওপর নিয়মিত গ্রুপ স্টাডি — গঠনমূলক পড়ার অভ্যাস ও বিশ্লেষণের ক্ষমতা তৈরি।",
      en: "Regular group study on selected books beyond the curriculum — building constructive reading and analytical skills.",
    },
    image: "/images/study-circle.png",
    icon: "book-open-check",
  },
  {
    id: "fieldwork",
    title: { bn: "ফিল্ডওয়ার্ক ও দাওয়াতি অভিজ্ঞতা", en: "Fieldwork & Dawah Experience" },
    description: {
      bn: "সরাসরি ময়দানে হাতে-কলমে প্রশিক্ষণ — এ পর্যন্ত ১ সপ্তাহ ব্যাপী ১টি বড় ফিল্ডওয়ার্ক কার্যক্রম সফলভাবে পরিচালিত।",
      en: "Hands-on field training — one major week-long fieldwork campaign has been successfully conducted so far.",
    },
    image: "/images/campus-fieldwork.png",
    icon: "map-pinned",
  },
  {
    id: "sports",
    title: { bn: "শরীরচর্চা ও শিক্ষা সফর", en: "Sports & Study Tours" },
    description: {
      bn: "শারীরিক সুস্থতার জন্য মাসিক ইনডোর-আউটডোর খেলাধুলা এবং বার্ষিক শিক্ষা সফরের ব্যবস্থা।",
      en: "Monthly indoor and outdoor sports for physical wellbeing, plus an annual study tour.",
    },
    image: "/images/campus-mosque.png",
    icon: "volleyball",
  },
  {
    id: "leadership",
    title: { bn: "নেতৃত্ব ও দক্ষতা উন্নয়ন", en: "Leadership & Skill Development" },
    description: {
      bn: "ইভেন্ট আয়োজনের বাস্তব দায়িত্বের মাধ্যমে নেতৃত্ব ও সাংগঠনিক দক্ষতা ঝালিয়ে নেওয়া — শিক্ষকদের পর্যবেক্ষণে মূল্যায়ন ও পুরস্কৃত।",
      en: "Real event-management responsibilities hone leadership skills, evaluated and rewarded under teacher supervision.",
    },
    image: "/images/campus-graduation.png",
    icon: "award",
  },
] as const;
