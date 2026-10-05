import { siteConfig, navigation } from "@/content/site";
import { instituteStats, visionStatement, corePillars } from "@/content/stats";
import { instituteIntro, objectivesList, campusIntro, orgStructure, alumniEngagement } from "@/content/about";
import { dictionaries } from "@/lib/i18n";
import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient;

/** Resolve a dictionary key to both languages (menus carry real strings). */
function label(key: string): { labelBn: string; labelEn: string } {
  return {
    labelBn: dictionaries.bn[key as keyof typeof dictionaries.bn] ?? key,
    labelEn: dictionaries.en[key as keyof typeof dictionaries.en] ?? key,
  };
}

/* ————— Site settings (typed JSON) ————— */

export const SETTING_VALUES: Record<string, unknown> = {
  "site.identity": {
    nameBn: siteConfig.nameBn,
    nameEn: siteConfig.nameEn,
    parentBn: siteConfig.parentBn,
    parentEn: siteConfig.parentEn,
    shortBn: siteConfig.shortBn,
    shortEn: siteConfig.shortEn,
    taglineBn: siteConfig.taglineBn,
    taglineEn: siteConfig.taglineEn,
  },
  "site.contact": {
    addressBn: siteConfig.addressBn,
    addressEn: siteConfig.addressEn,
    campusAddressBn: siteConfig.addressBn,
    campusAddressEn: siteConfig.addressEn,
    phone: siteConfig.phone,
    email: siteConfig.email,
    emailAdmission: siteConfig.emailAdmission,
    hoursBn: siteConfig.hoursBn,
    hoursEn: siteConfig.hoursEn,
    mapsEmbed: siteConfig.mapsEmbed,
    mapsLink: siteConfig.mapsLink,
    admissionNoteBn:
      "সাধারণত সোশ্যাল মিডিয়া প্ল্যাটফর্মের মাধ্যমে ভর্তি বিজ্ঞপ্তি প্রকাশ করা হয়। ভর্তি সংক্রান্ত আপডেটের জন্য আমাদের ওয়েবসাইটের নোটিশ বোর্ড দেখুন।",
    admissionNoteEn:
      "Admission circulars are announced through the notice board on this website and our social media pages.",
  },
  "site.social": siteConfig.socials,
  "site.payment": siteConfig.payment,
  "site.vision": {
    statementBn: visionStatement.bn,
    statementEn: visionStatement.en,
    pillars: corePillars.map((p) => ({
      titleBn: p.title.bn,
      titleEn: p.title.en,
      bodyBn: p.description.bn,
      bodyEn: p.description.en,
    })),
  },
  "donations.zakat": {
    nisabSilverGrams: 52.5,
    silverRateBdt: 145, // per gram — the office updates this from admin settings
    nisabGoldGrams: 87.48,
    goldRateBdt: 12500,
  },
  "site.about": {
    intro: instituteIntro.map((p) => ({ bn: p.bn, en: p.en })),
    objectives: objectivesList.map((p) => ({ bn: p.bn, en: p.en })),
    campusIntro: { bn: campusIntro.bn, en: campusIntro.en },
    orgStructure: orgStructure.map((o) => ({
      id: o.id,
      icon: o.icon,
      title: { bn: o.title.bn, en: o.title.en },
      description: { bn: o.description.bn, en: o.description.en },
    })),
    alumniEngagement: alumniEngagement.map((a) => ({
      id: a.id,
      icon: a.icon,
      title: { bn: a.title.bn, en: a.title.en },
      description: { bn: a.description.bn, en: a.description.en },
    })),
  },
  "admissions.settings": {
    declarationBn:
      "আমি ঘোষণা করছি যে, আমি প্রদত্ত সকল তথ্য সঠিক ও নির্ভুল। কোনো তথ্য মিথ্যা প্রমাণিত হলে আমার আবেদন বাতিল বলে গণ্য হবে।",
    declarationEn:
      "I declare that all information provided is true and correct. If any information proves false, my application will be considered cancelled.",
  },
};

/* ————— Feature flags ————— */

