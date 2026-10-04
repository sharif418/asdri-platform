/**
 * Central institute configuration — single source of truth for
 * identity, contact details, and social links.
 */

export const siteConfig = {
  nameBn: "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট",
  nameEn: "As-Sunnah Dawah & Research Institute",
  parentBn: "আস-সুন্নাহ ফাউন্ডেশনের একটি শিক্ষাপ্রতিষ্ঠান",
  parentEn: "An Educational Institution of As-Sunnah Foundation",
  shortBn: "আস-সুন্নাহ ইনস্টিটিউট",
  shortEn: "ASDRI",
  taglineBn:
    "কুরআন-সুন্নাহভিত্তিক দাওয়াহ, শিক্ষা ও গবেষণাভিত্তিক প্রতিষ্ঠান — বিশুদ্ধ ইসলামী জ্ঞান প্রচার ও প্রসারে নিবেদিত।",
  taglineEn:
    "A dawah, education, and research institute propagating authentic Islamic knowledge based on the Quran and Sunnah.",
  addressBn: "হোল্ডিং ৯৯, সাঁতারকুল পুকুরপাড়, কাজিবাড়ী, বাড্ডা, ঢাকা-১২১২",
  addressEn: "Holding 99, Satarkul Pukurpar, Kazibari, Badda, Dhaka-1212",
  phone: "+880 1805-437910",
  phoneHref: "tel:+8801805437910",
  email: "info@assunnah-institute.org",
  emailAdmission: "admission@assunnah-institute.org",
  hoursBn: "শনি–বৃহস্পতি, সকাল ৯টা – বিকাল ৫টা",
  hoursEn: "Sat–Thu, 9:00 AM – 5:00 PM",
  mapsEmbed:
    "https://www.google.com/maps?q=As-Sunnah+Foundation+Satarkul+Badda+Dhaka&output=embed",
  mapsLink: "https://maps.google.com/?q=As-Sunnah+Foundation+Satarkul+Badda+Dhaka",
  socials: {
    facebook: "https://www.facebook.com/assunnahfoundation",
    youtube: "https://www.youtube.com/@AsSunnahFoundation",
    twitter: "https://x.com/assunnahinfo",
    whatsapp: "https://wa.me/8801805437910",
  },
  payment: {
    bkash: "01805-437910 (Personal)",
    nagad: "01805-437910 (Personal)",
    rocket: "01805-437910-3 (Personal)",
    bankBn: "ইসলামী ব্যাংক বাংলাদেশ পিএলসি — আস-সুন্নাহ ফাউন্ডেশন (কারেন্ট অ্যাকাউন্ট)",
  },
} as const;

export const navigation = {
  about: [
    { href: "/about", key: "nav.about.overview" },
    { href: "/about/leadership", key: "nav.about.leadership" },
    { href: "/about/campus", key: "nav.about.campus" },
    { href: "/about/alumni", key: "nav.about.alumni" },
  ],
  academics: [
    { href: "/academics", key: "nav.academics.overview" },
    { href: "/academics/courses", key: "nav.academics.courses" },
    { href: "/academics/faculty", key: "nav.academics.faculty" },
    { href: "/academics/development", key: "nav.academics.sdp" },
    { href: "/academics/downloads", key: "nav.academics.downloads" },
  ],
  admissions: [
    { href: "/admissions", key: "nav.admissions.process" },
    { href: "/admissions/scholarships", key: "nav.admissions.scholarships" },
    { href: "/notices?category=admission", key: "nav.admissions.notices" },
    { href: "/admissions/faq", key: "nav.admissions.faq" },
  ],
  research: [
    { href: "/research", key: "nav.research.overview" },
    { href: "/research/library", key: "nav.research.library" },
    { href: "/research/projects", key: "nav.research.projects" },
    { href: "/research/publications", key: "nav.research.publications" },
    { href: "/research/clarifications", key: "nav.research.clarifications" },
    { href: "/research/fatwa", key: "nav.research.fatwa" },
  ],
  media: [
    { href: "/media", key: "nav.media.overview" },
    { href: "/media/blog", key: "nav.media.blog" },
    { href: "/media/videos", key: "nav.media.videos" },
    { href: "/media/news", key: "nav.media.news" },
    { href: "/media/gallery", key: "nav.media.gallery" },
  ],
  notices: [
    { href: "/notices?category=admission", key: "nav.notices.admission" },
    { href: "/notices?category=recruitment", key: "nav.notices.recruitment" },
    { href: "/notices?category=academic", key: "nav.notices.academic" },
    { href: "/notices", key: "nav.notices.general" },
  ],
  support: [
    { href: "/support?fund=zakat", key: "nav.support.zakat" },
    { href: "/support?fund=sponsor", key: "nav.support.sponsor" },
    { href: "/support?fund=general", key: "nav.support.general" },
    { href: "/support?fund=scholarship", key: "nav.support.scholarship" },
    { href: "/support/zakat-calculator", key: "nav.support.calculator" },
  ],
  contact: [
    { href: "/contact", key: "nav.contact.location" },
    { href: "/contact#other-sites", key: "nav.contact.websites" },
  ],
} as const;
