/**
 * Bangla labels for the audit trail (round 4, H3 + O-M2/M5). The APIs write
 * dot-codes (notice.create, fatwaQuestion.publish…) and English model names
 * (Notice, MenuItem…); the dashboard's "সাম্প্রতিক কার্যক্রম" widget and
 * /admin/audit render them through this map so a Bangla officer reads
 * sentences, not developer codes. Unknown values pass through unchanged —
 * the map must never lie about what happened.
 *
 * The action list is the complete set of `audit(...)` call-sites under
 * src/app/api/** (extend it when a new action is added).
 */

/** action dot-code → short Bangla sentence. */
const ACTION_LABELS_BN: Record<string, string> = {
  // notices
  "notice.create": "নোটিশ তৈরি",
  "notice.update": "নোটিশ সম্পাদনা",
  "notice.delete": "নোটিশ মুছে ফেলা",
  // blog posts + categories
  "post.create": "ব্লগ পোস্ট তৈরি",
  "post.update": "ব্লগ পোস্ট সম্পাদনা",
  "post.delete": "ব্লগ পোস্ট মুছে ফেলা",
  "postCategory.create": "ব্লগ ক্যাটাগরি তৈরি",
  // gallery
  "album.create": "অ্যালবাম তৈরি",
  "album.update": "অ্যালবাম সম্পাদনা",
  "album.delete": "অ্যালবাম মুছে ফেলা",
  "albumImage.add": "অ্যালবামে ছবি যোগ",
  "albumImage.update": "অ্যালবামের ছবি সম্পাদনা",
  "albumImage.delete": "অ্যালবামের ছবি মুছে ফেলা",
  // videos
  "video.create": "ভিডিও তৈরি",
  "video.update": "ভিডিও সম্পাদনা",
  "video.delete": "ভিডিও মুছে ফেলা",
  // people + teams
  "person.create": "প্রোফাইল তৈরি",
  "person.update": "প্রোফাইল সম্পাদনা",
  "person.delete": "প্রোফাইল মুছে ফেলা",
  "team.create": "টিম তৈরি",
  "team.update": "টিম সম্পাদনা",
  "team.delete": "টিম মুছে ফেলা",
  "team.reorder": "টিমের ক্রম বদল",
  // courses
  "course.create": "কোর্স তৈরি",
  "course.update": "কোর্স সম্পাদনা",
  "course.delete": "কোর্স মুছে ফেলা",
  "course.curriculum": "কারিকুলাম সংরক্ষণ",
  "course.specializations": "তাখাসসুস তালিকা সংরক্ষণ",
  "course.sdp": "উন্নয়ন কার্যক্রম (SDP) সংরক্ষণ",
  // media library
  "media.upload": "মিডিয়া আপলোড",
  "media.update": "মিডিয়া সম্পাদনা",
  "media.delete": "মিডিয়া মুছে ফেলা",
  // admissions
  "intake.create": "ইনটেক তৈরি",
  "intake.update": "ইনটেক সম্পাদনা",
  "intake.delete": "ইনটেক মুছে ফেলা",
  "application.submit": "আবেদন জমা",
  "application.status": "আবেদনের স্ট্যাটাস বদল",
  "application.note": "আবেদনে অফিসার মন্তব্য",
  // fatwa
  "fatwaQuestion.publish": "ফতোয়া প্রশ্নের উত্তর প্রকাশ",
  "fatwaQuestion.reject": "ফতোয়া প্রশ্ন বাতিল",
  "fatwaQuestion.answer": "ফতোয়া প্রশ্নের উত্তর যুক্ত",
  "fatwaEntry.create": "ফতোয়া তৈরি",
  "fatwaEntry.update": "ফতোয়া সম্পাদনা",
  "fatwaEntry.delete": "ফতোয়া মুছে ফেলা",
  "fatwaCategory.rename": "ফতোয়া ক্যাটাগরির নাম বদল",
  "fatwaCategory.reorder": "ফতোয়া ক্যাটাগরির ক্রম বদল",
  // finance
  "fund.create": "ফান্ড তৈরি",
  "fund.update": "ফান্ড সম্পাদনা",
  "fund.delete": "ফান্ড মুছে ফেলা",
  "campaign.create": "ক্যাম্পেইন তৈরি",
  "campaign.update": "ক্যাম্পেইন সম্পাদনা",
  "campaign.delete": "ক্যাম্পেইন মুছে ফেলা",
  "donation.complete": "অনুদান সম্পন্ন করা",
  "donation.fail": "অনুদান ব্যর্থ চিহ্নিত",
  "donation.refund": "অনুদান ফেরত চিহ্নিত",
  "donation.resend": "অনুদান রিসিপ্ট পুনঃপ্রেরণ",
  "donation.export": "অনুদান তালিকা এক্সপোর্ট",
  "ledger.create": "লেজার এন্ট্রি তৈরি",
  "ledger.update": "লেজার এন্ট্রি সম্পাদনা",
  "ledger.delete": "লেজার এন্ট্রি মুছে ফেলা",
  "ledger.export": "লেজার এক্সপোর্ট",
  "outbox.retry": "ইমেইল আবার পাঠানোর চেষ্টা",
  "outbox.resend": "ইমেইল পুনঃপ্রেরণ",
  // inbox
  "message.read": "বার্তা পঠিত করা",
  "message.unread": "বার্তা অপঠিত করা",
  "message.read-all": "সব বার্তা পঠিত করা",
  "message.delete": "বার্তা মুছে ফেলা",
  // users, settings, menus, flags
  "user.create": "ইউজার তৈরি",
  "user.update": "ইউজার সম্পাদনা",
  "user.delete": "ইউজার মুছে ফেলা",
  "invitation.create": "আমন্ত্রণ পাঠানো হয়েছে",
  "invitation.revoke": "আমন্ত্রণ বাতিল করা হয়েছে",
  "user.reset-password": "ইউজারের পাসওয়ার্ড রিসেট",
  "setting.update": "সাইট সেটিংস পরিবর্তন",
  "menu.create": "মেনু আইটেম তৈরি",
  "menu.update": "মেনু আইটেম সম্পাদনা",
  "menu.delete": "মেনু আইটেম মুছে ফেলা",
  "flag.update": "ফিচার ফ্ল্যাগ পরিবর্তন",
  // page content
  "stat.create": "পরিসংখ্যান তৈরি",
  "stat.update": "পরিসংখ্যান সম্পাদনা",
  "stat.delete": "পরিসংখ্যান মুছে ফেলা",
  "faq.create": "প্রশ্নোত্তর তৈরি",
  "faq.update": "প্রশ্নোত্তর সম্পাদনা",
  "faq.delete": "প্রশ্নোত্তর মুছে ফেলা",
  // research
  "publication.create": "প্রকাশনা তৈরি",
  "publication.update": "প্রকাশনা সম্পাদনা",
  "publication.delete": "প্রকাশনা মুছে ফেলা",
  "researchProject.create": "গবেষণা প্রকল্প তৈরি",
  "researchProject.update": "গবেষণা প্রকল্প সম্পাদনা",
  "researchProject.delete": "গবেষণা প্রকল্প মুছে ফেলা",
  "downloadResource.create": "ডাউনলোড আইটেম তৈরি",
  "downloadResource.update": "ডাউনলোড আইটেম সম্পাদনা",
  "downloadResource.delete": "ডাউনলোড আইটেম মুছে ফেলা",
  // library
  "library.item.create": "লাইব্রেরি আইটেম তৈরি",
  "library.item.update": "লাইব্রেরি আইটেম সম্পাদনা",
  "library.item.delete": "লাইব্রেরি আইটেম মুছে ফেলা",
  "library.category.create": "লাইব্রেরি ক্যাটাগরি তৈরি",
  "library.category.update": "লাইব্রেরি ক্যাটাগরি সম্পাদনা",
  "library.category.delete": "লাইব্রেরি ক্যাটাগরি মুছে ফেলা",
  "library.checkout.create": "ধার রেকর্ড তৈরি",
  "library.checkout.return": "ধার ফেরত গ্রহণ",
  // alumni registry (round-9)
  "alumni.profile.create": "অ্যালামনাই রেকর্ড তৈরি",
  "alumni.profile.update": "অ্যালামনাই রেকর্ড সম্পাদনা",
  "alumni.profile.delete": "অ্যালামনাই রেকর্ড মুছে ফেলা",
  "alumni.profile.self": "প্রাক্তনের নিজ তথ্য হালনাগাদ",
  // guardian self-service (round-10)
  "guardianLink.self": "অভিভাবকের নিজ সন্তান সংযোগ",
};

