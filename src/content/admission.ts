import type { AdmissionStep, FaqGroup } from "@/types";

/** The structured 5-step admission process. */
export const admissionSteps: AdmissionStep[] = [
  {
    step: 1,
    title: { bn: "অনলাইন আবেদন", en: "Online Application" },
    description: {
      bn: "আগ্রহী প্রার্থীদের প্রতিষ্ঠানের অফিসিয়াল ওয়েবসাইট বা সোশ্যাল মিডিয়া পেজে প্রকাশিত লিঙ্কের মাধ্যমে অনলাইনে আবেদন করতে হবে। আবেদন ফর্মে ব্যক্তিগত তথ্য ও শিক্ষাগত যোগ্যতার সঠিক বিবরণ প্রদান বাধ্যতামূলক।",
      en: "Interested candidates apply online via the link published on the official website or social media. Accurate personal and academic information is mandatory.",
    },
  },
  {
    step: 2,
    title: { bn: "প্রাথমিক যাচাই-বাছাই", en: "Primary Screening" },
    description: {
      bn: "আবেদনকারী শিক্ষার্থীদের মধ্য থেকে সংশ্লিষ্ট কোর্সের ক্রাইটেরিয়া বা মানদণ্ড (যেমন: পূর্ববর্তী পরীক্ষার ফলাফল ও দক্ষতা) অনুযায়ী প্রাথমিক তালিকা তৈরি করা হয়।",
      en: "A primary list is prepared by screening applicants against the course criteria (previous results and aptitude).",
    },
  },
  {
    step: 3,
    title: { bn: "লিখিত পরীক্ষা", en: "Written Test" },
    description: {
      bn: "প্রাথমিকভাবে নির্বাচিত প্রার্থীদের একটি নির্ধারিত দিনে লিখিত পরীক্ষায় অংশগ্রহণ করতে হয় — সংশ্লিষ্ট কোর্সের ক্রাইটেরিয়া অনুযায়ী (যেমন: বেসিক আরবী, সাধারণ ইসলামিয়াত ও সমকালীন জ্ঞান)।",
      en: "Shortlisted candidates sit a written test on a scheduled date — e.g. basic Arabic, general Islamic studies, and contemporary knowledge.",
    },
  },
  {
    step: 4,
    title: { bn: "মৌখিক পরীক্ষা (ভাইভা)", en: "Oral Interview (Viva)" },
    description: {
      bn: "লিখিত পরীক্ষায় উত্তীর্ণ নির্দিষ্ট সংখ্যক প্রার্থীকে চূড়ান্ত সাক্ষাৎকারের জন্য ডাকা হয়। এখানে প্রার্থীর ব্যক্তিত্ব, ভবিষ্যৎ পরিকল্পনা এবং কোর্স সম্পন্ন করার মানসিকতা যাচাই করা হয়।",
      en: "Successful written-test candidates are invited to a final interview assessing personality, future plans, and commitment to complete the course.",
    },
  },
  {
    step: 5,
    title: { bn: "চূড়ান্ত ভর্তি", en: "Final Admission" },
    description: {
      bn: "লিখিত ও মৌখিক পরীক্ষার সম্মিলিত ফলাফলের ভিত্তিতে চূড়ান্তভাবে নির্বাচিত শিক্ষার্থীদের ভর্তির সুযোগ প্রদান করা হয়।",
      en: "Based on the combined written and viva results, finally selected students are offered admission.",
    },
  },
];