export const FEATURE_FLAGS: { key: string; labelBn: string; labelEn: string; description?: string }[] = [
  { key: "admissions", labelBn: "অনলাইন ভর্তি আবেদন", labelEn: "Online admissions", description: "আবেদন ফর্ম, আবেদনকারী পোর্টাল ও ভর্তি ব্যবস্থাপনা" },
  { key: "donations", labelBn: "অনুদান মডিউল", labelEn: "Donations", description: "ফান্ড, ক্যাম্পেইন, যাকাত ক্যালকুলেটর ও পেমেন্ট" },
  { key: "fatwa", labelBn: "ফতোয়া ও জিজ্ঞাসা", labelEn: "Fatwa & queries", description: "ফতোয়া ব্যাংক ও অনলাইন প্রশ্ন জমা" },
  { key: "blog", labelBn: "ব্লগ ও আর্টিকেল", labelEn: "Blog & articles" },
  { key: "gallery", labelBn: "ফটো গ্যালারি", labelEn: "Photo gallery" },
  { key: "videos", labelBn: "ভিডিও ও পডকাস্ট", labelEn: "Videos & podcasts" },
  { key: "research", labelBn: "গবেষণা ও প্রকাশনা", labelEn: "Research & publications" },
  { key: "clarifications", labelBn: "সংশয় নিরসন", labelEn: "Intellectual clarifications" },
  { key: "notices", labelBn: "নোটিশ বোর্ড", labelEn: "Notice board" },
  { key: "downloads", labelBn: "ডাউনলোড সেন্টার", labelEn: "Download center" },
  { key: "newsletter", labelBn: "নিউজলেটার", labelEn: "Newsletter" },
];

/* ————— Menus (from the client's navbar document) ————— */

type MenuSeed = Prisma.MenuItemCreateInput;

/** Bind menu entries to the module flag that governs them. */
function flagForHref(href: string): string | null {
  if (href.startsWith("/admissions")) return "admissions";
  if (href.startsWith("/media/blog")) return "blog";
  if (href.startsWith("/media/videos")) return "videos";
  if (href.startsWith("/media/gallery")) return "gallery";
  if (href.startsWith("/media/news")) return "notices";
  if (href.startsWith("/research/fatwa")) return "fatwa";
  if (href.startsWith("/research/clarifications")) return "clarifications";
  if (href.startsWith("/research/publications") || href.startsWith("/research/projects") || href.startsWith("/research/library")) return "research";
  if (href.startsWith("/academics/downloads")) return "downloads";
  if (href.startsWith("/notices")) return "notices";
  return null;
}

export function buildMenuGroups(): { parentKey: string | null; parentLabel: { labelBn: string; labelEn: string }; items: MenuSeed[] }[] {
  // [dictionary key, children keys + hrefs]
  const main: [string, readonly { href: string; key: string }[]][] = [
    ["nav.about", navigation.about],
    ["nav.academics", navigation.academics],
    ["nav.admissions", navigation.admissions],
    ["nav.research", navigation.research],
    ["nav.media", navigation.media],
    ["nav.notices", navigation.notices],
    ["nav.contact", navigation.contact],
  ];

  const groups = main.map(([key, children]): { parentKey: string; parentLabel: { labelBn: string; labelEn: string }; items: MenuSeed[] } => {
    const l = label(key);
    return {
      parentKey: key,
      parentLabel: l,
      items: children.map((child, i) => ({
        location: "HEADER_MAIN" as const,
        ...label(child.key),
        href: child.href,
        sortOrder: i,
        isVisible: true,
        // Menu items bound to a module flag disappear from the public
        // navigation when that module is switched off (admin: Site settings →
        // Feature flags).
        flagKey: flagForHref(child.href),
      })),
    };
  });

  return groups;
}

/* ————— Home sections (from the client's home-contents document) ————— */

export const HOME_SECTIONS: { key: string; titleBn: string; titleEn: string; sortOrder: number }[] = [
  { key: "hero", titleBn: "হিরো — পরিচিতি", titleEn: "Hero — introduction", sortOrder: 0 },
  { key: "stats", titleBn: "এক নজরে পরিসংখ্যান", titleEn: "Impact at a glance", sortOrder: 1 },
  { key: "vision", titleBn: "মূল লক্ষ্য ও স্তম্ভসমূহ", titleEn: "Vision & core pillars", sortOrder: 2 },
  { key: "programs", titleBn: "চলমান প্রোগ্রামসমূহ", titleEn: "Featured programs", sortOrder: 3 },
  { key: "research", titleBn: "গবেষণা ও সংশয় নিরসন", titleEn: "Research highlights", sortOrder: 4 },
  { key: "notices", titleBn: "সাম্প্রতিক বিজ্ঞপ্তি", titleEn: "Recent notices", sortOrder: 5 },
  { key: "campus", titleBn: "ক্যাম্পাস লাইফ", titleEn: "Campus life", sortOrder: 6 },
  { key: "media", titleBn: "মিডিয়া হাব", titleEn: "Media & knowledge hub", sortOrder: 7 },
  { key: "leadership", titleBn: "নেতৃত্ব ও শিক্ষকবৃন্দ", titleEn: "Featured leadership", sortOrder: 8 },
  { key: "support", titleBn: "সাপোর্ট করুন", titleEn: "Support us", sortOrder: 9 },
  { key: "fatwa", titleBn: "ফতোয়া জিজ্ঞাসা", titleEn: "Fatwa gateway", sortOrder: 10 },
];

