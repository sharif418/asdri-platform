import type { GalleryPhoto, NewsItem, VideoItem } from "@/types";

/** Videos & podcasts — linked to the As-Sunnah Foundation YouTube channel. */
export const videos: VideoItem[] = [
  {
    id: "v-doubt-series-1",
    title: {
      bn: "সংক্ষিপ্ত সংশয় নিরসন: আল্লাহ দেখা যায় না, তাহলে আছেন কীভাবে?",
      en: "Quick Doubt Resolution: If We Can't See Allah, How Does He Exist?",
    },
    playlist: { bn: "সংক্ষিপ্ত সংশয় নিরসন (৪-৫ মিনিট)", en: "Quick Responses (4-5 min)" },
    duration: "4:38",
    thumbnail: "/images/blog-atheism.png",
    youtubeUrl: "https://www.youtube.com/results?search_query=%E0%A6%86%E0%A6%B8-%E0%A6%B8%E0%A7%81%E0%A6%A8%E0%A7%8D%E0%A6%A8%E0%A6%BE%E0%A6%B9%20%E0%A6%AB%E0%A6%BE%E0%A6%89%E0%A6%A8%E0%A7%8D%E0%A6%A1%E0%A7%87%E0%A6%B6%E0%A6%A8%20%E0%A6%86%E0%A6%B2%E0%A7%8D%E0%A6%B2%E0%A6%BE%E0%A6%B9%E0%A6%B0%20%E0%A6%85%E0%A6%B8%E0%A7%8D%E0%A6%A4%E0%A6%BF%E0%A6%A4%E0%A7%8D%E0%A6%AC",
  },
  {
    id: "v-doubt-series-2",
    title: {
      bn: "সায়েন্টিজম বনাম বিজ্ঞান: ৫ মিনিটে মূল পার্থক্য",
      en: "Scientism vs Science: The Core Difference in 5 Minutes",
    },
    playlist: { bn: "সংক্ষিপ্ত সংশয় নিরসন (৪-৫ মিনিট)", en: "Quick Responses (4-5 min)" },
    duration: "5:02",
    thumbnail: "/images/blog-science.png",
    youtubeUrl: "https://www.youtube.com/results?search_query=%E0%A6%86%E0%A6%B8-%E0%A6%B8%E0%A7%81%E0%A6%A8%E0%A7%8D%E0%A6%A8%E0%A6%BE%E0%A6%B9%20%E0%A6%B8%E0%A6%BE%E0%A6%AF%E0%A6%BC%E0%A7%87%E0%A6%A8%E0%A7%8D%E0%A6%9F%E0%A6%BF%E0%A6%9C%E0%A6%AE%20%E0%A6%AC%E0%A6%BF%E0%A6%9C%E0%A7%8D%E0%A6%9E%E0%A6%BE%E0%A6%A8%20%E0%A6%AC%E0%A6%A8%E0%A6%BE%E0%A6%AE%20%E0%A6%AC%E0%A6%BF%E0%A6%9C%E0%A7%8D%E0%A6%9E%E0%A6%BE%E0%A6%A8%E0%A6%AC%E0%A6%BE%E0%A6%A6",
  },
  {
    id: "v-podcast-methodology",
    title: {
      bn: "পডকাস্ট: গবেষণা পদ্ধতিতে মুসলিম ঐতিহ্য — ড. মোস্তাফা মনজুর",
      en: "Podcast: Muslim Tradition in Research Methodology — Dr. Mostafa Manjur",
    },
    playlist: { bn: "পডকাস্ট সিরিজ", en: "Podcast Series" },
    duration: "38:15",
    thumbnail: "/images/study-circle.png",
    youtubeUrl: "https://www.youtube.com/results?search_query=%E0%A6%86%E0%A6%B8-%E0%A6%B8%E0%A7%81%E0%A6%A8%E0%A7%8D%E0%A6%A8%E0%A6%BE%E0%A6%B9%20%E0%A6%B0%E0%A6%BF%E0%A6%B8%E0%A6%BE%E0%A6%B0%E0%A7%8D%E0%A6%9A%20%E0%A6%AE%E0%A7%87%E0%A6%A5%E0%A6%A1%E0%A7%8B%E0%A6%B2%E0%A6%9C%E0%A6%BF%20%E0%A6%A1%20%E0%A6%AE%E0%A7%8B%E0%A6%B8%E0%A7%8D%E0%A6%A4%E0%A6%BE%E0%A6%AB%E0%A6%BE%20%E0%A6%AE%E0%A6%A8%E0%A6%9C%E0%A7%81%E0%A6%B0",
  },
  {
    id: "v-lecture-seerah",
    title: {
      bn: "লেকচার: নবীদের দাওয়াতি পদ্ধতি — শিক্ষণীয় দিকগুলো",
      en: "Lecture: Prophetic Methods of Dawah — Lessons",
    },
    playlist: { bn: "লেকচার ও খুতবা", en: "Lectures & Khutbah" },
    duration: "46:20",
    thumbnail: "/images/campus-mosque.png",
    youtubeUrl: "https://www.youtube.com/results?search_query=%E0%A6%86%E0%A6%B8-%E0%A6%B8%E0%A7%81%E0%A6%A8%E0%A7%8D%E0%A6%A8%E0%A6%BE%E0%A6%B9%20%E0%A6%A8%E0%A6%AC%E0%A7%80%E0%A6%A6%E0%A7%87%E0%A6%B0%20%E0%A6%A6%E0%A6%BE%E0%A6%93%E0%A6%AF%E0%A6%BC%E0%A6%BE%E0%A6%A4%E0%A6%BF%20%E0%A6%AA%E0%A6%A6%E0%A7%8D%E0%A6%A7%E0%A6%A4%E0%A6%BF%20%E0%A6%86%E0%A6%B9%E0%A6%AE%E0%A6%BE%E0%A6%A6%E0%A7%81%E0%A6%B2%E0%A7%8D%E0%A6%B2%E0%A6%BE%E0%A6%B9",
  },
  {
    id: "v-seminar-recording",
    title: {
      bn: "সেমিনার রেকর্ডিং: সমকালীন চিন্তার চ্যালেঞ্জ ও দাওয়াহ",
      en: "Seminar Recording: Contemporary Intellectual Challenges & Dawah",
    },
    playlist: { bn: "সেমিনার রেকর্ডিংস", en: "Seminar Recordings" },
    duration: "1:12:40",
    thumbnail: "/images/campus-seminar.png",
    youtubeUrl: "https://www.youtube.com/results?search_query=%E0%A6%86%E0%A6%B8-%E0%A6%B8%E0%A7%81%E0%A6%A8%E0%A7%8D%E0%A6%A8%E0%A6%BE%E0%A6%B9%20%E0%A6%87%E0%A6%A8%E0%A6%B8%E0%A7%8D%E0%A6%9F%E0%A6%BF%E0%A6%9F%E0%A6%BF%E0%A6%89%E0%A6%9F%20%E0%A6%B8%E0%A7%87%E0%A6%AE%E0%A6%BF%E0%A6%A8%E0%A6%BE%E0%A6%B0%20%E0%A6%B8%E0%A6%AE%E0%A6%95%E0%A6%BE%E0%A6%B2%E0%A7%80%E0%A6%A8%20%E0%A6%9A%E0%A6%BF%E0%A6%A8%E0%A7%8D%E0%A6%A4%E0%A6%BE%E0%A6%B0%20%E0%A6%9A%E0%A7%8D%E0%A6%AF%E0%A6%BE%E0%A6%B2%E0%A7%87%E0%A6%9E%E0%A7%8D%E0%A6%9C",
  },
  {
    id: "v-podcast-fieldwork",
    title: {
      bn: "পডকাস্ট: মাঠে নামা দাঈরা — ফিল্ডওয়ার্ক অভিজ্ঞতা",
      en: "Podcast: Da'ees in the Field — Fieldwork Experiences",
    },
    playlist: { bn: "পডকাস্ট সিরিজ", en: "Podcast Series" },
    duration: "29:47",
    thumbnail: "/images/campus-fieldwork.png",
    youtubeUrl: "https://www.youtube.com/results?search_query=%E0%A6%86%E0%A6%B8-%E0%A6%B8%E0%A7%81%E0%A6%A8%E0%A7%8D%E0%A6%A8%E0%A6%BE%E0%A6%B9%20%E0%A6%A6%E0%A6%BE%E0%A6%93%E0%A6%AF%E0%A6%BC%E0%A6%BE%E0%A6%B9%20%E0%A6%AB%E0%A6%BF%E0%A6%B2%E0%A7%8D%E0%A6%A1%E0%A6%93%E0%A6%AF%E0%A6%BC%E0%A6%BE%E0%A6%B0%E0%A7%8D%E0%A6%95%20%E0%A6%85%E0%A6%AD%E0%A6%BF%E0%A6%9C%E0%A7%8D%E0%A6%9E%E0%A6%A4%E0%A6%BE",
  },
];