/** Scholarship & financial aid copy. */
export const scholarshipInfo = {
  headline: {
    bn: "১০০% স্কলারশিপ — মেধাবী ও অস্বচ্ছল শিক্ষার্থীদের জন্য",
    en: "100% Scholarship — For Talented Students in Need",
  },
  body: [
    {
      bn: "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট মেধাবী অথচ আর্থিকভাবে অস্বচ্ছল শিক্ষার্থীদের জন্য শতভাগ (১০০%) স্কলারশিপের ব্যবস্থা করে থাকে। এই স্কলারশিপ কার্যক্রমটি আস-সুন্নাহ ফাউন্ডেশনের 'যাকাত ফান্ড' থেকে পরিচালিত হয়।",
      en: "The institute provides a 100% scholarship for talented students facing financial hardship, funded by the As-Sunnah Foundation 'Zakat Fund'.",
    },
    {
      bn: "আবেদনকারীকে অবশ্যই শরীয়াহ অনুযায়ী যাকাত গ্রহণের উপযুক্ত হতে হবে এবং এর সপক্ষে যথাযথ প্রমাণাদি পেশ করতে হবে। উপযুক্ততা প্রমাণের পর একজন শিক্ষার্থীর আবাসন, খাবার ও টিউশন ফিসহ যাবতীয় ব্যয়ভার ফাউন্ডেশন বহন করে।",
      en: "Applicants must be Shariah-eligible zakat recipients and provide supporting evidence. Once verified, the foundation covers accommodation, meals, and full tuition.",
    },
    {
      bn: "এছাড়া বিশেষ কিছু কোর্সের ক্ষেত্রে শিক্ষার্থীদের জন্য অতিরিক্ত 'শিক্ষাভাতা' ও 'যাতায়াত ভাতা' প্রদানেরও সুযোগ রয়েছে। আর্থিক অনটন যেন দ্বীনি জ্ঞান অর্জনের পথে কোনোভাবেই অন্তরায় না হয় — সেটিই আমাদের এই উদ্যোগের মূল লক্ষ্য।",
      en: "Selected courses also offer additional education and travel stipends. Our goal: financial hardship must never become an obstacle to seeking sacred knowledge.",
    },
  ],
} as const;

/** Campus facilities list. */
export const facilities = [
  {
    id: "residential",
    title: { bn: "আবাসিক ব্যবস্থাপনা", en: "Residential Facilities" },
    description: {
      bn: "শিক্ষার্থীদের জন্য পরিচ্ছন্ন আবাসন ব্যবস্থা। প্রতিটি ক্লাসরুমে পৃথক স্টাডি টেবিল এবং নিরিবিলি পড়াশোনার পরিবেশ নিশ্চিত করা হয়েছে।",
      en: "Clean accommodation with separate study desks in every classroom and a quiet study environment.",
    },
    icon: "bed-double",
  },
  {
    id: "library-lab",
    title: { bn: "সমৃদ্ধ লাইব্রেরি ও ল্যাব", en: "Rich Library & Labs" },
    description: {
      bn: "গবেষণা ও তথ্য অনুসন্ধানের জন্য বিষয়ভিত্তিক সমৃদ্ধ লাইব্রেরি এবং আরবী ও ইংরেজি ভাষা শিক্ষার জন্য আধুনিক কম্পিউটার ল্যাব।",
      en: "A subject-rich library for research, and a modern computer lab for Arabic and English language learning.",
    },
    icon: "library",
  },
  {
    id: "amali-tracker",
    title: { bn: "আমলি ট্র্যাকার ও তদারকি", en: "Amali Tracker & Mentorship" },
    description: {
      bn: "দৈনিক ইবাদত ও আমলের উন্নতির জন্য বিশেষ 'আমলি ট্র্যাকার বা তথ্যবই' — শিক্ষকদের তত্ত্বাবধানে আধ্যাত্মিক ও পড়াশোনার উন্নতির হিসাব।",
      en: "A special 'Amali Tracker' logbook tracking daily worship and study progress under teacher supervision.",
    },
    icon: "notebook-pen",
  },
  {
    id: "spiritual",
    title: { bn: "আধ্যাত্মিক পরিবেশ", en: "Spiritual Environment" },
    description: {
      bn: "ক্যাম্পাসে পাঁচ ওয়াক্ত নামাজ জামাতে আদায়, তিলাওয়াত ও মাসনুন আমলসমূহের নিয়মিত অনুশীলনের মাধ্যমে আত্মিক শুদ্ধির পরিবেশ।",
      en: "Five daily congregational prayers, regular recitation, and Sunnah practices ensure a spiritually purifying campus.",
    },
    icon: "moon-star",
  },
] as const;