/* ————— Stats (from the client document — Bengali numerals rendered at runtime) ————— */

export function buildStats(): Prisma.StatCreateInput[] {
  return instituteStats.map((stat, i) => ({
    value: stat.value,
    suffixBn: stat.suffix ?? "",
    suffixEn: stat.suffix ?? "",
    labelBn: stat.label.bn,
    labelEn: stat.label.en,
    iconKey: stat.icon ?? null,
    sortOrder: i,
    isPublished: true,
  }));
}

export async function seedSettings(db: Db): Promise<void> {
  for (const [key, value] of Object.entries(SETTING_VALUES)) {
    await db.siteSetting.upsert({
      where: { key },
      update: { value: value as Prisma.InputJsonValue },
      create: { key, value: value as Prisma.InputJsonValue },
    });
  }

  for (const flag of FEATURE_FLAGS) {
    await db.featureFlag.upsert({
      where: { key: flag.key },
      update: { labelBn: flag.labelBn, labelEn: flag.labelEn },
      create: { ...flag, isEnabled: true },
    });
  }

  for (const section of HOME_SECTIONS) {
    await db.homeSection.upsert({
      where: { key: section.key },
      update: { titleBn: section.titleBn, titleEn: section.titleEn, sortOrder: section.sortOrder },
      create: { ...section, isEnabled: true },
    });
  }

  // Stats carry no natural unique key — recreate the band on reseed.
  await db.stat.deleteMany({});
  await db.stat.createMany({ data: buildStats() });

  // Menus: idempotent by delete+recreate (menu is fully derived from config).
  await db.menuItem.deleteMany({});
  for (const group of buildMenuGroups()) {
    const parent = await db.menuItem.create({
      data: {
        location: "HEADER_MAIN",
        labelBn: group.parentLabel.labelBn,
        labelEn: group.parentLabel.labelEn,
        href: group.items[0]?.href ?? "/",
        sortOrder: 0,
        isVisible: true,
      },
    });
    for (const item of group.items) {
      await db.menuItem.create({ data: { ...item, parent: { connect: { id: parent.id } } } });
    }
  }
  // Utility + footer quick links
  const extras: MenuSeed[] = [
    { location: "HEADER_UTILITY", ...label("action.login"), href: "/login", sortOrder: 0 },
    { location: "HEADER_UTILITY", ...label("action.register"), href: "/register", sortOrder: 1 },
    { location: "FOOTER_PRIMARY", ...label("nav.academics.courses"), href: "/academics/courses", sortOrder: 0 },
    { location: "FOOTER_PRIMARY", ...label("nav.academics.faculty"), href: "/academics/faculty", sortOrder: 1 },
    { location: "FOOTER_PRIMARY", ...label("nav.admissions"), href: "/admissions", sortOrder: 2 },
    { location: "FOOTER_PRIMARY", ...label("nav.support"), href: "/support", sortOrder: 3 },
    { location: "FOOTER_SECONDARY", ...label("nav.research.fatwa"), href: "/research/fatwa", sortOrder: 0 },
    { location: "FOOTER_SECONDARY", ...label("nav.media.blog"), href: "/media/blog", sortOrder: 1 },
    { location: "FOOTER_SECONDARY", ...label("nav.media.gallery"), href: "/media/gallery", sortOrder: 2 },
    { location: "FOOTER_SECONDARY", ...label("nav.contact.location"), href: "/contact", sortOrder: 3 },
  ];
  for (const item of extras) {
    await db.menuItem.create({ data: item });
  }

  console.log("  ✓ settings, feature flags, home sections, stats, menus");
}
