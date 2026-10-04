import { blogArticles } from "@/content/blog";
import { videos, galleryPhotos, newsItems } from "@/content/media";
import { researchProjects, callForPapers, publications, clarificationTopics, downloadItems } from "@/content/research";
import type { LocalizedText } from "@/types";
import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 86400000);
}
function daysAhead(days: number): Date {
  return new Date(Date.now() + days * 86400000);
}
function mdParagraphsToHtml(body: LocalizedText[] | readonly LocalizedText[]): { bn: string; en: string } {
  return {
    bn: body.map((p) => `<p>${p.bn}</p>`).join("\n"),
    en: body.map((p) => `<p>${p.en}</p>`).join("\n"),
  };
}

/* ————— Notices (recovered Round-1 seed, aligned to the client docs) ————— */

const NOTICE_SEEDS: Prisma.NoticeCreateInput[] = [
  {
    slug: "pys-2026-admission-circular",
    titleBn: "PYS (প্রিপারেটরি ইয়ার ফর স্পেশালাইজেশন) ২০২৬ ব্যাচে ভর্তি বিজ্ঞপ্তি",
    titleEn: "Admission Circular: PYS 2026 Batch",
    excerptBn: "মেধাবী আলেমদের জন্য ৩ বছর মেয়াদি ফ্ল্যাগশিপ প্রোগ্রামে ২০২৬ ব্যাচে ভর্তি প্রক্রিয়া শুরু। অনলাইনে আবেদন করুন।",
    excerptEn: "Admission opens for the 2026 batch of the 3-year flagship program for talented Ulama. Apply online.",
    bodyBn: "<p>আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউটের ফ্ল্যাগশিপ প্রোগ্রাম 'প্রিপারেটরি ইয়ার ফর স্পেশালাইজেশন (PYS)'-এ ২০২৬ ব্যাচে ভর্তি প্রক্রিয়া শুরু হয়েছে। কওমি মাদরাসা থেকে তাকমিল সম্পন্নকারী মেধাবী আলেমরা অনলাইনে আবেদন করতে পারবেন। প্রাথমিক বাছাই শেষে লিখিত ও মৌখিক পরীক্ষার মাধ্যমে চূড়ান্ত নির্বাচন করা হবে।</p>",
    bodyEn: "<p>Admission opens for the 2026 batch of the flagship Preparatory Year for Specialization (PYS). Takmil-completed Ulama may apply online; final selection via written test and viva.</p>",
    category: "ADMISSION",
    status: "ACTIVE",
    pinned: true,
    publishedAt: daysAgo(5),
  },
  {
    slug: "ccis-3rd-batch-admission",
    titleBn: "সার্টিফিকেট কোর্স ইন ইসলামিক স্টাডিজ (CCIS) ৩য় ব্যাচে ভর্তি চলছে",
    titleEn: "Admission Ongoing: CCIS 3rd Batch",
    excerptBn: "বিশ্ববিদ্যালয় স্নাতকধারীদের জন্য ৬ মাস মেয়াদি কোর্সের ৩য় ব্যাচে আবেদন গ্রহণ চলছে — সীমিত আসন।",
    excerptEn: "Applications open for the 3rd batch of the 6-month course for university graduates — limited seats.",
    bodyBn: "<p>বিশ্ববিদ্যালয় থেকে ন্যূনতম স্নাতক ও সিজিপিএ ২.৫+ যোগ্যতাসম্পন্নদের জন্য CCIS ৩য় ব্যাচে অনলাইন আবেদন গ্রহণ করা হচ্ছে। আবাসিক ও অনাবাসিক — উভয় সুবিধায় ভর্তি নেওয়া যাবে।</p>",
    bodyEn: "<p>Online applications are being accepted for CCIS Batch 3 from graduates (CGPA 2.5+). Both residential and non-residential options are available.</p>",
    category: "ADMISSION",
    status: "NEW",
    publishedAt: daysAgo(2),
  },
  {
    slug: "recruitment-arabic-teacher",
    titleBn: "আরবি ভাষা শিক্ষক নিয়োগ বিজ্ঞপ্তি",
    titleEn: "Job Circular: Arabic Language Teacher",
    excerptBn: "আরবি বিশ্ববিদ্যালয় থেকে স্নাতক উত্তীর্ণদের জন্য আরবি ভাষা শিক্ষক পদে আবেদন আহ্বান।",
    excerptEn: "Applications invited for the Arabic Language Teacher position for Arabic university graduates.",
    bodyBn: "<p>ইনস্টিটিউটের আরবি বিভাগে পূর্ণকালীন শিক্ষক নিয়োগ করা হবে। আবেদনকারীকে অবশ্যই আরবি বিশ্ববিদ্যালয় থেকে স্নাতক (জায়্যিদ জিদ্দান A) বা তদূর্ধ্ব ডিগ্রিধারী হতে হবে। সাক্ষাৎকারের মাধ্যমে চূড়ান্ত নির্বাচন।</p>",
    bodyEn: "<p>A full-time Arabic teacher will be recruited for the institute's Arabic department. Applicants must hold an Arabic university bachelor's (Jayyid Jiddan A) or above. Final selection via interview.</p>",
    category: "RECRUITMENT",
    status: "ACTIVE",
    publishedAt: daysAgo(9),
  },
  {
    slug: "recruitment-office-assistant",
    titleBn: "অফিস সহকারী ও হিসাবরক্ষক নিয়োগ বিজ্ঞপ্তি",
    titleEn: "Job Circular: Office Assistant & Accountant",
    excerptBn: "প্রশাসনিক কার্যক্রমের সম্প্রসারণে অফিস সহকারী ও হিসাবরক্ষক পদে দক্ষ প্রার্থী আহ্বান।",
    excerptEn: "Skilled candidates invited for Office Assistant and Accountant positions.",
    bodyBn: "<p>অফিস ব্যবস্থাপনা ও হিসাব সংরক্ষণের জন্য অভিজ্ঞ প্রার্থী নিয়োগ করা হবে। ন্যূনতম স্নাতক ও কম্পিউটার দক্ষতা আবশ্যক।</p>",
    bodyEn: "<p>Experienced candidates will be recruited for office management and accounting. Minimum bachelor's degree and computer proficiency are required.</p>",
    category: "RECRUITMENT",
    status: "CLOSED",
    publishedAt: daysAgo(30),
  },
  {
    slug: "exam-routine-diploma-sem2",
    titleBn: "ডিপ্লোমা ১ম বর্ষ ২য় সেমিস্টার পরীক্ষার রুটিন প্রকাশ",
    titleEn: "Published: Diploma Year-1 Semester-2 Exam Routine",
    excerptBn: "ডিপ্লোমা ইন দাওয়াহ অ্যান্ড ইসলামিক স্টাডিজের ২য় সেমিস্টার পরীক্ষার সময়সূচি প্রকাশিত হয়েছে।",
    excerptEn: "The Semester-2 examination schedule for the Diploma in Dawah & Islamic Studies has been published.",
    bodyBn: "<p>২য় সেমিস্টারের পরীক্ষা আগামী মাসের প্রথম সপ্তাহ থেকে শুরু হবে। শিক্ষার্থীদের ভর্তি কার্ড অফিস থেকে সংগ্রহ করতে বলা হচ্ছে।</p>",
    bodyEn: "<p>Semester-2 exams begin in the first week of next month. Students should collect admit cards from the office.</p>",
    category: "ACADEMIC",
    status: "NEW",
    publishedAt: daysAgo(1),
  },
  {
    slug: "library-extended-hours",
    titleBn: "রমাদান উপলক্ষে লাইব্রেরির সময়সীমা বৃদ্ধি",
    titleEn: "Extended Library Hours for Ramadan",
    excerptBn: "পবিত্র রমাদান মাসে লাইব্রেরি সকাল ৮টা থেকে রাত ১০টা পর্যন্ত খোলা থাকবে।",
    excerptEn: "During Ramadan the library will remain open from 8 AM to 10 PM.",
    bodyBn: "<p>ইতিকাফ ও অধ্যয়নের সুবিধার্থে রমাদান মাসে লাইব্রেরির সময়সীমা বাড়ানো হয়েছে। শিক্ষার্থী ও গবেষকরা ব্যবহার করতে পারবেন।</p>",
    bodyEn: "<p>Library hours are extended for itikaf and study during Ramadan, available to students and researchers.</p>",
    category: "ACADEMIC",
    status: "ACTIVE",
    publishedAt: daysAgo(12),
  },
  {
    slug: "annual-seminar-2026",
    titleBn: "বার্ষিক জাতীয় সেমিনার: 'সমকালীন চিন্তার চ্যালেঞ্জ ও বুদ্ধিবৃত্তিক দাওয়াহ' — পূর্বাভাস",
    titleEn: "Announced: Annual National Seminar on Contemporary Intellectual Challenges",
    excerptBn: "আগামী মার্চে দেশ-বিদেশের বরেণ্য আলেম ও গবেষকদের অংশগ্রহণে বার্ষিক সেমিনার অনুষ্ঠিত হবে।",
    excerptEn: "The annual seminar with renowned scholars and researchers from home and abroad will be held this March.",
    bodyBn: "<p>আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউটের বার্ষিক জাতীয় সেমিনার আগামী মার্চ মাসে ঢাকায় অনুষ্ঠিত হবে। মূল প্রবন্ধ উপস্থাপন করবেন দেশ-বিদেশের বরেণ্য গবেষকবৃন্দ।</p>",
    bodyEn: "<p>The institute's annual national seminar will be held in Dhaka this March, featuring keynote presentations by renowned researchers.</p>",
    category: "GENERAL",
    status: "NEW",
    publishedAt: daysAgo(7),
  },
  {
    slug: "dawah-fieldwork-completion",
    titleBn: "১ সপ্তাহ ব্যাপী দাওয়াহ ফিল্ডওয়ার্ক সফলভাবে সম্পন্ন",
    titleEn: "Week-long Dawah Fieldwork Completed Successfully",
    excerptBn: "শিক্ষার্থীদের সরাসরি ময়দানে হাতে-কলমে প্রশিক্ষণের অংশ হিসেবে সারাদেশে ফিল্ডওয়ার্ক পরিচালিত হয়েছে।",
    excerptEn: "Fieldwork was conducted nationwide as part of the students' hands-on field training.",
    bodyBn: "<p>এই ফিল্ডওয়ার্কে শিক্ষার্থীরা সাধারণ মানুষের মাঝে দ্বীনের সঠিক বার্তা পৌঁছে দেওয়ার ব্যবহারিক শিক্ষা অর্জন করেছে।</p>",
    bodyEn: "<p>Through this fieldwork, students gained practical experience delivering the message of Islam to the public.</p>",
    category: "GENERAL",
    status: "ACTIVE",
    publishedAt: daysAgo(20),
  },
];

