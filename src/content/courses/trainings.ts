import type { Course } from "@/types";

/* ————— 4. Arabic Language Teacher Training ————— */

export const arabicTeacherTraining: Course = {
  slug: "arabic-language-teacher-training",
  titleBn: "আরবি ভাষা শিক্ষক প্রশিক্ষণ প্রোগ্রাম",
  titleEn: "Arabic Language Teacher Training",
  titleAr: "برنامج تدريب المعلمين على اللغة العربية",
  kind: "training",
  tagline: {
    bn: "আরবি ভাষাবিদ ও আলেমদের জন্য আধুনিক শিক্ষণ পদ্ধতির প্রশিক্ষণ",
    en: "Modern pedagogy training for Arabic linguists and Ulama",
  },
  summary: {
    bn: "আরবি জানা আলেমকে আধুনিক ও ইসলামিক শিক্ষাপ্রতিষ্ঠানের উপযোগী স্মার্ট শিক্ষক হিসেবে গড়ে তোলার ১৫ দিনের নবিশ প্রশিক্ষণ — CLT পদ্ধতি, শিশু মনস্তত্ত্ব ও ডিজিটাল প্রযুক্তি ব্যবহারে দক্ষতা।",
    en: "A 15-day intensive turning Arabic-knowing Ulama into smart teachers for modern Islamic institutions — CLT methods, child psychology, and educational technology.",
  },
  durationLabel: { bn: "১৫ দিন", en: "15 Days" },
  eligibilityLabel: { bn: "তাকমিল / ফাযিল / আরবি স্নাতক", en: "Takmil / Fazil / Arabic graduate" },
  featured: false,
  icon: "languages",
  accentClass: "from-emerald-600 to-teal-800",
  details: {
    intro: {
      bn: "এই কোর্সটি মূলত সেসব আরবি ভাষাবিদ ও আলেমদের জন্য ডিজাইন করা হয়েছে, যারা ইংলিশ মিডিয়াম, মডার্ন ইসলামিক স্কুল বা মাদানি নেসাবে আরবি ভাষার শিক্ষক হিসেবে সফল ক্যারিয়ার গড়তে চান। কোর্সে আরবি ভাষার কোনো বেসিক শেখানো হবে না, বরং একজন আরবি জানা আলেমকে কীভাবে আধুনিক ও ইসলামিক শিক্ষাপ্রতিষ্ঠানের উপযোগী স্মার্ট শিক্ষক হিসেবে গড়ে তোলা যায় — তার ওপর ফোকাস করা হয়েছে।",
      en: "Designed for Arabic linguists and Ulama who want teaching careers at English-medium or modern Islamic schools. Rather than teaching Arabic basics, it focuses on turning an Arabic-knowing scholar into a smart, modern teacher.",
    },
    objectives: [
      { bn: "আধুনিক ও কার্যকর পাঠদান পদ্ধতিতে (CLT) শিক্ষকদের দক্ষতা বৃদ্ধি করা।", en: "Enhance teaching skills with modern, effective (CLT) methodology." },
      { bn: "যোগাযোগ দক্ষতা, শিশু মনস্তত্ত্ব এবং ক্লাসরুম ম্যানেজমেন্টের জ্ঞান প্রদান।", en: "Provide communication skills, child psychology, and classroom management knowledge." },
      { bn: "প্রযুক্তিগত প্রশিক্ষণের মাধ্যমে শিক্ষকদের আত্মবিশ্বাসী করে তোলা।", en: "Build teacher confidence through educational technology training." },
    ],
    kind: { bn: "আবাসিক/অনাবাসিক, শুধুমাত্র পুরুষদের জন্য", en: "Residential/non-residential, male students only" },
    duration: { bn: "১৫ দিন", en: "15 days" },
    accommodation: { bn: "আবাসিক ও অনাবাসিক — উভয়ই", en: "Both residential and non-residential" },
    eligibility: [
      {
        bn: "কওমি থেকে তাকমিল, আলিয়া থেকে ফাযিল ও আরবি বিশ্ববিদ্যালয় থেকে স্নাতকে (জায়্যিদ জিদ্দান (A) বা তদূর্ধ্ব নম্বর) উত্তীর্ণ।",
        en: "Khowmi Takmil, Alia Fazil, or Arabic university bachelor's with Jayyid Jiddan (A) grade or above.",
      },
    ],
    curriculum: [
      {
        label: { bn: "প্রশিক্ষণের মডিউলসমূহ", en: "Training Modules" },
        note: null,
        totalCredits: 0,
        totalMarks: 0,
        courses: [
          { code: "AT-01", title: { bn: "প্রফেশনালিজম অ্যান্ড পার্সোনাল ডেভেলপমেন্ট", en: "Professionalism and Personal Development" }, modules: [], credits: 0, marks: 0 },
          { code: "AT-02", title: { bn: "অনারবদের জন্য আরবি ভাষা শিক্ষণ কারিকুলাম", en: "Arabic Teaching Curriculum for Non-Arabs" }, modules: [], credits: 0, marks: 0 },
          { code: "AT-03", title: { bn: "প্রারম্ভিক শিশুশিক্ষার কৌশল (আর্লি চাইল্ডহুড)", en: "Early Childhood Education Strategies" }, modules: [], credits: 0, marks: 0 },
          { code: "AT-04", title: { bn: "ল্যাঙ্গুয়েজ পেডাগজি", en: "Language Pedagogy" }, modules: [], credits: 0, marks: 0 },
          { code: "AT-05", title: { bn: "মাইক্রো-টিচিং", en: "Micro-teaching" }, modules: [], credits: 0, marks: 0 },
          { code: "AT-06", title: { bn: "ক্লাসরুম ডেমনস্ট্রেশন", en: "Classroom Demonstration" }, modules: [], credits: 0, marks: 0 },
          { code: "AT-07", title: { bn: "ক্যারিয়ার গাইডেন্স", en: "Career Guidance" }, modules: [], credits: 0, marks: 0 },
          { code: "AT-08", title: { bn: "এডুকেশনাল টেকনোলজি", en: "Educational Technology" }, modules: [], credits: 0, marks: 0 },
        ],
      },
    ],
    extraSections: [],
    outcomes: [
      { bn: "আধুনিক ইসলামিক স্কুল ও মাদানি নেসাবে আরবি শিক্ষক হিসেবে ক্যারিয়ার।", en: "A teaching career at modern Islamic schools and madani curricula." },
    ],
  },
};