/** Photo gallery albums. */
export const galleryPhotos: GalleryPhoto[] = [
  {
    src: "/images/campus-library.png",
    alt: { bn: "ইনস্টিটিউট লাইব্রেরির অভ্যন্তর", en: "Interior of the institute library" },
    caption: { bn: "গবেষণা ও অধ্যয়নের জন্য বিষয়ভিত্তিক সমৃদ্ধ লাইব্রেরি।", en: "A subject-rich library for research and study." },
    album: { bn: "ক্যাম্পাস ও লাইব্রেরি", en: "Campus & Library" },
  },
  {
    src: "/images/campus-classroom.png",
    alt: { bn: "ক্লাসরুমে পাঠদানরত শিক্ষার্থী", en: "Students during a classroom session" },
    caption: { bn: "আধুনিক ক্লাসরুমে প্রতিদিনের পাঠদান।", en: "Daily lessons in modern classrooms." },
    album: { bn: "ক্যাম্পাস ও লাইব্রেরি", en: "Campus & Library" },
  },
  {
    src: "/images/campus-mosque.png",
    alt: { bn: "ক্যাম্পাস মসজিদের নামাজ হল", en: "Campus mosque prayer hall" },
    caption: { bn: "পাঁচ ওয়াক্ত জামাতে নামাজ আদায়ের আধ্যাত্মিক পরিবেশ।", en: "A spiritual environment of five daily congregational prayers." },
    album: { bn: "ক্যাম্পাস ও লাইব্রেরি", en: "Campus & Library" },
  },
  {
    src: "/images/student-debate.png",
    alt: { bn: "আন্তঃশ্রেণি বিতর্ক প্রতিযোগিতা", en: "Inter-class debate competition" },
    caption: { bn: "বুদ্ধিবৃত্তিক চর্চার অংশ হিসেবে বিতর্ক ও প্যানেল ডিসকাশন।", en: "Debates and panel discussions as part of intellectual practice." },
    album: { bn: "বার্ষিক দাওয়াহ ফিল্ডওয়ার্ক ও কার্যক্রম", en: "Annual Dawah Fieldwork & Activities" },
  },
  {
    src: "/images/campus-fieldwork.png",
    alt: { bn: "দাওয়াহ ফিল্ডওয়ার্কে শিক্ষার্থীরা", en: "Students during dawah fieldwork" },
    caption: { bn: "১ সপ্তাহ ব্যাপী ফিল্ডওয়ার্কে সাধারণ মানুষের মাঝে দাওয়াতি কার্যক্রম।", en: "Week-long fieldwork bringing the message of Islam to the public." },
    album: { bn: "বার্ষিক দাওয়াহ ফিল্ডওয়ার্ক ও কার্যক্রম", en: "Annual Dawah Fieldwork & Activities" },
  },
  {
    src: "/images/campus-seminar.png",
    alt: { bn: "বার্ষিক সেমিনার", en: "Annual seminar" },
    caption: { bn: "দেশ-বিদেশের বরেণ্য আলেমদের অংশগ্রহণে সেমিনার।", en: "Seminars with renowned scholars from home and abroad." },
    album: { bn: "সেমিনার ও সমাবেশ", en: "Seminars & Gatherings" },
  },
  {
    src: "/images/campus-graduation.png",
    alt: { bn: "স্নাতকোত্তর সমাপনী ও শুভেচ্ছা অনুষ্ঠান", en: "Graduation and convocation ceremony" },
    caption: { bn: "PGDID ও CCIS ব্যাচের সমাপনী অনুষ্ঠান।", en: "Convocation of the PGDID and CCIS batches." },
    album: { bn: "সেমিনার ও সমাবেশ", en: "Seminars & Gatherings" },
  },
  {
    src: "/images/azan-training.png",
    alt: { bn: "আযান প্রশিক্ষণ সেশন", en: "Azan training session" },
    caption: { bn: "আযান প্রশিক্ষণ কার্যক্রমে মাখরাজ ও সুরের অনুশীলন।", en: "Makhraj and melody practice at the Azan training program." },
    album: { bn: "আযান প্রশিক্ষণ সেশন", en: "Azan Training Sessions" },
  },
  {
    src: "/images/study-circle.png",
    alt: { bn: "পাঠচক্র চলাকালে", en: "During a study circle" },
    caption: { bn: "নির্দিষ্ট বইয়ের ওপর নিয়মিত গ্রুপ স্টাডি।", en: "Regular group study on selected books." },
    album: { bn: "ক্যাম্পাস ও লাইব্রেরি", en: "Campus & Library" },
  },
  {
    src: "/images/hero-campus.png",
    alt: { bn: "সাঁতারকুল ক্যাম্পাস", en: "Satarkul campus" },
    caption: { bn: "সাঁতারকুল, বাড্ডায় অবস্থিত আবাসিক ক্যাম্পাস।", en: "The residential campus at Satarkul, Badda." },
    album: { bn: "ক্যাম্পাস ও লাইব্রেরি", en: "Campus & Library" },
  },
  {
    src: "/images/news-agreement.png",
    alt: { bn: "গবেষণা সহযোগিতা চুক্তি স্বাক্ষর", en: "Research cooperation agreement signing" },
    caption: { bn: "গবেষণা প্রতিষ্ঠানের সঙ্গে সহযোগিতা চুক্তি স্বাক্ষর অনুষ্ঠান।", en: "Signing of a cooperation agreement with a research institute." },
    album: { bn: "সেমিনার ও সমাবেশ", en: "Seminars & Gatherings" },
  },
  {
    src: "/images/blog-science.png",
    alt: { bn: "সায়েন্টিজম নিয়ে প্রকাশনা", en: "Publication on scientism" },
    caption: { bn: "ইনস্টিটিউট জার্নালে প্রকাশিত সায়েন্টিজম-বিষয়ক প্রবন্ধ।", en: "An article on scientism published in the institute journal." },
    album: { bn: "প্রকাশনা ও গবেষণা", en: "Publications & Research" },
  },
];