/** Prisma model name (the audit `entity` column) → Bangla label. */
const ENTITY_LABELS_BN: Record<string, string> = {
  Album: "অ্যালবাম",
  AlbumImage: "অ্যালবামের ছবি",
  AlumniProfile: "অ্যালামনাই রেকর্ড",
  Application: "আবেদন",
  GuardianLink: "অভিভাবক সংযোগ",
  Campaign: "ক্যাম্পেইন",
  ContactMessage: "বার্তা",
  Course: "কোর্স",
  Donation: "অনুদান",
  DownloadResource: "ডাউনলোড",
  Faq: "প্রশ্নোত্তর",
  FatwaCategory: "ফতোয়া ক্যাটাগরি",
  FatwaEntry: "ফতোয়া",
  FatwaQuestion: "ফতোয়া প্রশ্ন",
  FeatureFlag: "ফিচার ফ্ল্যাগ",
  Fund: "ফান্ড",
  HomeSection: "হোম সেকশন",
  Intake: "ইনটেক",
  ManualLedgerEntry: "লেজার এন্ট্রি",
  Media: "মিডিয়া",
  MenuItem: "মেনু আইটেম",
  Notice: "নোটিশ",
  NewsletterSubscriber: "সাবস্ক্রাইবার",
  OutboxEmail: "ইমেইল",
  Person: "শিক্ষক/কর্মকর্তা",
  Post: "ব্লগ পোস্ট",
  PostCategory: "ব্লগ ক্যাটাগরি",
  Publication: "প্রকাশনা",
  ResearchProject: "গবেষণা প্রকল্প",
  SiteSetting: "সাইট সেটিংস",
  Stat: "পরিসংখ্যান",
  Team: "টিম",
  User: "ইউজার",
  Invitation: "আমন্ত্রণ",
  Video: "ভিডিও",
  LibraryItem: "লাইব্রেরি আইটেম",
  LibraryCategory: "লাইব্রেরি ক্যাটাগরি",
  LibraryCheckout: "ধারের রেকর্ড",
};

/** Bangla sentence for an audit action dot-code; unknown codes pass through. */
export function auditActionLabelBn(action: string): string {
  return ACTION_LABELS_BN[action] ?? action;
}

/** Bangla label for an audit entity/model name; unknown names pass through. */
export function auditEntityLabelBn(entity: string): string {
  return ENTITY_LABELS_BN[entity] ?? entity;
}