/* ————— 5. Ramadan Dawah Training ————— */

export const ramadanTraining: Course = {
  slug: "ramadan-dawah-training",
  titleBn: "রমাদান উপলক্ষে দাওয়াহ প্রশিক্ষণ",
  titleEn: "Ramadan Dawah Training",
  kind: "training",
  tagline: {
    bn: "যুগের চ্যালেঞ্জ মোকাবিলায় দক্ষ দাঈ গড়ার ২০ দিনের প্রশিক্ষণ",
    en: "A 20-day program building capable da'ees for contemporary challenges",
  },
  summary: {
    bn: "সমসাময়িক ২৫টি বিষয়ের ওপর হাতে-কলমে প্রশিক্ষণ — পাবলিক স্পিকিং, সংশয়বাদ মোকাবিলা, নারীবাদ, LGBTQ ফিতনা, সায়েন্টিজমসহ সমকালীন চিন্তাগত চ্যালেঞ্জের ব্যবহারিক জবাব।",
    en: "Hands-on training across 25 contemporary topics — public speaking, skepticism, feminism, the LGBTQ fitnah, scientism, and practical responses to modern intellectual challenges.",
  },
  durationLabel: { bn: "২০ দিন", en: "20 Days" },
  eligibilityLabel: { bn: "তাকমিল / ফাযিল / অনার্স-মাস্টার্স (৭০%+)", en: "Takmil / Fazil / Honours-Masters (70%+)" },
  featured: false,
  icon: "mic-vocal",
  accentClass: "from-amber-700 to-emerald-900",
  details: {
    intro: {
      bn: "বাংলাদেশে দাওয়াহ অঙ্গনে কর্মরত অনেকের মধ্যে প্রায়োগিক দক্ষতার ঘাটতি পরিলক্ষিত হয়, যা কখনও কখনও সামগ্রিকভাবে আলেম সমাজের জন্য বিব্রতকর পরিস্থিতির সৃষ্টি করে। এই বাস্তবতা বিবেচনায় নিয়ে মুসলিম উম্মাহর বিবেক জাগ্রত করার লক্ষ্যে যুগের চ্যালেঞ্জ মোকাবিলায় সক্ষম, জ্ঞানসমৃদ্ধ ও দক্ষ দাঈ গড়ে তোলার উদ্দেশ্যে এই প্রশিক্ষণ কর্মসূচির আয়োজন করা হয়।",
      en: "Many dawah workers in Bangladesh lack practical skills, sometimes creating embarrassing situations for the scholarly community. This program addresses that reality — awakening the ummah's conscience by building capable, knowledgeable, skilled preachers.",
    },
    objectives: [
      { bn: "দাওয়াহর জ্ঞান অর্জনে আগ্রহী সর্বসাধারণের জন্য একটি নির্ভরযোগ্য প্ল্যাটফর্ম তৈরি।", en: "Build a reliable platform for everyone eager to learn dawah." },
      { bn: "কর্মজীবনের পাশাপাশি প্রত্যেক মুসলিমকে নিজ অঙ্গনে কার্যকর দাঈ হিসেবে গড়ে তোলা।", en: "Enable every Muslim to become an effective da'ee in their own sphere." },
      { bn: "প্রায়োগিক ও যুগোপযোগী প্রশিক্ষণের মাধ্যমে সমসাময়িক চ্যালেঞ্জ মোকাবিলায় সক্ষম করা।", en: "Equip students to face contemporary challenges through applied training." },
    ],
    kind: { bn: "আবাসিক/অনাবাসিক, শুধুমাত্র পুরুষদের জন্য", en: "Residential/non-residential, male students only" },
    duration: { bn: "২০ দিন", en: "20 days" },
    accommodation: { bn: "আবাসিক ও অনাবাসিক — উভয়ই", en: "Both residential and non-residential" },
    eligibility: [
      {
        bn: "কওমি থেকে তাকমীল, আলিয়া থেকে ফাযিল-কামিল এবং বিশ্ববিদ্যালয় থেকে অনার্স-মাস্টার্সে অন্তত ৭০% নম্বর পেয়ে উত্তীর্ণ।",
        en: "Khowmi Takmil, Alia Fazil-Kamil, or university Honours-Masters with at least 70% marks.",
      },
    ],
    curriculum: [
      {
        label: { bn: "প্রশিক্ষণের বিষয়সমূহ (২৫টি)", en: "Training Topics (25)" },
        note: null,
        totalCredits: 0,
        totalMarks: 0,
        courses: [
          { code: "RD-01", title: { bn: "কনফ্লিক্ট ম্যানেজমেন্ট", en: "Conflict Management" }, modules: [], credits: 0, marks: 0 },
          { code: "RD-02", title: { bn: "ইমোশনাল ইন্টেলিজেন্স", en: "Emotional Intelligence" }, modules: [], credits: 0, marks: 0 },
          { code: "RD-03", title: { bn: "ধর্মত্যাগ ও পশ্চিমা সংস্কৃতির বিভ্রম", en: "Apostasy & the Illusions of Western Culture" }, modules: [], credits: 0, marks: 0 },
          { code: "RD-04", title: { bn: "টাইম ম্যানেজমেন্ট", en: "Time Management" }, modules: [], credits: 0, marks: 0 },
          { code: "RD-05", title: { bn: "ম্যানারস এন্ড এটিকেট", en: "Manners and Etiquette" }, modules: [], credits: 0, marks: 0 },
          { code: "RD-06", title: { bn: "পাবলিক স্পিকিং", en: "Public Speaking" }, modules: [], credits: 0, marks: 0 },
          { code: "RD-07", title: { bn: "ইফেক্টিভ কমিউনিকেশন", en: "Effective Communication" }, modules: [], credits: 0, marks: 0 },
          { code: "RD-08", title: { bn: "লিডারশিপ, দাওয়াহ ও মনস্তত্ত্ব", en: "Leadership, Dawah and Psychology" }, modules: [], credits: 0, marks: 0 },
          { code: "RD-09", title: { bn: "দ্বীন প্রচারে মিডিয়া ও মাঠ: কিছু বিবেচনা", en: "Media & Field in Dawah: Considerations" }, modules: [], credits: 0, marks: 0 },
          { code: "RD-10", title: { bn: "প্রাচ্যবিদদের ইসলাম চর্চা ও পশ্চিমা আগ্রাসন", en: "Orientalist Studies of Islam & Western Aggression" }, modules: [], credits: 0, marks: 0 },
          { code: "RD-11", title: { bn: "অর্থনীতি, পুঁজিবাদ ও ইসলাম", en: "Economics, Capitalism and Islam" }, modules: [], credits: 0, marks: 0 },
          { code: "RD-12", title: { bn: "নবীদের দাওয়াতি পদ্ধতি", en: "Prophetic Methods of Dawah" }, modules: [], credits: 0, marks: 0 },
          { code: "RD-13", title: { bn: "দাঈর ব্যক্তিত্ব ও গুণাবলি", en: "The Da'ee's Personality and Qualities" }, modules: [], credits: 0, marks: 0 },
          { code: "RD-14", title: { bn: "সায়েন্টিজম: ইসলাম ও বিজ্ঞানের সংঘাত/বিজ্ঞান ও বিজ্ঞানবাদ", en: "Scientism: Islam vs Science / Science vs Scientism" }, modules: [], credits: 0, marks: 0 },
          { code: "RD-15", title: { bn: "বাংলাদেশ ও ইসলাম: আত্মপরিচয়ের সন্ধানে", en: "Bangladesh and Islam: In Search of Identity" }, modules: [], credits: 0, marks: 0 },
          { code: "RD-16", title: { bn: "সেকুলারিজম", en: "Secularism" }, modules: [], credits: 0, marks: 0 },
          { code: "RD-17", title: { bn: "মুসলিম উম্মাহর পতনে বিশ্বের কী ক্ষতি হলো", en: "What the World Lost in the Ummah's Decline" }, modules: [], credits: 0, marks: 0 },
          { code: "RD-18", title: { bn: "ইসলামে নারীর অধিকার ও নারীবাদী ফেতনা", en: "Women's Rights in Islam & the Feminist Fitnah" }, modules: [], credits: 0, marks: 0 },
          { code: "RD-19", title: { bn: "প্যারেন্টিং", en: "Parenting" }, modules: [], credits: 0, marks: 0 },
          { code: "RD-20", title: { bn: "অমুসলিমদের মাঝে দাওয়াহ: পথ-পদ্ধতি", en: "Dawah Among Non-Muslims: Approaches" }, modules: [], credits: 0, marks: 0 },
          { code: "RD-21", title: { bn: "কাদিয়ানি মতবাদ ও খতমে নবুওয়াত", en: "Qadiyani Doctrine & the Finality of Prophethood" }, modules: [], credits: 0, marks: 0 },
          { code: "RD-22", title: { bn: "সংশয়বাদ ও নাস্তিক্যবাদ: মোকাবিলা এবং উত্তরণের উপায়", en: "Skepticism & Atheism: Confrontation and Resolution" }, modules: [], credits: 0, marks: 0 },
          { code: "RD-23", title: { bn: "LGBTQ ও জেন্ডার ফিতনা: ভয়াবহতা ও জরুরী নিবেদন", en: "LGBTQ & Gender Fitnah: Gravity and Urgent Appeal" }, modules: [], credits: 0, marks: 0 },
          { code: "RD-24", title: { bn: "ইসলামি ইতিহাসের ভৌগোলিক পরিচিতি", en: "Geographical Introduction to Islamic History" }, modules: [], credits: 0, marks: 0 },
          { code: "RD-25", title: { bn: "দাওয়াহ ও মার্কেটিং", en: "Dawah and Marketing" }, modules: [], credits: 0, marks: 0 },
        ],
      },
    ],
    extraSections: [],
    outcomes: [
      { bn: "সমকালীন ফিতনা ও চিন্তাগত বিভ্রান্তির ব্যবহারিক জবাব দেওয়ার দক্ষতা।", en: "Practical skills to respond to contemporary fitnah and intellectual confusion." },
    ],
  },
};