/* ————— Fatwa bank ————— */

const FATWA_CATEGORIES: { key: string; nameBn: string; nameEn: string; sortOrder: number }[] = [
  { key: "ibadat", nameBn: "ইবাদত", nameEn: "Ibadat (Worship)", sortOrder: 0 },
  { key: "muamalat", nameBn: "লেনদেন", nameEn: "Muamalat (Transactions)", sortOrder: 1 },
  { key: "aqidah", nameBn: "আকীদা", nameEn: "Aqidah (Creed)", sortOrder: 2 },
  { key: "family", nameBn: "পারিবারিক", nameEn: "Family", sortOrder: 3 },
  { key: "contemporary", nameBn: "সমকালীন", nameEn: "Contemporary", sortOrder: 4 },
];

const FATWA_SEEDS: {
  slug: string;
  categoryKey: string;
  questionBn: string;
  questionEn: string;
  answerBn: string;
  answerEn: string;
  answeredBy: string;
  publishedAt: Date;
}[] = [
  {
    slug: "zakat-on-savings-bd",
    categoryKey: "muamalat",
    questionBn: "আমার ব্যাংকে জমা ৫ লক্ষ টাকা সঞ্চয় আছে। এর ওপর যাকাত আছে কি? হার কত হবে?",
    questionEn: "I have 500,000 BDT in savings. Is zakat due on it, and at what rate?",
    answerBn: "<p>হ্যাঁ। নিসাব পরিমাণ (৮৫ গ্রাম স্বর্ণের সমমূল্যের) সম্পদ এক বছর হিজরি নিজের দখলে থাকলে তার ওপর ২.৫% হারে যাকাত ফরয হয়। আপনার ৫ লক্ষ টাকা যদি এক বছর পূর্ণ হয়ে থাকে, তাহলে ১২,৫০০ টাকা যাকাত আদায় করতে হবে। ব্যাংকে সুদের টাকা থাকলে সুদ পরিত্যাগ করে শুধু মূল সম্পদের যাকাত দিন।</p>",
    answerEn: "<p>Yes. Zakat is obligatory at 2.5% on wealth above nisab (equivalent to 85g of gold) held for one lunar year. If your 500,000 BDT completed a year, 12,500 BDT is due. If it includes interest, renounce the interest and pay zakat only on the principal.</p>",
    answeredBy: "গবেষণা বোর্ড, আস-সুন্নাহ ইনস্টিটিউট",
    publishedAt: daysAgo(15),
  },
  {
    slug: "qiblah-direction-verify",
    categoryKey: "ibadat",
    questionBn: "বাংলাদেশে কিবলার সঠিক দিক কোনটি? অনেক মসজিদে ভিন্ন দিক দেখা যায় — করণীয় কী?",
    questionEn: "What is the correct qiblah direction in Bangladesh? Many mosques differ — what should we do?",
    answerBn: "<p>বাংলাদেশের জন্য কিবলার দিক পশ্চিম-দক্ষিণ-পশ্চিম (WSW) প্রায় ২৫৭°—২৬০° কোণে। বিভিন্ন মসজিদে ব্যবধানের কারণ প্রাচীন অনুমাননির্ভর নির্ণয়। যাচাই করতে নির্ভরযোগ্য কিবলা কম্পাস বা GPS-ভিত্তিক অ্যাপ ব্যবহার করুন। যেখানে সম্ভব, স্থানীয় জামাতের সঙ্গে ঐক্য রক্ষা করুন; তবে নির্ভুল দিক জানা থাকলে তা-ই অগ্রাধিকারযোগ্য।</p>",
    answerEn: "<p>For Bangladesh the qiblah is WSW at roughly 257°–260°. Discrepancies stem from old estimation methods. Verify with a reliable qiblah compass or GPS app. Maintain unity with the local congregation where possible, but the accurate direction takes precedence when known.</p>",
    answeredBy: "গবেষণা বোর্ড, আস-সুন্নাহ ইনস্টিটিউট",
    publishedAt: daysAgo(22),
  },
  {
    slug: "working-in-bank-ruling",
    categoryKey: "muamalat",
    questionBn: "সুদভিত্তিক ব্যাংকে চাকরি করার বিধান কী? আমি একটি বেসরকারি ব্যাংকে আইটি অফিসার হিসেবে কর্মরত।",
    questionEn: "What is the ruling on working at an interest-based bank? I work as an IT officer at a private bank.",
    answerBn: "<p>সুদ হারাম এবং তাতে সহায়তাও নিষিদ্ধ। তবে ব্যাংকের এমন কিছু পদ আছে যেগুলো সরাসরি সুদ-লেনদেনের সঙ্গে সম্পৃক্ত নয় (যেমন নিরাপত্তা, সাধারণ প্রশাসন, আইটি অবকাঠামো)। প্রাথমিক ও পরোক্ষ সহায়তামূলক পদে কাজ করা শর্তসাপেক্ষে বৈধ বলেছেন অনেক ফকীহ — তবে শর্ত হলো কাজটি সুদ চুক্তিতে সরাসরি অংশগ্রহণ না করা। সুদ লেনদেনে সরাসরি নিয়োজিত পদ (ক্রেডিট, ঋণ অনুমোদন) হারাম। সুযোগ পেলে ইসলামী ব্যাংকিংয়ে স্থানান্তরের চেষ্টা করুন — তা অধিক তাকওয়ার পথ।</p>",
    answerEn: "<p>Interest is haram, as is assisting it. However, roles not directly involved in interest transactions (security, general admin, IT infrastructure) are considered conditionally permissible by many fuqaha, provided no direct participation in interest contracts. Positions directly executing interest (credit approval) are haram. Where possible, transfer to Islamic banking — that is the path of greater taqwa.</p>",
    answeredBy: "গবেষণা বোর্ড, আস-সুন্নাহ ইনস্টিটিউট",
    publishedAt: daysAgo(35),
  },
  {
    slug: "aqidah-tawassul-types",
    categoryKey: "aqidah",
    questionBn: "তাওয়াসসুলের কোন ধরন জায়েয এবং কোনটি নাজায়েয? সহজ ভাষায় জানতে চাই।",
    questionEn: "Which forms of tawassul are permissible and which are not? Please explain simply.",
    answerBn: "<p>সহজ নিয়ম: আল্লাহর সুন্দর নামসমূহ, তাঁর গুণাবলি বা নিজ নেক আমলের ওসিলায় দোয়া করা — সরাসরি কুরআন-সুন্নাহ দ্বারা প্রমাণিত, সম্পূর্ণ জায়েয। আর মৃত ব্যক্তিকে ডেকে বা তার অণুর ওসিলায় প্রার্থনা করা — তা সালাফে সালেহীনের আমলে নেই; তা থেকে বিরত থাকা কর্তব্য। ওয়াসিলা শুধু জীবিত ব্যক্তির দোয়া-প্রার্থনার ক্ষেত্রে সহীহ হাদীসে এসেছে।</p>",
    answerEn: "<p>Simply: supplicating through Allah's names and attributes, or one's own righteous deeds, is directly proven from the Quran and Sunnah — fully permissible. Calling upon the deceased or seeking their intercession has no basis in the practice of the Salaf; refraining is required. Waseelah through a living person's du'a is established in authentic hadith.</p>",
    answeredBy: "গবেষণা বোর্ড, আস-সুন্নাহ ইনস্টিটিউট",
    publishedAt: daysAgo(50),
  },
  {
    slug: "family-wife-permission-work",
    categoryKey: "family",
    questionBn: "স্ত্রী চাকরি করতে চাইলে স্বামীর অনুমতি কি জরুরি? ইসলামের বিধান জানতে চাই।",
    questionEn: "Is the husband's permission required if the wife wants to work? What does Islam say?",
    answerBn: "<p>স্ত্রীর ওপর ঘরের ভরণপোষণের দায়িত্ব নেই — তা স্বামীর। ঘরের বাইরে চাকরি করতে হলে পর্দার বিধান মেনে চলা আবশ্যক; এক্ষেত্রে স্বামীর সম্মতি থাকা উত্তম ও শান্তির পথ। দাম্পত্য অধিকার-দায়িত্বের ভারসাম্য রক্ষায় পারস্পরিক আলোচনাই ইসলামী পথ। একতরফা বাধ্যবাধকতা নয় — পরামর্শ ও সমঝোতাই কাম্য।</p>",
    answerEn: "<p>The wife bears no obligation of household expenses — that is the husband's duty. Working outside requires observing the rules of modesty; the husband's consent is preferable and the path of harmony. Mutual consultation in balancing marital rights is the Islamic way, not unilateral compulsion.</p>",
    answeredBy: "গবেষণা বোর্ড, আস-সুন্নাহ ইনস্টিটিউট",
    publishedAt: daysAgo(60),
  },
  {
    slug: "contemporary-online-trading",
    categoryKey: "contemporary",
    questionBn: "অনলাইন ফরেক্স/শেয়ার ট্রেডিং করা কি জায়েয? ক্রিপ্টোকারেন্সির বিধান কী?",
    questionEn: "Is online forex/share trading permissible? What is the ruling on cryptocurrency?",
    answerBn: "<p>মূলনীতি: বাস্তব সম্পদ ক্রয়-বিক্রয়ে দেনাদার পাওনাদার থাকা, জিনিস হস্তান্তর বা দাখিলা হওয়া, ঘাটতি-মূল্য (লিভারেজ ছাড়া) বাদ দিয়ে সমান বিনিময় হওয়া জরুরি। শেয়ার বাজারে তাৎক্ষণিক নগদ বিনিময় ও প্রকৃত কোম্পানির মালিকানা থাকায় শর্তসাপেক্ষে জায়েয। কিন্তু ফরেক্সে লিভারেজ, মার্জিন ও বিলম্বিত সেটেলমেন্ট — সবই সুদ ও গারারের সম্মিলন, তা হারাম। ক্রিপ্টোকারেন্সিতে প্রকৃত মালিকানা থাকলে ও সুদ/জুয়ার উপাদান বাদ দিলে হানাফি ফকীহদের কাছে স্পট ক্রয়-বিক্রয় শর্তসাপেক্ষে বৈধ বলে মত আছে; ভবিষ্যৎ চুক্তি ও লিভারেজড ট্রেডিং নিষিদ্ধ।</p>",
    answerEn: "<p>Core principles: real asset exchange, possession or delivery, and equal exchange without leverage. Spot share trading with actual ownership is conditionally permissible. Forex combines leverage, margin, and delayed settlement — riba and gharar; haram. Spot cryptocurrency with real ownership and no riba or gambling elements is viewed as conditionally valid by Hanafi jurists; futures and leveraged trading are prohibited.</p>",
    answeredBy: "গবেষণা বোর্ড, আস-সুন্নাহ ইনস্টিটিউট",
    publishedAt: daysAgo(18),
  },
  {
    slug: "ibadat-combining-prayers-travel",
    categoryKey: "ibadat",
    questionBn: "সফরে জোহর ও আসর একসঙ্গে পড়া যায় কি? শর্ত কী?",
    questionEn: "Can Dhuhr and Asr be combined during travel? What are the conditions?",
    answerBn: "<p>হ্যাঁ, সফরে জমা তাখীর (দেরিতে একত্র) জায়েয। শর্ত: প্রকৃত সফর হওয়া (প্রায় ৮১ কি.মি.+), সফরের সময়েই একত্র করা, এবং উভয় নামাজের নিজ নিজ ওয়াক্ত শুরু হওয়ার পর পড়া। কসর (২ রাকাত) সফরি নামাজে সুন্নতে সাবিত।</p>",
    answerEn: "<p>Yes, combining (jam' ta'khir) is permissible during genuine travel (~81+ km), done while traveling, with each prayer read after its own time has entered. Qasr (2 rak'ahs) is established Sunnah for travel prayers.</p>",
    answeredBy: "গবেষণা বোর্ড, আস-সুন্নাহ ইনস্টিটিউট",
    publishedAt: daysAgo(75),
  },
  {
    slug: "family-photos-privacy",
    categoryKey: "family",
    questionBn: "পর্দার পোশাকে স্ত্রীর ছবি তুলে সোশ্যাল মিডিয়ায় দেওয়া কি জায়েয?",
    questionEn: "Is it permissible to post my wife's photos in hijab on social media?",
    answerBn: "<p>পর্দা শুধু পোশাক নয় — সৌন্দর্য ও পরিচয় প্রদর্শনের সীমাও নির্ধারণ করে। পর্দার পোশাকে হলেও নিয়মিত ছবি প্রকাশ করলে অপরিচিতদের নজরে পড়া, ব্যবহার ও ফিতনার আশঙ্কা থাকে — তা পর্দার উদ্দেশ্যের সঙ্গে সাংঘর্ষিক। আরও সতর্কতার পথ: প্রকাশ্য প্ল্যাটফর্মে না দেওয়া; নিকটাত্মীয়দের বদ্ধ গ্রুপেও সংযত থাকা।</p>",
    answerEn: "<p>Hijab defines limits of displaying beauty and identity, not merely clothing. Regular public posting — even in hijab — risks exposure, misuse, and fitnah, conflicting with hijab's purpose. The more cautious path: avoid public platforms and remain restrained even in closed family groups.</p>",
    answeredBy: "গবেষণা বোর্ড, আস-সুন্নাহ ইনস্টিটিউট",
    publishedAt: daysAgo(90),
  },
];