/** News & events feed. */
export const newsItems: NewsItem[] = [
  {
    id: "n-agreement",
    title: { bn: "গবেষণা সহযোগিতায় দ্বিপাক্ষিক চুক্তি স্বাক্ষর", en: "Bilateral Agreement Signed for Research Cooperation" },
    excerpt: {
      bn: "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট ও একটি আন্তর্জাতিক গবেষণা প্রতিষ্ঠানের মধ্যে যৌথ গবেষণা ও ফেলোশিপ বিনিময় চুক্তি সম্পন্ন হয়েছে।",
      en: "A joint research and fellowship exchange agreement has been completed between the institute and an international research organization.",
    },
    date: "2026-01-15",
    location: { bn: "ইনস্টিটিউট ক্যাম্পাস, সাঁতারকুল", en: "Institute Campus, Satarkul" },
    cover: "/images/news-agreement.png",
    body: [
      {
        bn: "চুক্তির আওতায় উভয় প্রতিষ্ঠানের গবেষকরা সমকালীন চিন্তাগত চ্যালেঞ্জ বিষয়ে যৌথ প্রকল্প পরিচালনা করবেন এবং বার্ষিক জার্নালে প্রবন্ধ বিনিময়ের সুযোগ পাবেন।",
        en: "Under the agreement, researchers of both institutes will run joint projects on contemporary intellectual challenges with annual journal article exchange.",
      },
      {
        bn: "অনুষ্ঠানে প্রধান অতিথি ছিলেন ইনস্টিটিউটের চেয়ারম্যান শায়খ আহমাদুল্লাহ। ইনচার্জ খালেদ মুহাম্মাদ সাইফুল্লাহ ও গবেষণা বোর্ডের সদস্যবৃন্দ উপস্থিত ছিলেন।",
        en: "Chairman Shaykh Ahmadullah graced the event as chief guest, with In-Charge Khaled Muhammad Saifullah and the research board in attendance.",
      },
    ],
    upcoming: false,
  },
  {
    id: "n-azan-batch",
    title: { bn: "আযান প্রশিক্ষণ কর্মশালা: নতুন ব্যাচের নিবন্ধন শুরু", en: "Azan Training Workshop: New Batch Registration Open" },
    excerpt: {
      bn: "১৫ দিন মেয়াদি আযান প্রশিক্ষণ প্রোগ্রামের ৩য় ব্যাচে নিবন্ধন চলছে — হাফেজ/আলেম/নাহবেমীর পর্যায়ের আগ্রহীদের আবেদন করতে বলা হচ্ছে।",
      en: "Registration is open for the 3rd batch of the 15-day Azan Training Program — Hafiz/Alim/Nahbemi-level applicants are encouraged to apply.",
    },
    date: "2026-02-20",
    location: { bn: "আবাসিক ক্যাম্পাস, সাঁতারকুল", en: "Residential Campus, Satarkul" },
    cover: "/images/azan-training.png",
    body: [
      {
        bn: "প্রশিক্ষণে থাকছে মাখরাজভিত্তিক বিশুদ্ধ উচ্চারণ, বিশ্ববিখ্যাত ৫টি সুরের অনুশীলন, কণ্ঠের যত্ন ও মুয়াযযিনের তারবিয়াহ।",
        en: "The training covers Makhraj-based pronunciation, practice on five world-famous melodies, vocal care, and the Muezzin's tarbiyah.",
      },
      {
        bn: "আবেদন করতে নোটিশ বোর্ডের বিজ্ঞপ্তি দেখুন অথবা অফিসে যোগাযোগ করুন (সকাল ৯টা–বিকাল ৫টা)।",
        en: "See the notice board circular or contact the office (9 AM–5 PM) to apply.",
      },
    ],
    upcoming: true,
  },
  {
    id: "n-graduation",
    title: { bn: "PGDID ২য় ব্যাচের সমাপনী অনুষ্ঠান অনুষ্ঠিত", en: "PGDID 2nd Batch Convocation Held" },
    excerpt: {
      bn: "পোস্ট গ্রাজুয়েট ডিপ্লোমা ইন ইসলামিক দাওয়াহর ২য় ব্যাচের ২৯ জন শিক্ষার্থী সফলভাবে উত্তীর্ণ হয়েছেন।",
      en: "29 students of the 2nd Post Graduate Diploma in Islamic Dawah batch have successfully graduated.",
    },
    date: "2025-12-10",
    location: { bn: "কেন্দ্রীয় মিলনায়তন, ঢাকা", en: "Central Auditorium, Dhaka" },
    cover: "/images/campus-graduation.png",
    body: [
      {
        bn: "অনুষ্ঠানে শিক্ষার্থীদের হাতে তুলে দেওয়া হয় সার্টিফিকেট এবং শ্রেষ্ঠ গবেষণা প্রবন্ধের পুরস্কার।",
        en: "Certificates and awards for best research papers were handed to the students at the ceremony.",
      },
    ],
    upcoming: false,
  },
  {
    id: "n-library-expansion",
    title: { bn: "লাইব্রেরিতে নতুন ১০০০ বইয়ের সংগ্রহ প্রকল্প শুরু", en: "Project Launched: 1,000 New Books for the Library" },
    excerpt: {
      bn: "গবেষণা সুবিধা বাড়াতে লাইব্রেরিতে আরবি, ইংরেজি ও বাংলা — তিন ভাষার ১০০০ নতুন বই সংগ্রহের প্রকল্প ঘোষণা করা হয়েছে।",
      en: "A project to acquire 1,000 new Arabic, English, and Bangla books has been announced to expand research facilities.",
    },
    date: "2026-03-01",
    location: null,
    cover: "/images/campus-library.png",
    body: [
      {
        bn: "স্বচ্ছতার সঙ্গে প্রকল্পটির অগ্রগতি সাপোর্ট পেজের লাইভ ফান্ডিং ট্র্যাকারে দেখা যাবে।",
        en: "Project progress will be visible on the live funding tracker on the Support page.",
      },
      {
        bn: "দাতাগণ সাধারণ অনুদান কিংবা স্কলারশিপ ফান্ডের মাধ্যমে এ প্রকল্পে অংশ নিতে পারবেন।",
        en: "Donors may participate through the general donation or scholarship funds.",
      },
    ],
    upcoming: true,
  },
];

