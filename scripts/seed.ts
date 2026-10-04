/**
 * Database seed — notices, fatwa bank, campaigns, and a demo account.
 * Run with: bun run scripts/seed.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 86400000);
}

function daysAhead(days: number): Date {
  return new Date(Date.now() + days * 86400000);
}

async function main(): Promise<void> {
  console.log("🌱 Seeding database…");

  /* ————— Notices ————— */
  const notices = [
    {
      slug: "pys-2026-admission-circular",
      titleBn: "PYS (প্রিপারেটরি ইয়ার ফর স্পেশালাইজেশন) ২০২৬ ব্যাচে ভর্তি বিজ্ঞপ্তি",
      titleEn: "Admission Circular: PYS 2026 Batch",
      excerptBn: "মেধাবী আলেমদের জন্য ৩ বছর মেয়াদি ফ্ল্যাগশিপ প্রোগ্রামে ২০২৬ ব্যাচে ভর্তি প্রক্রিয়া শুরু। অনলাইনে আবেদন করুন।",
      excerptEn: "Admission opens for the 2026 batch of the 3-year flagship program for talented Ulama. Apply online.",
      bodyBn: "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউটের ফ্ল্যাগশিপ প্রোগ্রাম 'প্রিপারেটরি ইয়ার ফর স্পেশালাইজেশন (PYS)'-এ ২০২৬ ব্যাচে ভর্তি প্রক্রিয়া শুরু হয়েছে। কওমি মাদরাসা থেকে তাকমিল সম্পন্নকারী মেধাবী আলেমরা অনলাইনে আবেদন করতে পারবেন। প্রাথমিক বাছাই শেষে লিখিত ও মৌখিক পরীক্ষার মাধ্যমে চূড়ান্ত নির্বাচন করা হবে।",
      bodyEn: "Admission opens for the 2026 batch of the flagship Preparatory Year for Specialization (PYS). Takmil-completed Ulama may apply online; final selection via written test and viva.",
      category: "admission",
      status: "active",
      publishedAt: daysAgo(5),
    },
    {
      slug: "ccis-3rd-batch-admission",
      titleBn: "সার্টিফিকেট কোর্স ইন ইসলামিক স্টাডিজ (CCIS) ৩য় ব্যাচে ভর্তি চলছে",
      titleEn: "Admission Ongoing: CCIS 3rd Batch",
      excerptBn: "বিশ্ববিদ্যালয় স্নাতকধারীদের জন্য ৬ মাস মেয়াদি কোর্সের ৩য় ব্যাচে আবেদন গ্রহণ চলছে — সীমিত আসন।",
      excerptEn: "Applications open for the 3rd batch of the 6-month course for university graduates — limited seats.",
      bodyBn: "বিশ্ববিদ্যালয় থেকে ন্যূনতম স্নাতক ও সিজিপিএ ২.৫+ যোগ্যতাসম্পন্নদের জন্য CCIS ৩য় ব্যাচে অনলাইন আবেদন গ্রহণ করা হচ্ছে। আবাসিক ও অনাবাসিক — উভয় সুবিধায় ভর্তি নেওয়া যাবে।",
      bodyEn: "Online applications are being accepted for CCIS Batch 3 from graduates (CGPA 2.5+). Both residential and non-residential options available.",
      category: "admission",
      status: "new",
      publishedAt: daysAgo(2),
    },
    {
      slug: "recruitment-arabic-teacher",
      titleBn: "আরবি ভাষা শিক্ষক নিয়োগ বিজ্ঞপ্তি (全职)",
      titleEn: "Job Circular: Arabic Language Teacher",
      excerptBn: "আরবি বিশ্ববিদ্যালয় থেকে স্নাতক উত্তীর্ণদের জন্য আরবি ভাষা শিক্ষক পদে আবেদন আহ্বান।",
      excerptEn: "Applications invited for the Arabic Language Teacher position for Arabic university graduates.",
      bodyBn: "ইনস্টিটিউটের আরবি বিভাগে পূর্ণকালীন শিক্ষক নিয়োগ করা হবে। আবেদনকারীকে অবশ্যই আরবি বিশ্ববিদ্যালয় থেকে স্নাতক (জায়্যিদ জিদ্দান A) বা তদূর্ধ্ব ডিগ্রিধারী হতে হবে। সাক্ষাৎকারের মাধ্যমে চূড়ান্ত নির্বাচন।",
      bodyEn: "A full-time Arabic teacher will be recruited. Applicants must hold an Arabic university bachelor's (Jayyid Jiddan A) or above. Final selection via interview.",
      category: "recruitment",
      status: "active",
      publishedAt: daysAgo(9),
    },
    {
      slug: "recruitment-office-assistant",
      titleBn: "অফিস সহকারী ও হিসাবরক্ষক নিয়োগ বিজ্ঞপ্তি",
      titleEn: "Job Circular: Office Assistant & Accountant",
      excerptBn: "প্রশাসনিক কার্যক্রমের সম্প্রসারণে অফিস সহকারী ও হিসাবরক্ষক পদে দক্ষ প্রার্থী আহ্বান।",
      excerptEn: "Skilled candidates invited for Office Assistant and Accountant positions.",
      bodyBn: "অফিস ব্যবস্থাপনা ও হিসাব সংরক্ষণের জন্য অভিজ্ঞ প্রার্থী নিয়োগ করা হবে। ন্যূনতম স্নাতক ও কম্পিউটার দক্ষতা আবশ্যক।",
      bodyEn: "Experienced candidates will be recruited for office management and accounting. Minimum bachelor's degree and computer proficiency required.",
      category: "recruitment",
      status: "closed",
      publishedAt: daysAgo(30),
    },
    {
      slug: "exam-routine-diploma-sem2",
      titleBn: "ডিপ্লোমা ১ম বর্ষ ২য় সেমিস্টার পরীক্ষার রুটিন প্রকাশ",
      titleEn: "Published: Diploma Year-1 Semester-2 Exam Routine",
      excerptBn: "ডিপ্লোমা ইন দাওয়াহ অ্যান্ড ইসলামিক স্টাডিজের ২য় সেমিস্টার পরীক্ষার সময়সূচি প্রকাশিত হয়েছে।",
      excerptEn: "The Semester-2 examination schedule for the Diploma in Dawah & Islamic Studies has been published.",
      bodyBn: "২য় সেমিস্টারের পরীক্ষা আগামী মাসের প্রথম সপ্তাহ থেকে শুরু হবে। শিক্ষার্থীদের ভর্তি কার্ড অফিস থেকে সংগ্রহ করতে বলা হচ্ছে।",
      bodyEn: "Semester-2 exams begin in the first week of next month. Students should collect admit cards from the office.",
      category: "academic",
      status: "new",
      publishedAt: daysAgo(1),
    },
    {
      slug: "library-extended-hours",
      titleBn: "রমাদান উপলক্ষে লাইব্রেরির সময়সীমা বৃদ্ধি",
      titleEn: "Extended Library Hours for Ramadan",
      excerptBn: "পবিত্র রমাদান মাসে লাইব্রেরি সকাল ৮টা থেকে রাত ১০টা পর্যন্ত খোলা থাকবে।",
      excerptEn: "During Ramadan the library will remain open from 8 AM to 10 PM.",
      bodyBn: "ইতিকাফ ও অধ্যয়নের সুবিধার্থে রমাদান মাসে লাইব্রেরির সময়সীমা বাড়ানো হয়েছে। শিক্ষার্থী ও গবেষকরা ব্যবহার করতে পারবেন।",
      bodyEn: "Library hours are extended for itikaf and study during Ramadan, available to students and researchers.",
      category: "academic",
      status: "active",
      publishedAt: daysAgo(12),
    },
    {
      slug: "annual-seminar-2026",
      titleBn: "বার্ষিক জাতীয় সেমিনার: 'সমকালীন চিন্তার চ্যালেঞ্জ ও বুদ্ধিবৃত্তিক দাওয়াহ' — পূর্বাভাস",
      titleEn: "Announced: Annual National Seminar on Contemporary Intellectual Challenges",
      excerptBn: "আগামী মার্চে দেশ-বিদেশের বরেণ্য আলেম ও গবেষকদের অংশগ্রহণে বার্ষিক সেমিনার অনুষ্ঠিত হবে।",
      excerptEn: "The annual seminar with renowned scholars and researchers from home and abroad will be held this March.",
      bodyBn: "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউটের বার্ষিক জাতীয় সেমিনার আগামী মার্চ মাসে ঢাকায় অনুষ্ঠিত হবে। মূল প্রবন্ধ উপস্থাপন করবেন দেশ-বিদেশের বরেণ্য গবেষকবৃন্দ।",
      bodyEn: "The institute's annual national seminar will be held in Dhaka this March, featuring keynote presentations by renowned researchers.",
      category: "general",
      status: "new",
      publishedAt: daysAgo(7),
    },
    {
      slug: "dawah-fieldwork-completion",
      titleBn: "১ সপ্তাহ ব্যাপী দাওয়াহ ফিল্ডওয়ার্ক সফলভাবে সম্পন্ন",
      titleEn: "Week-long Dawah Fieldwork Completed Successfully",
      excerptBn: "শিক্ষার্থীদের সরাসরি ময়দানে হাতে-কলমে প্রশিক্ষণের অংশ হিসেবে সারাদেশে ফিল্ডওয়ার্ক পরিচালিত হয়েছে।",
      excerptEn: "Fieldwork was conducted nationwide as part of the students' hands-on field training.",
      bodyBn: "এই ফিল্ডওয়ার্কে শিক্ষার্থীরা সাধারণ মানুষের মাঝে দ্বীনের সঠিক বার্তা পৌঁছে দেওয়ার ব্যবহারিক শিক্ষা অর্জন করেছে।",
      bodyEn: "Through this fieldwork, students gained practical experience delivering the message of Islam to the public.",
      category: "general",
      status: "active",
      publishedAt: daysAgo(20),
    },
    {
      slug: "winter-vacation-notice",
      titleBn: "শীতকালীন অবকাশ ও পুনরায় ক্লাস শুরুর বিজ্ঞপ্তি",
      titleEn: "Winter Vacation & Class Resumption Notice",
      excerptBn: "শীতকালীন অবকাশ শেষে নির্ধারিত তারিখে সকল ক্লাস পুনরায় শুরু হবে।",
      excerptEn: "All classes will resume on the scheduled date after the winter vacation.",
      bodyBn: "শীতকালীন অবকাশের পর ক্লাস পুনরায় শুরু হবে। আবাসিক শিক্ষার্থীদের নির্ধারিত সময়ে ক্যাম্পাসে ফিরতে বলা হচ্ছে।",
      bodyEn: "Classes resume after the winter vacation. Residential students are asked to return to campus on time.",
      category: "academic",
      status: "closed",
      publishedAt: daysAgo(45),
    },
    {
      slug: "azan-training-3rd-batch",
      titleBn: "আযান প্রশিক্ষণ প্রোগ্রাম ৩য় ব্যাচ শুরু হচ্ছে",
      titleEn: "Azan Training Program 3rd Batch Starting",
      excerptBn: "হাফেজ/আলেমদের জন্য ১৫ দিনের আযান প্রশিক্ষণের ৩য় ব্যাচে নিবন্ধন শুরু — আগে এসে আসন নিশ্চিত করুন।",
      excerptEn: "Registration opens for the 3rd 15-day Azan Training batch for Hafiz/Alim — seats are limited.",
      bodyBn: "মাখরাজভিত্তিক বিশুদ্ধ উচ্চারণ, বিশ্ববিখ্যাত ৫টি সুর ও মুয়াযযিনের তারবিয়াহর ওপর নিবিড় প্রশিক্ষণ দেওয়া হবে।",
      bodyEn: "Intensive training on Makhraj-based pronunciation, five world-famous melodies, and the Muezzin's tarbiyah.",
      category: "admission",
      status: "new",
      publishedAt: daysAgo(3),
    },
  ];

  for (const notice of notices) {
    await db.notice.upsert({ where: { slug: notice.slug }, update: notice, create: notice });
  }
  console.log(`  ✓ ${notices.length} notices`);

  /* ————— Fatwa bank ————— */
  const fatwas = [
    {
      slug: "zakat-on-savings-bd",
      category: "muamalat",
      questionBn: "আমার ব্যাংকে জমা ৫ লক্ষ টাকা সঞ্চয় আছে। এর ওপর যাকাত আছে কি? হার কত হবে?",
      questionEn: "I have 500,000 BDT in savings. Is zakat due on it, and at what rate?",
      answerBn: "হ্যাঁ। নিসাব পরিমাণ (৮৫ গ্রাম স্বর্ণের সমমূল্যের) সম্পদ এক বছর হিজরি নিজের দখলে থাকলে তার ওপর ২.৫% হারে যাকাত ফরয হয়। আপনার ৫ লক্ষ টাকা যদি এক বছর পূর্ণ হয়ে থাকে, তাহলে ১২,৫০০ টাকা যাকাত আদায় করতে হবে। ব্যাংকে সুদের টাকা থাকলে সুদ পরিত্যাগ করে শুধু মূল সম্পদের যাকাত দিন।",
      answerEn: "Yes. Zakat is obligatory at 2.5% on wealth above nisab (equivalent to 85g of gold) held for one lunar year. If your 500,000 BDT completed a year, 12,500 BDT is due. If it includes interest, renounce the interest and pay zakat only on the principal.",
      answeredBy: "গবেষণা বোর্ড, আস-সুন্নাহ ইনস্টিটিউট",
      publishedAt: daysAgo(15),
    },
    {
      slug: "qiblah-direction-verify",
      category: "ibadat",
      questionBn: "বাংলাদেশে কিবলার সঠিক দিক কোনটি? অনেক মসজিদে ভিন্ন দিক দেখা যায় — করণীয় কী?",
      questionEn: "What is the correct qiblah direction in Bangladesh? Many mosques differ — what should we do?",
      answerBn: "বাংলাদেশের জন্য কিবলার দিক পশ্চিম-দক্ষিণ-পশ্চিম (WSW) প্রায় ২৫৭°—২৬০° কোণে। বিভিন্ন মসজিদে ব্যবধানের কারণ প্রাচীন অনুমাননির্ভর নির্ণয়। যাচাই করতে নির্ভরযোগ্য কিবলা কম্পাস বা GPS-ভিত্তিক অ্যাপ ব্যবহার করুন। যেখানে সম্ভব, স্থানীয় জামাতের সঙ্গে ঐক্য রক্ষা করুন; তবে নির্ভুল দিক জানা থাকলে তা-ই অগ্রাধিকারযোগ্য।",
      answerEn: "For Bangladesh the qiblah is WSW at roughly 257°–260°. Discrepancies stem from old estimation methods. Verify with a reliable qiblah compass or GPS app. Maintain unity with the local congregation where possible, but the accurate direction takes precedence when known.",
      answeredBy: "গবেষণা বোর্ড, আস-সুন্নাহ ইনস্টিটিউট",
      publishedAt: daysAgo(22),
    },
    {
      slug: "working-in-bank-ruling",
      category: "muamalat",
      questionBn: "সুদভিত্তিক ব্যাংকে চাকরি করার বিধান কী? আমি একটি বেসরকারি ব্যাংকে আইটি অফিসার হিসেবে কর্মরত।",
      questionEn: "What is the ruling on working at an interest-based bank? I work as an IT officer at a private bank.",
      answerBn: "সুদ হারাম এবং তাতে সহায়তাও নিষিদ্ধ। তবে ব্যাংকের এমন কিছু পদ আছে যেগুলো সরাসরি সুদ-লেনদেনের সঙ্গে সম্পৃক্ত নয় (যেমন নিরাপত্তা, সাধারণ প্রশাসন, আইটি অবকাঠামো)। প্রাথমিক ও পরোক্ষ সহায়তামূলক পদে কাজ করা শর্তসাপেক্ষে বৈধ বলেছেন অনেক ফকীহ — তবে শর্ত হলো কাজটি সুদ চুক্তিতে সরাসরি অংশগ্রহণ না করা। সুদ লেনদেনে সরাসরি নিয়োজিত পদ (ক্রেডিট, ঋণ অনুমোদন) হারাম। সুযোগ পেলে ইসলামী ব্যাংকিংয়ে স্থানান্তরের চেষ্টা করুন — তা অধিক তাকওয়ার পথ।",
      answerEn: "Interest is haram, as is assisting it. However, roles not directly involved in interest transactions (security, general admin, IT infrastructure) are considered conditionally permissible by many fuqaha, provided no direct participation in interest contracts. Positions directly executing interest (credit approval) are haram. Where possible, transfer to Islamic banking — that is the path of greater taqwa.",
      answeredBy: "গবেষণা বোর্ড, আস-সুন্নাহ ইনস্টিটিউট",
      publishedAt: daysAgo(35),
    },
    {
      slug: "aqidah-tawassul-types",
      category: "aqidah",
      questionBn: "তাওয়াসসুলের কোন ধরন জায়েয এবং কোনটি নাজায়েয? সহজ ভাষায় জানতে চাই।",
      questionEn: "Which forms of tawassul are permissible and which are not? Please explain simply.",
      answerBn: "সহজ নিয়ম: আল্লাহর সুন্দর নামসমূহ, তাঁর গুণাবলি বা নিজ নেক আমলের ওসিলায় দোয়া করা — সরাসরি কুরআন-সুন্নাহ দ্বারা প্রমাণিত, সম্পূর্ণ জায়েয। আর মৃত ব্যক্তিকে ডেকে বা তার অণুর ওসিলায় প্রার্থনা করা — তা সালাফে সালেহীনের আমলে নেই; তা থেকে বিরত থাকা কর্তব্য। ওয়াসিলা শুধু জীবিত ব্যক্তির দোয়া-প্রার্থনার ক্ষেত্রে সহীহ হাদীসে এসেছে।",
      answerEn: "Simply: supplicating through Allah's names and attributes, or one's own righteous deeds, is directly proven from the Quran and Sunnah — fully permissible. Calling upon the deceased or seeking their intercession has no basis in the practice of the Salaf; refraining is required. Waseelah through a living person's du'a is established in authentic hadith.",
      answeredBy: "গবেষণা বোর্ড, আস-সুন্নাহ ইনস্টিটিউট",
      publishedAt: daysAgo(50),
    },
    {
      slug: "family-wife-permission-work",
      category: "family",
      questionBn: "স্ত্রী চাকরি করতে চাইলে স্বামীর অনুমতি কি জরুরি? ইসলামের বিধান জানতে চাই।",
      questionEn: "Is the husband's permission required if the wife wants to work? What does Islam say?",
      answerBn: "স্ত্রীর ওপর ঘরের ভরণপোষণের দায়িত্ব নেই — তা স্বামীর। ঘরের বাইরে চাকরি করতে হলে মahram-সম্পর্কিত ও পর্দার বিধান মেনে চলা আবশ্যক; এক্ষেত্রে স্বামীর সম্মতি থাকা উত্তম ও শান্তির পথ। দাম্পত্য অধিকার-দায়িত্বের ভারসাম্য রক্ষায় পারস্পরিক আলোচনাই ইসলামী পথ। একতরফা বাধ্যবাধকতা নয় — পরামর্শ ও সমঝোতাই কাম্য।",
      answerEn: "The wife bears no obligation of household expenses — that is the husband's duty. Working outside requires observing hijrah/mahram and modesty rules; the husband's consent is preferable and the path of harmony. Mutual consultation in balancing marital rights is the Islamic way, not unilateral compulsion.",
      answeredBy: "গবেষণা বোর্ড, আস-সুন্নাহ ইনস্টিটিউট",
      publishedAt: daysAgo(60),
    },
    {
      slug: "contemporary-online-trading",
      category: "contemporary",
      questionBn: "অনলাইন ফরেক্স/শেয়ার ট্রেডিং করা কি জায়েয? ক্রিপ্টোকারেন্সির বিধান কী?",
      questionEn: "Is online forex/share trading permissible? What is the ruling on cryptocurrency?",
      answerBn: "মূলনীতি: বাস্তব সম্পদ ক্রয়-বিক্রয়ে দেনাদার পাওনাদার থাকা, জিনিস হস্তান্তর বা দাখিলা হওয়া, ঘাটতি-মূল্য (লিভারেজ ছাড়া) বাদ দিয়ে সমান বিনিময় হওয়া জরুরি। শেয়ার বাজারে তাৎক্ষণিক নগদ বিনিময় ও প্রকৃত কোম্পানির মালিকানা থাকায় শর্তসাপেক্ষে জায়েয। কিন্তু ফরেক্সে লিভারেজ, মার্জিন ও বিলম্বিত সেটেলমেন্ট — সবই সুদ ও গারারের সম্মিলন, তা হারাম। ক্রিপ্টোকারেন্সিতে প্রকৃত মালিকানা থাকলে ও সুদ/জুয়ার উপাদান বাদ দিলে হানাফি ফকীহদের কাছে স্পট ক্রয়-বিক্রয় শর্তসাপেক্ষে বৈধ বলে মত আছে; ভবিষ্যৎ চুক্তি ও লিভারেজড ট্রেডিং নিষিদ্ধ।",
      answerEn: "Core principles: real asset exchange, possession/delivery, equal exchange without deficit-pricing (no leverage). Spot share trading with actual ownership is conditionally permissible. Forex combines leverage, margin, and delayed settlement — riba and gharar; haram. Spot cryptocurrency with real ownership and no riba/gambling elements is viewed as conditionally valid by Hanafi jurists; futures and leveraged trading are prohibited.",
      answeredBy: "গবেষণা বোর্ড, আস-সুন্নাহ ইনস্টিটিউট",
      publishedAt: daysAgo(18),
    },
    {
      slug: "ibadat-combining-prayers-travel",
      category: "ibadat",
      questionBn: "সফরে জোহর ও আসর একসঙ্গে পড়া যায় কি? শর্ত কী?",
      questionEn: "Can Dhuhr and Asr be combined during travel? What are the conditions?",
      answerBn: "হ্যাঁ, সফরে জমা তাখীর (দেরিতে একত্র) জায়েয। শর্ত: প্রকৃত সফর হওয়া (প্রায় ৮১ কি.মি.+), সফরের সময়েই একত্র করা, এবং উভয় নামাজের নিজ নিজ ওয়াক্ত শুরু হওয়ার পর পড়া। কসর (২ রাকাত) সফরি নামাজে সুন্নতে সাবিত।",
      answerEn: "Yes, combining (jam' ta'khir) is permissible during genuine travel (~81+ km), done while traveling, with each prayer read after its own time has entered. Qasr (2 rak'ahs) is established Sunnah for travel prayers.",
      answeredBy: "গবেষণা বোর্ড, আস-সুন্নাহ ইনস্টিটিউট",
      publishedAt: daysAgo(75),
    },
    {
      slug: "family-photos-privacy",
      category: "family",
      questionBn: "পর্দার পোশাকে স্ত্রীর ছবি তুলে সোশ্যাল মিডিয়ায় দেওয়া কি জায়েয?",
      questionEn: "Is it permissible to post my wife's photos in hijab on social media?",
      answerBn: "পর্দা শুধু পোশাক নয় — সৌন্দর্য ও পরিচয় প্রদর্শনের সীমাও নির্ধারণ করে। পর্দার পোশাকে হলেও নিয়মিত ছবি প্রকাশ করলে অপরিচিতদের নজরে পড়া, ব্যবহার ও ফিতনার আশঙ্কা থাকে — তা পর্দার উদ্দেশ্যের সঙ্গে সাংঘর্ষিক। আরও সতর্কতার পথ: প্রকাশ্য প্ল্যাটফর্মে না দেওয়া; নিকটাত্মীয়দের বদ্ধ গ্রুপেও সংযত থাকা।",
      answerEn: "Hijab defines limits of displaying beauty and identity, not merely clothing. Regular public posting — even in hijab — risks exposure, misuse, and fitnah, conflicting with hijab's purpose. The more cautious path: avoid public platforms and remain restrained even in closed family groups.",
      answeredBy: "গবেষণা বোর্ড, আস-সুন্নাহ ইনস্টিটিউট",
      publishedAt: daysAgo(90),
    },
  ];

  for (const fatwa of fatwas) {
    await db.fatwaEntry.upsert({ where: { slug: fatwa.slug }, update: fatwa, create: fatwa });
  }
  console.log(`  ✓ ${fatwas.length} fatwa entries`);

  /* ————— Funding campaigns ————— */
  const campaigns = [
    {
      slug: "library-1000-books",
      titleBn: "লাইব্রেরির জন্য ১০০০ নতুন বই",
      titleEn: "1,000 New Books for the Library",
      descriptionBn: "গবেষণা সুবিধা বাড়াতে আরবি, ইংরেজি ও বাংলা — তিন ভাষার ১০০০ বই সংগ্রহের প্রকল্প।",
      descriptionEn: "A project to acquire 1,000 Arabic, English, and Bangla books to expand research facilities.",
      targetAmount: 800000,
      raisedAmount: 312000,
      deadline: daysAhead(75),
      active: true,
    },
    {
      slug: "winter-clothing-students",
      titleBn: "আবাসিক শিক্ষার্থীদের জন্য শীতবস্ত্র বিতরণ",
      titleEn: "Winter Clothing for Residential Students",
      descriptionBn: "অস্বচ্ছল আবাসিক শিক্ষার্থীদের জন্য কম্বল ও শীতবস্ত্র বিতরণ কার্যক্রম।",
      descriptionEn: "Distribution of blankets and winter clothing for underprivileged residential students.",
      targetAmount: 250000,
      raisedAmount: 205000,
      deadline: daysAhead(20),
      active: true,
    },
  ];

  for (const campaign of campaigns) {
    await db.fundingCampaign.upsert({ where: { slug: campaign.slug }, update: campaign, create: campaign });
  }
  console.log(`  ✓ ${campaigns.length} funding campaigns`);

  console.log("✅ Seed complete.");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    void db.$disconnect();
  });