/* ————— Funds & campaigns (client document §Payment) ————— */

const FUND_SEEDS: { key: string; nameBn: string; nameEn: string; descriptionBn: string; descriptionEn: string; isDefault: boolean; sortOrder: number }[] = [
  {
    key: "zakat",
    nameBn: "যাকাত ফান্ড",
    nameEn: "Zakat Fund",
    descriptionBn: "এটি শতভাগ যাকাত পাওয়ার যোগ্য ও অসচ্ছল শিক্ষার্থীদের ফ্রি শিক্ষা, আবাসন ও খাবারের জন্য ব্যয় হবে।",
    descriptionEn: "Spent entirely on free education, accommodation, and meals for zakat-eligible students in need.",
    isDefault: true,
    sortOrder: 0,
  },
  {
    key: "general",
    nameBn: "সাধারণ অনুদান",
    nameEn: "General Sadqah / Donation",
    descriptionBn: "ইনস্টিটিউটের উন্নয়ন, লাইব্রেরি, প্রযুক্তি খাত ও সাধারণ পরিচালন ব্যয়ে।",
    descriptionEn: "For institute development, library, technology, and general operating expenses.",
    isDefault: false,
    sortOrder: 1,
  },
  {
    key: "scholarship",
    nameBn: "স্কলারশিপ/শিক্ষা ফান্ড",
    nameEn: "Scholarship Fund",
    descriptionBn: "মেধাবী শিক্ষার্থীদের এককালীন বা মাসিক বৃত্তি প্রদানের জন্য।",
    descriptionEn: "For one-time or monthly stipends to talented students.",
    isDefault: false,
    sortOrder: 2,
  },
  {
    key: "sponsor",
    nameBn: "নির্দিষ্ট শিক্ষার্থী স্পন্সরশিপ",
    nameEn: "Sponsor a Student",
    descriptionBn: "নির্দিষ্ট শিক্ষার্থীর পুরো বছরের আবাসন, খাবার ও শিক্ষার দায়িত্ব নিতে পারবেন।",
    descriptionEn: "Take on a specific student's full year of accommodation, meals, and education.",
    isDefault: false,
    sortOrder: 3,
  },
];

