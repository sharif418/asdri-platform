import { db } from "@/lib/db";
import { env } from "@/lib/env";

/**
 * Server-side settings + feature-flag access with per-request caching.
 * Values are typed JSON blobs the office edits from the admin; accessors
 * validate the expected shape and fall back to safe defaults when a key is
 * missing (a module must never crash the site because a setting was never
 * saved).
 */

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const TTL_MS = 30_000;

async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value as T;
  const row = await db.siteSetting.findUnique({ where: { key } });
  const value = (row?.value as T) ?? fallback;
  cache.set(key, { value, expiresAt: Date.now() + TTL_MS });
  return value;
}

export function invalidateSettings(): void {
  cache.clear();
  // The flag cache shares this invalidation contract: settings writes and
  // flag toggles must both take effect immediately.
  flagCacheValue = null;
}

/** Read an arbitrary setting key with a typed fallback (for adapters). */
export function readSetting<T>(key: string, fallback: T): Promise<T> {
  return getSetting<T>(key, fallback);
}

/* ————— typed accessors ————— */

export interface SiteIdentity {
  nameBn: string;
  nameEn: string;
  parentBn: string;
  parentEn: string;
  shortBn: string;
  shortEn: string;
  taglineBn: string;
  taglineEn: string;
}

export interface SiteContact {
  addressBn: string;
  addressEn: string;
  campusAddressBn: string;
  campusAddressEn: string;
  phone: string;
  email: string;
  emailAdmission: string;
  hoursBn: string;
  hoursEn: string;
  mapsEmbed: string;
  mapsLink: string;
  admissionNoteBn: string;
  admissionNoteEn: string;
}

export interface SiteSocial {
  facebook: string;
  youtube: string;
  twitter: string;
  whatsapp: string;
}

export interface VisionSetting {
  statementBn: string;
  statementEn: string;
  pillars: { titleBn: string; titleEn: string; bodyBn: string; bodyEn: string }[];
}

export interface ZakatSetting {
  nisabSilverGrams: number;
  silverRateBdt: number;
  nisabGoldGrams: number;
  goldRateBdt: number;
}

export interface AlumniSetting {
  introBn: string;
  introEn: string;
}

export interface AboutSetting {
  intro: { bn: string; en: string }[];
  objectives: { bn: string; en: string }[];
  campusIntro: { bn: string; en: string };
  orgStructure: { id: string; icon: string; title: { bn: string; en: string }; description: { bn: string; en: string } }[];
  alumniEngagement: { id: string; icon: string; title: { bn: string; en: string }; description: { bn: string; en: string } }[];
}

export interface SitePayment {
  bkash: string;
  nagad: string;
  rocket: string;
  bankBn: string;
}

const FALLBACK_IDENTITY: SiteIdentity = {
  nameBn: "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট",
  nameEn: "As-Sunnah Dawah & Research Institute",
  parentBn: "আস-সুন্নাহ ফাউন্ডেশনের একটি শিক্ষাপ্রতিষ্ঠান",
  parentEn: "An Educational Institution of As-Sunnah Foundation",
  shortBn: "আস-সুন্নাহ ইনস্টিটিউট",
  shortEn: "ASDRI",
  taglineBn: "কুরআন-সুন্নাহভিত্তিক দাওয়াহ, শিক্ষা ও গবেষণাভিত্তিক প্রতিষ্ঠান।",
  taglineEn: "A dawah, education, and research institute based on the Quran and Sunnah.",
};

export async function getSiteIdentity(): Promise<SiteIdentity> {
  return getSetting<SiteIdentity>("site.identity", FALLBACK_IDENTITY);
}
export async function getSiteContact(): Promise<SiteContact> {
  return getSetting<SiteContact>("site.contact", {
    addressBn: "হোল্ডিং ৯৯, সাঁতারকুল পুকুরপাড়, কাজিবাড়ী, বাড্ডা, ঢাকা-১২১২",
    addressEn: "Holding 99, Satarkul Pukurpar, Kazibari, Badda, Dhaka-1212",
    campusAddressBn: "হোল্ডিং ৯৯, সাঁতারকুল পুকুরপাড়, কাজিবাড়ী, বাড্ডা, ঢাকা-১২১২",
    campusAddressEn: "Holding 99, Satarkul Pukurpar, Kazibari, Badda, Dhaka-1212",
    phone: "+880 1805-437910",
    email: "info@assunnah-institute.org",
    emailAdmission: "admission@assunnah-institute.org",
    hoursBn: "শনি–বৃহস্পতি, সকাল ৯টা – বিকাল ৫টা",
    hoursEn: "Sat–Thu, 9:00 AM – 5:00 PM",
    mapsEmbed: "https://www.google.com/maps?q=As-Sunnah+Foundation+Satarkul+Badda+Dhaka&output=embed",
    mapsLink: "https://maps.google.com/?q=As-Sunnah+Foundation+Satarkul+Badda+Dhaka",
    admissionNoteBn: "ভর্তি বিজ্ঞপ্তি নোটিশ বোর্ডে প্রকাশিত হয়।",
    admissionNoteEn: "Admission circulars are published on the notice board.",
  });
}
export async function getSiteSocial(): Promise<SiteSocial> {
  return getSetting<SiteSocial>("site.social", {
    facebook: "https://www.facebook.com/assunnahfoundation",
    youtube: "https://www.youtube.com/@AsSunnahFoundation",
    twitter: "",
    whatsapp: "",
  });
}
export async function getVision(): Promise<VisionSetting> {
  return getSetting<VisionSetting>("site.vision", {
    statementBn: "",
    statementEn: "",
    pillars: [],
  });
}
export async function getZakatConfig(): Promise<ZakatSetting> {
  return getSetting<ZakatSetting>("donations.zakat", {
    nisabSilverGrams: 52.5,
    silverRateBdt: 145,
    nisabGoldGrams: 87.48,
    goldRateBdt: 12500,
  });
}
export async function getAlumniIntro(): Promise<AlumniSetting> {
  return getSetting<AlumniSetting>("site.alumni", { introBn: "", introEn: "" });
}
export async function getAboutContent(): Promise<AboutSetting> {
  return getSetting<AboutSetting>("site.about", {
    intro: [],
    objectives: [],
    campusIntro: { bn: "", en: "" },
    orgStructure: [],
    alumniEngagement: [],
  });
}
export async function getSitePayment(): Promise<SitePayment> {
  return getSetting<SitePayment>("site.payment", {
    bkash: "",
    nagad: "",
    rocket: "",
    bankBn: "",
  });
}
export async function getHeroMediaId(): Promise<string | null> {
  const value = await getSetting<{ mediaId: string | null }>("site.hero", { mediaId: null });
  return value?.mediaId ?? null;
}

/* ————— feature flags ————— */

let flagCacheValue: { value: Map<string, boolean>; expiresAt: number } | null = null;

/** Is a module enabled? Unknown keys default to enabled (fail-open for content). */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  if (!flagCacheValue || flagCacheValue.expiresAt < Date.now()) {
    const rows = await db.featureFlag.findMany({ select: { key: true, isEnabled: true } });
    flagCacheValue = { value: new Map(rows.map((r) => [r.key, r.isEnabled])), expiresAt: Date.now() + TTL_MS };
  }
  const value = flagCacheValue.value.get(key);
  return value ?? true;
}

export async function getEnabledFlags(): Promise<Map<string, boolean>> {
  await isFeatureEnabled("__warm__"); // populate cache
  return flagCacheValue?.value ?? new Map();
}

export { env };