/** Alumni batch statistics. */
export const alumniBatches = [
  {
    program: { bn: "পোস্ট গ্রাজুয়েট ডিপ্লোমা ইন ইসলামিক দাওয়াহ (PGDID)", en: "Post Graduate Diploma in Islamic Dawah (PGDID)" },
    batches: [
      { batch: { bn: "১ম ব্যাচ", en: "1st Batch" }, count: 20 },
      { batch: { bn: "২য় ব্যাচ", en: "2nd Batch" }, count: 29 },
    ],
  },
  {
    program: { bn: "সার্টিফিকেট কোর্স ইন ইসলামিক স্টাডিজ (CCIS)", en: "Certificate Course in Islamic Studies (CCIS)" },
    batches: [{ batch: { bn: "১ম ব্যাচ", en: "1st Batch" }, count: 29 }],
  },
  {
    program: { bn: "আরবি ভাষা শিক্ষক প্রশিক্ষণ (Teachers Training)", en: "Arabic Language Teacher Training" },
    batches: [{ batch: { bn: "১ম ব্যাচ", en: "1st Batch" }, count: 26 }],
  },
] as const;

export const alumniIntro = {
  bn: "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউটের প্রাক্তন শিক্ষার্থীরা কেবল একাডেমিক সার্টিফিকেটধারী নন; তারা প্রত্যেকেই উম্মাহ-দরদী একজন দাঈ ও গবেষক। আমাদের অ্যালামনাইরা বর্তমানে দেশের বিভিন্ন স্তরে ইসলামের বিশুদ্ধ জ্ঞান প্রসারে এবং সমকালীন ফিতনা মোকাবিলায় লেখালেখি বা বক্তব্যের মাধ্যমে সক্রিয় ভূমিকা পালন করছেন। আমরা আমাদের প্রতিটি প্রাক্তন শিক্ষার্থীর উত্তরোত্তর সাফল্য ও বরকতময় জীবন কামনা করি।",
  en: "Our alumni are not merely certificate holders — each is an ummah-conscious da'ee and researcher, actively serving through writing and speech against contemporary fitnah at every level of society. We pray for their continued success.",
} as const;