const CAMPAIGN_SEEDS: {
  slug: string;
  fundKey: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  goalAmount: number;
  startsAt: Date;
  endsAt: Date;
}[] = [
  {
    slug: "library-1000-books",
    fundKey: "general",
    titleBn: "লাইব্রেরির জন্য ১০০০ নতুন বই",
    titleEn: "1,000 New Books for the Library",
    descriptionBn: "গবেষণা সুবিধা বাড়াতে আরবি, ইংরেজি ও বাংলা — তিন ভাষার ১০০০ বই সংগ্রহের প্রকল্প।",
    descriptionEn: "A project to acquire 1,000 Arabic, English, and Bangla books to expand research facilities.",
    goalAmount: 800000,
    startsAt: daysAgo(40),
    endsAt: daysAhead(75),
  },
  {
    slug: "winter-clothing-students",
    fundKey: "zakat",
    titleBn: "আবাসিক শিক্ষার্থীদের জন্য শীতবস্ত্র বিতরণ",
    titleEn: "Winter Clothing for Residential Students",
    descriptionBn: "অস্বচ্ছল আবাসিক শিক্ষার্থীদের জন্য কম্বল ও শীতবস্ত্র বিতরণ কার্যক্রম।",
    descriptionEn: "Distribution of blankets and winter clothing for underprivileged residential students.",
    goalAmount: 250000,
    startsAt: daysAgo(30),
    endsAt: daysAhead(20),
  },
];

