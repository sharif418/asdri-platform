import { getSiteContact, getSiteIdentity, getSitePayment, getSiteSocial } from "@/lib/settings";

/**
 * DB-backed site configuration with the exact shape the header/footer and
 * legacy pages expect (previously the static `siteConfig` from
 * src/content/site.ts — that file remains the seed source).
 */
export interface SiteConfigView {
  nameBn: string;
  nameEn: string;
  parentBn: string;
  parentEn: string;
  shortBn: string;
  shortEn: string;
  taglineBn: string;
  taglineEn: string;
  addressBn: string;
  addressEn: string;
  phone: string;
  phoneHref: string;
  email: string;
  emailAdmission: string;
  hoursBn: string;
  hoursEn: string;
  mapsEmbed: string;
  mapsLink: string;
  socials: {
    facebook: string;
    youtube: string;
    twitter: string;
    whatsapp: string;
  };
  payment: {
    bkash: string;
    nagad: string;
    rocket: string;
    bankBn: string;
  };
}

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

let cached: { value: SiteConfigView; expiresAt: number } | null = null;
const TTL_MS = 30_000;

/** Clear the merged site-config cache (called after identity/contact/social/payment writes). */
export function invalidateSiteConfig(): void {
  cached = null;
}

/** Merge identity + contact + social + payment settings into one view. */
export async function getSiteConfig(): Promise<SiteConfigView> {
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const [identity, contact, social, payment] = await Promise.all([
    getSiteIdentity(),
    getSiteContact(),
    getSiteSocial(),
    getSitePayment(),
  ]);
  const value: SiteConfigView = {
    nameBn: identity.nameBn,
    nameEn: identity.nameEn,
    parentBn: identity.parentBn,
    parentEn: identity.parentEn,
    shortBn: identity.shortBn,
    shortEn: identity.shortEn,
    taglineBn: identity.taglineBn,
    taglineEn: identity.taglineEn,
    addressBn: contact.addressBn,
    addressEn: contact.addressEn,
    phone: contact.phone,
    phoneHref: telHref(contact.phone),
    email: contact.email,
    emailAdmission: contact.emailAdmission,
    hoursBn: contact.hoursBn,
    hoursEn: contact.hoursEn,
    mapsEmbed: contact.mapsEmbed,
    mapsLink: contact.mapsLink,
    socials: {
      facebook: social.facebook,
      youtube: social.youtube,
      twitter: social.twitter,
      whatsapp: social.whatsapp,
    },
    payment: {
      bkash: payment.bkash,
      nagad: payment.nagad,
      rocket: payment.rocket,
      bankBn: payment.bankBn,
    },
  };
  cached = { value, expiresAt: Date.now() + TTL_MS };
  return value;
}