/** Zakat-eligible privacy-protected student sponsorship list. */
export const sponsorStudents = [
  { id: "AS-101", classYear: { bn: "PYS ১ম বর্ষ", en: "PYS Year 1" }, district: { bn: "রংপুর", en: "Rangpur" }, needLevel: "high" as const, monthlyCost: 6000 },
  { id: "AS-104", classYear: { bn: "PYS ১ম বর্ষ", en: "PYS Year 1" }, district: { bn: "রংপুর", en: "Rangpur" }, needLevel: "high" as const, monthlyCost: 6000 },
  { id: "AS-108", classYear: { bn: "PYS ১ম বর্ষ", en: "PYS Year 1" }, district: { bn: "কুমিল্লা", en: "Cumilla" }, needLevel: "medium" as const, monthlyCost: 5500 },
  { id: "AS-112", classYear: { bn: "CCIS ৩য় ব্যাচ", en: "CCIS Batch 3" }, district: { bn: "নোয়াখালী", en: "Noakhali" }, needLevel: "high" as const, monthlyCost: 5000 },
  { id: "AS-117", classYear: { bn: "CCIS ৩য় ব্যাচ", en: "CCIS Batch 3" }, district: { bn: "ঢাকা", en: "Dhaka" }, needLevel: "medium" as const, monthlyCost: 5000 },
  { id: "AS-121", classYear: { bn: "ডিপ্লোমা ১ম সেমিস্টার", en: "Diploma Semester 1" }, district: { bn: "সিলেট", en: "Sylhet" }, needLevel: "high" as const, monthlyCost: 6500 },
  { id: "AS-124", classYear: { bn: "ডিপ্লোমা ১ম সেমিস্টার", en: "Diploma Semester 1" }, district: { bn: "বরিশাল", en: "Barishal" }, needLevel: "high" as const, monthlyCost: 6500 },
  { id: "AS-129", classYear: { bn: "ডিপ্লোমা ৩য় সেমিস্টার", en: "Diploma Semester 3" }, district: { bn: "চট্টগ্রাম", en: "Chattogram" }, needLevel: "medium" as const, monthlyCost: 6000 },
];