/* ————— 6. Azan Training Program ————— */

export const azanTraining: Course = {
  slug: "azan-training-program",
  titleBn: "আযান প্রশিক্ষণ প্রোগ্রাম",
  titleEn: "Azan Training Program",
  kind: "training",
  tagline: {
    bn: "আদর্শ ও দক্ষ মুয়াযযিন গড়ার প্রশিক্ষণ",
    en: "Training to build ideal, skilled Muezzins",
  },
  summary: {
    bn: "শুধু সুর নয় — শব্দের বিশুদ্ধ উচ্চারণ (মাখরাজ), সংশ্লিষ্ট মাসআলা-মাসায়েল, কণ্ঠের যত্ন ও মুয়াযযিনের ব্যক্তিত্ব গঠনের ওপর ১৫ দিনের বিশেষ প্রশিক্ষণ।",
    en: "Beyond melody — a 15-day program on perfect pronunciation (Makhraj), related rulings, vocal care, and the Muezzin's character development.",
  },
  durationLabel: { bn: "১৫ দিন", en: "15 Days" },
  eligibilityLabel: { bn: "হাফেজ / আলেম / নাহবেমী", en: "Hafiz / Alim / Nahbemi" },
  featured: false,
  icon: "bell-ring",
  accentClass: "from-teal-600 to-emerald-800",
  details: {
    intro: {
      bn: "এই প্রশিক্ষণটি সাজানো হয়েছে একজন মুয়াযযিনকে আদর্শ ও দক্ষ হিসেবে গড়ে তোলার জন্য। এখানে কেবল আযানের সুর-ই নয়, বরং শব্দের বিশুদ্ধ উচ্চারণ (মাখরাজ), সংশ্লিষ্ট মাসআলা-মাসায়েল এবং একজন মুয়াযযিনের ব্যক্তিগত আমল ও উন্নত ব্যক্তিত্ব গঠনের ওপর বিশেষ গুরুত্বারোপ করা হয়।",
      en: "This program is structured to build an ideal, skilled Muezzin — focusing not only on melody but also on correct pronunciation (Makhraj), relevant rulings, personal worship, and character.",
    },
    objectives: [
      { bn: "সুমধুর সুর ও বিশুদ্ধ উচ্চারণের মাধ্যমে বাংলাদেশে আযানের একটি মানসম্মত ধারা তৈরি করা।", en: "Establish a standard of melodious, correctly-pronounced adhan in Bangladesh." },
      { bn: "আযানের ধ্বনির মাধ্যমে মানুষের অন্তরে ইসলামের প্রতি গভীর অনুরাগ সৃষ্টি করা।", en: "Awaken deep love for Islam in hearts through the sound of the adhan." },
      { bn: "মুয়াজ্জিনকে সমাজের একজন আদর্শ 'দাঈ' ও পথপ্রদর্শক হিসেবে গড়ে তোলা।", en: "Shape the Muezzin into a role-model da'ee and guide in society." },
    ],
    kind: { bn: "আবাসিক/অনাবাসিক, শুধুমাত্র পুরুষদের জন্য", en: "Residential/non-residential, male students only" },
    duration: { bn: "১৫ দিন", en: "15 days" },
    accommodation: { bn: "আবাসিক ও অনাবাসিক — উভয়ই", en: "Both residential and non-residential" },
    eligibility: [
      { bn: "হাফেজ/আলেম অথবা নাহবেমীর/দাখিল কিংবা তদূর্ধ্ব পর্যায়ের শিক্ষার্থী হতে হবে।", en: "Hafiz/Alim, or a student at Nahbemi/Dakhil level or above." },
      { bn: "মুয়াযযিন হিসেবে কর্মরত অথবা এই পেশায় আগ্রহী হতে হবে।", en: "Currently serving or interested in serving as a Muezzin." },
      { bn: "অবশ্যই কণ্ঠে সুর এবং তা রপ্ত করার যোগ্যতা থাকতে হবে।", en: "Must have a melodic voice and the ability to master it." },
    ],
    curriculum: [
      {
        label: { bn: "প্রশিক্ষণ কারিকুলাম", en: "Training Curriculum" },
        note: null,
        totalCredits: 0,
        totalMarks: 0,
        courses: [
          { code: "AZ-01", title: { bn: "আযান ও ইক্বামাতের প্রতিটি শব্দের নিখুঁত ও বিশুদ্ধ উচ্চারণ নিশ্চিতকরণ", en: "Perfecting every word of Adhan & Iqamah" }, modules: [], credits: 0, marks: 0 },
          { code: "AZ-02", title: { bn: "আযান ও ইক্বামাত সংশ্লিষ্ট মাসআলা-মাসায়েল", en: "Rulings related to Adhan & Iqamah" }, modules: [], credits: 0, marks: 0 },
          { code: "AZ-03", title: { bn: "মক্কা-মদিনার ঐতিহ্যবাহী সুরসহ বিশ্ববিখ্যাত ৫টি সুরের ওপর নিবিড় অনুশীলন", en: "Intensive practice on 5 world-famous melodies incl. Makkah & Madinah" }, modules: [], credits: 0, marks: 0 },
          { code: "AZ-04", title: { bn: "কণ্ঠের বিশেষ যত্ন, দীর্ঘ শ্বাস নিয়ন্ত্রণ ও কণ্ঠের স্কেল ঠিক রাখার ব্যায়াম", en: "Vocal care, breath control, and scale-maintenance exercises" }, modules: [], credits: 0, marks: 0 },
          { code: "AZ-05", title: { bn: "দাঈর বৈশিষ্ট্য ও গুণাবলি", en: "Characteristics and qualities of a Da'ee" }, modules: [], credits: 0, marks: 0 },
          { code: "AZ-06", title: { bn: "তারবিয়াহ ও পার্সোনালিটি ডেভেলপমেন্ট", en: "Tarbiyah and personality development" }, modules: [], credits: 0, marks: 0 },
          { code: "AZ-07", title: { bn: "কমিউনিকেশন ও নেগোসিয়েশন স্কিল", en: "Communication and negotiation skills" }, modules: [], credits: 0, marks: 0 },
          { code: "AZ-08", title: { bn: "সাউন্ড সিস্টেম ম্যানেজমেন্ট", en: "Sound system management" }, modules: [], credits: 0, marks: 0 },
          { code: "AZ-09", title: { bn: "টাইম ম্যানেজমেন্ট", en: "Time management" }, modules: [], credits: 0, marks: 0 },
        ],
      },
    ],
    extraSections: [],
    outcomes: [
      { bn: "বিশুদ্ধ মাখরাজ ও সুমধুর সুরে আযান দেওয়ার সক্ষমতা।", en: "The ability to deliver the adhan with pure pronunciation and melody." },
    ],
  },
};