/** FAQ groups (admissions / courses / donations). */
export const faqGroups: FaqGroup[] = [
  {
    id: "faq-admission",
    title: { bn: "ভর্তি সংক্রান্ত জিজ্ঞাসা", en: "Admission FAQs" },
    items: [
      {
        question: { bn: "ভর্তির আবেদন কীভাবে করব?", en: "How do I apply for admission?" },
        answer: {
          bn: "ভর্তি বিজ্ঞপ্তি প্রকাশিত হলে আমাদের ওয়েবসাইট বা ফেসবুক পেজে দেওয়া অনলাইন ফর্মের মাধ্যমে আবেদন করতে হবে। আবেদনে ব্যক্তিগত তথ্য ও শিক্ষাগত যোগ্যতার সঠিক বিবরণ দিতে হয়।",
          en: "When an admission circular is published, apply through the online form shared on our website or Facebook page with accurate personal and academic details.",
        },
      },
      {
        question: { bn: "ভর্তি পরীক্ষায় কী কী বিষয় থাকে?", en: "What does the admission test cover?" },
        answer: {
          bn: "কোর্সভেদে ভিন্ন হয়। জেনারেল শিক্ষার্থীদের জন্য সাধারণত বেসিক আরবী, সাধারণ ইসলামিয়াত এবং সমকালীন জ্ঞানের ওপর প্রশ্ন থাকে। লিখিত পরীক্ষার পর মৌখিক ভাইভা হয়।",
          en: "It varies by course. For general students: basic Arabic, general Islamic studies, and contemporary knowledge — followed by an oral viva.",
        },
      },
      {
        question: { bn: "মেয়েরা কি এই কোর্সগুলোতে ভর্তি হতে পারবে?", en: "Can female students apply?" },
        answer: {
          bn: "বর্তমানে ঘোষিত কোর্সগুলো শুধুমাত্র পুরুষ শিক্ষার্থীদের জন্য পরিচালিত হচ্ছে। নারীদের জন্য পৃথক কার্যক্রমের ঘোষণা সামনে আসলে নোটিশ বোর্ডে প্রকাশ করা হবে।",
          en: "Currently announced courses are conducted for male students only. Any separate program for sisters will be announced on the notice board.",
        },
      },
      {
        question: { bn: "ভর্তি বিজ্ঞপ্তি কোথায় প্রকাশ হয়?", en: "Where are admission circulars published?" },
        answer: {
          bn: "সাধারণত সোশ্যাল মিডিয়া প্ল্যাটফর্মে (ফেসবুক পেজ) এবং আমাদের ওয়েবসাইটের নোটিশ বোর্ডে প্রকাশ করা হয়। আপডেট পেতে ফেসবুক পেজ ফলো করুন বা নিউজলেটার সাবস্ক্রাইব করুন।",
          en: "Circulars are published on our Facebook page and this website's notice board. Follow the page or subscribe to the newsletter for updates.",
        },
      },
    ],
  },
  {
    id: "faq-courses",
    title: { bn: "কোর্স সংক্রান্ত জিজ্ঞাসা", en: "Course FAQs" },
    items: [
      {
        question: { bn: "কোর্স ফি কত?", en: "How much is the course fee?" },
        answer: {
          bn: "যাকাত-উপযুক্ত অস্বচ্ছল শিক্ষার্থীদের জন্য আবাসন, খাবার ও টিউশনসহ ১০০% স্কলারশিপ রয়েছে। সচ্ছল শিক্ষার্থীদের ফি কাঠামো ভর্তি বিজ্ঞপ্তিতে উল্লেখ থাকে।",
          en: "Zakat-eligible students in need receive a 100% scholarship covering accommodation, meals, and tuition. Fee structures for self-funded students appear in each admission circular.",
        },
      },
      {
        question: { bn: "ক্লাস কখন শুরু হয়?", en: "When do classes start?" },
        answer: {
          bn: "প্রতিটি ব্যাচের ক্লাস শুরুর তারিখ নিয়োগ/ভর্তি বিজ্ঞপ্তিতে উল্লেখ করা হয়। সাধারণত ভর্তি প্রক্রিয়া শেষে ঘোষিত তারিখেই ক্লাস শুরু হয়।",
          en: "Each batch's start date is stated in its admission circular; classes begin on the announced date after admission completes.",
        },
      },
      {
        question: { bn: "CCIS শেষ করার পর কী করা যায়?", en: "What can I do after CCIS?" },
        answer: {
          bn: "CCIS সফলতার সঙ্গে সম্পন্ন করে ডিপ্লোমা ইন দাওয়াহ অ্যান্ড ইসলামিক স্টাডিজ (২ বছর, ৪ সেমিস্টার) কোর্সে ভর্তি হওয়া যায়।",
          en: "After successfully completing CCIS, students can enroll in the 2-year (4-semester) Diploma in Dawah & Islamic Studies.",
        },
      },
    ],
  },
  {
    id: "faq-donation",
    title: { bn: "অনুদান সংক্রান্ত নিয়মাবলি", en: "Donation FAQs" },
    items: [
      {
        question: { bn: "আমার যাকাত কোথায় ব্যয় হবে?", en: "Where will my zakat be spent?" },
        answer: {
          bn: "যাকাত ফান্ড শতভাগ যাকাত পাওয়ার যোগ্য ও অস্বচ্ছল শিক্ষার্থীদের ফ্রি শিক্ষা, আবাসন ও খাবারের জন্য ব্যয় হয় — শরীয়াহর বিধান কঠোরভাবে মেনে।",
          en: "The Zakat Fund is spent exclusively on zakat-eligible, underprivileged students' education, accommodation, and meals — in strict compliance with Shariah.",
        },
      },
      {
        question: { bn: "নির্দিষ্ট শিক্ষার্থীকে স্পন্সর করা যায় কি?", en: "Can I sponsor a specific student?" },
        answer: {
          bn: "হ্যাঁ। সাপোর্ট পেজ থেকে আপনি গোপনীয়তা রক্ষা করা শিক্ষার্থী তালিকা (যেমন AS-104, ১ম বর্ষ, রংপুর) থেকে নির্দিষ্ট শিক্ষার্থী বেছে নিয়ে তার মাসিক বা বার্ষিক দায়িত্ব নিতে পারেন অথবা শিক্ষার্থীর আইডি লিখে স্পন্সর করতে পারেন।",
          en: "Yes. From the Support page, choose a privacy-protected student profile (e.g. AS-104, Year 1, Rangpur) and take on their monthly or annual cost, or sponsor by student ID.",
        },
      },
      {
        question: { bn: "রিসিট ও আপডেট পাব কীভাবে?", en: "How do I receive receipts and updates?" },
        answer: {
          bn: "অনুদান সম্পন্ন হলে আপনার ইমেইলে ডিজিটাল মানি রিসিট যাবে। স্পন্সর হলে প্রতি সেমিস্টারে/৩-৬ মাসে শিক্ষার্থীর অগ্রগতি প্রতিবেদন ইমেইলে পাবেন (গোপনীয়তা রক্ষা করে)।",
          en: "A digital receipt is emailed upon completion. Sponsors receive semesterly progress reports about their student (with privacy protected).",
        },
      },
      {
        question: { bn: "বিদেশ থেকে ডোনেট করা যায় কি?", en: "Can I donate from abroad?" },
        answer: {
          bn: "হ্যাঁ। প্রবাসীদের জন্য আন্তর্জাতিক কার্ড ও ডিজিটাল পেমেন্টের সুবিধা (USD/EUR/SAR) রয়েছে। বিস্তারিত সাপোর্ট পেজে দেওয়া আছে।",
          en: "Yes. Expatriates can donate via international cards and digital payments in USD/EUR/SAR — see the Support page for details.",
        },
      },
    ],
  },
];