export async function seedContent(db: Db): Promise<void> {
  // notices
  for (const notice of NOTICE_SEEDS) {
    await db.notice.upsert({ where: { slug: notice.slug }, update: notice, create: notice });
  }

  // fatwa categories + entries
  for (const cat of FATWA_CATEGORIES) {
    await db.fatwaCategory.upsert({
      where: { key: cat.key },
      update: cat,
      create: cat,
    });
  }
  for (const { categoryKey, ...fatwa } of FATWA_SEEDS) {
    await db.fatwaEntry.upsert({
      where: { slug: fatwa.slug },
      update: { ...fatwa, category: { connect: { key: categoryKey } } },
      create: { ...fatwa, isPublished: true, category: { connect: { key: categoryKey } } },
    });
  }

  // blog: categories from article category labels
  const categoryKeys = new Map<string, string>();
  const seenCategories = new Set<string>();
  for (const article of blogArticles) {
    const catKey = article.category.bn;
    if (seenCategories.has(catKey)) continue;
    seenCategories.add(catKey);
    const slug = catKey.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "general";
    const row = await db.postCategory.upsert({
      where: { slug },
      update: { nameBn: article.category.bn, nameEn: article.category.en },
      create: { slug, nameBn: article.category.bn, nameEn: article.category.en, sortOrder: categoryKeys.size },
    });
    categoryKeys.set(catKey, row.id);
  }
  // authors → link by name to Person where possible
  for (let i = 0; i < blogArticles.length; i++) {
    const article = blogArticles[i];
    const authorPerson = await db.person.findFirst({
      where: { OR: [{ nameBn: article.author }, { nameEn: article.author }] },
      select: { id: true },
    });
    const data = {
      titleBn: article.title.bn,
      titleEn: article.title.en,
      excerptBn: article.excerpt.bn,
      excerptEn: article.excerpt.en,
      bodyBn: article.contentBn,
      bodyEn: article.contentEn ?? "",
      readingMinutes: article.readMinutes,
      publishedAt: new Date(article.publishedAt),
      isPublished: true,
      categoryId: categoryKeys.get(article.category.bn) ?? null,
      authorId: authorPerson?.id ?? null,
      views: Math.floor(Math.random() * 900) + 120,
    };
    await db.post.upsert({
      where: { slug: article.slug },
      update: data,
      create: { slug: article.slug, kind: "ARTICLE", ...data },
    });
  }

  // clarifications → posts with kind CLARIFICATION (topics as categories)
  for (let i = 0; i < clarificationTopics.length; i++) {
    const topic = clarificationTopics[i] as unknown as { id: string; title: LocalizedText; description: LocalizedText; articleCount: number; videoCount: number };
    const catSlug = `clar-${topic.id}`;
    const cat = await db.postCategory.upsert({
      where: { slug: catSlug },
      update: { nameBn: topic.title.bn, nameEn: topic.title.en },
      create: { slug: catSlug, nameBn: topic.title.bn, nameEn: topic.title.en, sortOrder: 50 + i },
    });
    await db.siteSetting.upsert({
      where: { key: `clarification.topic.${topic.id}` },
      update: { value: { descriptionBn: topic.description.bn, descriptionEn: topic.description.en, articleCount: topic.articleCount, videoCount: topic.videoCount } as Prisma.InputJsonValue },
      create: { key: `clarification.topic.${topic.id}`, value: { descriptionBn: topic.description.bn, descriptionEn: topic.description.en, articleCount: topic.articleCount, videoCount: topic.videoCount } as Prisma.InputJsonValue },
    });
    void cat;
  }

  // news → posts with kind NEWS
  for (const item of newsItems) {
    const body = mdParagraphsToHtml(item.body);
    await db.post.upsert({
      where: { slug: item.id },
      update: { titleBn: item.title.bn, titleEn: item.title.en, excerptBn: item.excerpt.bn, excerptEn: item.excerpt.en, bodyBn: body.bn, bodyEn: body.en, publishedAt: new Date(item.date), isPublished: true, kind: "NEWS" },
      create: { slug: item.id, titleBn: item.title.bn, titleEn: item.title.en, excerptBn: item.excerpt.bn, excerptEn: item.excerpt.en, bodyBn: body.bn, bodyEn: body.en, publishedAt: new Date(item.date), isPublished: true, kind: "NEWS" },
    });
  }

  // videos
  await db.video.deleteMany({});
  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const youtubeId = video.youtubeUrl.includes("watch?v=")
      ? video.youtubeUrl.split("watch?v=")[1]?.split("&")[0] ?? video.youtubeUrl
      : video.youtubeUrl; // search-link fallback: store as-is, UI renders link
    await db.video.create({
      data: {
        titleBn: video.title.bn,
        titleEn: video.title.en,
        descriptionBn: video.playlist.bn,
        descriptionEn: video.playlist.en,
        youtubeId,
        playlistKey: video.playlist.bn,
        sortOrder: i,
        isPublished: true,
      },
    });
  }

  // publications
  for (let i = 0; i < publications.length; i++) {
    const pub = publications[i] as unknown as { id: string; title: LocalizedText; author: string; authorRole: LocalizedText; type: string; year: number; description: LocalizedText; issnIsbn: string | null };
    const kindMap: Record<string, "JOURNAL" | "BOOK" | "PAPER" | "MAGAZINE" | "BULLETIN"> = {
      journal: "JOURNAL",
      book: "BOOK",
      paper: "PAPER",
    };
    await db.publication.upsert({
      where: { slug: pub.id },
      update: {
        titleBn: pub.title.bn,
        titleEn: pub.title.en,
        abstractBn: pub.description.bn,
        abstractEn: pub.description.en,
        authorsBn: `${pub.author} — ${pub.authorRole.bn}`,
        authorsEn: `${pub.author} — ${pub.authorRole.en}`,
        kind: kindMap[pub.type] ?? "PAPER",
        year: pub.year,
        issn: pub.issnIsbn,
        isbn: null,
        sortOrder: i,
      },
      create: {
        slug: pub.id,
        titleBn: pub.title.bn,
        titleEn: pub.title.en,
        abstractBn: pub.description.bn,
        abstractEn: pub.description.en,
        authorsBn: `${pub.author} — ${pub.authorRole.bn}`,
        authorsEn: `${pub.author} — ${pub.authorRole.en}`,
        kind: kindMap[pub.type] ?? "PAPER",
        year: pub.year,
        issn: pub.issnIsbn,
        isbn: null,
        sortOrder: i,
        isPublished: true,
      },
    });
  }

  // research projects
  for (let i = 0; i < researchProjects.length; i++) {
    const project = researchProjects[i] as unknown as { id: string; title: LocalizedText; description: LocalizedText; progress: number; status: string; team: LocalizedText | null };
    await db.researchProject.upsert({
      where: { slug: project.id },
      update: {
        titleBn: project.title.bn,
        titleEn: project.title.en,
        summaryBn: project.description.bn,
        summaryEn: project.description.en,
        progress: project.progress,
        statusBn: project.status === "ongoing" ? "চলমান" : "আসন্ন",
        statusEn: project.status === "ongoing" ? "Ongoing" : "Upcoming",
        sortOrder: i,
      },
      create: {
        slug: project.id,
        titleBn: project.title.bn,
        titleEn: project.title.en,
        summaryBn: project.description.bn,
        summaryEn: project.description.en,
        progress: project.progress,
        statusBn: project.status === "ongoing" ? "চলমান" : "আসন্ন",
        statusEn: project.status === "ongoing" ? "Ongoing" : "Upcoming",
        sortOrder: i,
        isPublished: true,
      },
    });
  }
  // call-for-papers → settings (guidelines list + deadline)
  const cfpValue = {
    active: callForPapers.active,
    titleBn: callForPapers.title.bn,
    titleEn: callForPapers.title.en,
    deadline: callForPapers.deadline,
    guidelines: callForPapers.guidelines.map((g) => ({ bn: g.bn, en: g.en })),
  } as Prisma.InputJsonValue;
  await db.siteSetting.upsert({
    where: { key: "research.callForPapers" },
    update: { value: cfpValue },
    create: { key: "research.callForPapers", value: cfpValue },
  });

  // downloads (metadata only — the office attaches real files from the admin;
  // round-1 static /downloads/*.pdf paths keep working until replaced)
  const CATEGORY_LABELS: Record<string, { bn: string; en: string }> = {
    prospectus: { bn: "প্রসপেক্টাস", en: "Prospectus" },
    syllabus: { bn: "সিলেবাস ও কারিকুলাম", en: "Syllabus & Curriculum" },
    form: { bn: "ফরম ও আবেদনপত্র", en: "Forms & Applications" },
    dawah: { bn: "দাওয়াহ ম্যাটেরিয়ালস", en: "Dawah Materials" },
  };
  for (let i = 0; i < downloadItems.length; i++) {
    const item = downloadItems[i] as unknown as { id: string; title: LocalizedText; description: LocalizedText; category: string; fileType: string; sizeLabel: string; url: string };
    const existing = await db.downloadResource.findFirst({ where: { titleBn: item.title.bn } });
    const data = {
      titleBn: item.title.bn,
      titleEn: item.title.en,
      descriptionBn: item.description?.bn ?? `${item.fileType} · ${item.sizeLabel}`,
      descriptionEn: item.description?.en ?? `${item.fileType} · ${item.sizeLabel}`,
      categoryBn: CATEGORY_LABELS[item.category]?.bn ?? item.category,
      categoryEn: CATEGORY_LABELS[item.category]?.en ?? item.category,
      sortOrder: i,
      isPublished: true,
    };
    if (existing) {
      await db.downloadResource.update({ where: { id: existing.id }, data });
    } else {
      await db.downloadResource.create({ data });
    }
  }

  // funds + campaigns
  for (const fund of FUND_SEEDS) {
    await db.fund.upsert({ where: { key: fund.key }, update: fund, create: { ...fund, isEnabled: true } });
  }
  for (const { fundKey, ...campaign } of CAMPAIGN_SEEDS) {
    await db.campaign.upsert({
      where: { slug: campaign.slug },
      update: { ...campaign, fund: { connect: { key: fundKey } } },
      create: { ...campaign, isPublished: true, fund: { connect: { key: fundKey } } },
    });
  }

  console.log(
    `  ✓ ${NOTICE_SEEDS.length} notices, ${FATWA_SEEDS.length} fatwa entries, ${blogArticles.length} articles, ${newsItems.length} news, ${videos.length} videos, ${publications.length} publications, ${researchProjects.length} projects, ${FUND_SEEDS.length} funds, ${CAMPAIGN_SEEDS.length} campaigns`,
  );
}