/* ————— 7. Islamic Research Methodology ————— */

export const researchMethodology: Course = {
  slug: "islamic-research-methodology",
  titleBn: "ইসলামিক রিসার্চ মেথডোলজি",
  titleEn: "Islamic Research Methodology",
  kind: "training",
  tagline: {
    bn: "গবেষণা পদ্ধতিবিদ্যায় প্রশিক্ষিত গবেষক তৈরির কোর্স",
    en: "Training researchers in rigorous research methodology",
  },
  summary: {
    bn: "ইসলামী জ্ঞানের গবেষণামূলক পদ্ধতি — উৎস যাচাই, তথ্য-উপাত্ত বিশ্লেষণ, গবেষণাপত্র রচনা ও একাডেমিক লেখালেখির প্রশিক্ষণ।",
    en: "Research methods for Islamic knowledge — source verification, data analysis, research writing, and academic composition.",
  },
  durationLabel: { bn: "স্বল্প মেয়াদী", en: "Short-term" },
  eligibilityLabel: { bn: "গবেষণায় আগ্রহী আলেম/শিক্ষার্থী", en: "Research-oriented Ulama/students" },
  featured: false,
  icon: "flask-conical",
  accentClass: "from-emerald-800 to-teal-900",
  details: {
    intro: {
      bn: "ইনস্টিটিউটের গবেষণা কার্যক্রমের ভিত্তি এই পদ্ধতিবিদ্যা কোর্স। এখানে শিক্ষার্থীরা ইসলামী জ্ঞানচর্চার প্রামাণ্য পদ্ধতি, উৎস সমালোচনা, সমকালীন গবেষণা পদ্ধতি ও একাডেমিক রচনার কৌশল শেখেন — যা PYS ও ডিপ্লোমা কোর্সের 'Research Methodology' মডিউলের সঙ্গে সমন্বিত।",
      en: "The methodological foundation of the institute's research program. Students learn evidential methods of Islamic scholarship, source criticism, contemporary research methods, and academic writing — integrated with the 'Research Methodology' module of the PYS and Diploma courses.",
    },
    objectives: [
      { bn: "প্রামাণ্য উৎস থেকে গবেষণার পদ্ধতি শেখা।", en: "Learn research grounded in authoritative sources." },
      { bn: "সমকালীন একাডেমিক মানে প্রবন্ধ রচনার দক্ষতা অর্জন।", en: "Acquire contemporary academic writing skills." },
    ],
    kind: { bn: "স্বল্প মেয়াদী প্রশিক্ষণ", en: "Short-term training" },
    duration: { bn: "স্বল্প মেয়াদী (বিজ্ঞপ্তি অনুযায়ী)", en: "Short-term (as announced)" },
    accommodation: { bn: "কোর্স বিজ্ঞপ্তি অনুযায়ী", en: "As per course announcement" },
    eligibility: [
      { bn: "গবেষণায় আগ্রহী আলেম ও উচ্চশিক্ষিত শিক্ষার্থী।", en: "Research-oriented Ulama and highly educated students." },
    ],
    curriculum: [],
    extraSections: [],
    outcomes: [
      { bn: "ইনস্টিটিউট জার্নালে প্রবন্ধ প্রকাশের যোগ্যতা।", en: "Qualification to publish in the institute's journal." },
    ],
  },
};
