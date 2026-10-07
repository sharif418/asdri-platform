import { describe, test, expect } from "bun:test";
import { auditActionLabelBn, auditEntityLabelBn } from "@/lib/audit-labels";

/**
 * Round 4, H3/O-M2 pins: the dashboard and /admin/audit render audit actions
 * through the Bangla label map. The list below is the complete set of action
 * dot-codes the APIs write (grep `audit(` under src/app/api) — every code an
 * officer can ever meet must map to Bangla, and anything unknown must pass
 * through raw (the map never lies).
 */

/** Every action string greppable from src/app/api/** audit() call-sites. */
const KNOWN_ACTIONS = [
  "album.create", "album.update", "album.delete",
  "albumImage.add", "albumImage.update", "albumImage.delete",
  "application.submit", "application.status", "application.note",
  "campaign.create", "campaign.update", "campaign.delete",
  "course.create", "course.update", "course.delete", "course.curriculum", "course.specializations", "course.sdp",
  "donation.complete", "donation.fail", "donation.refund", "donation.resend", "donation.export",
  "downloadResource.create", "downloadResource.update", "downloadResource.delete",
  "faq.create", "faq.update", "faq.delete",
  "fatwaCategory.rename", "fatwaCategory.reorder",
  "fatwaEntry.create", "fatwaEntry.update", "fatwaEntry.delete",
  "fatwaQuestion.publish", "fatwaQuestion.reject", "fatwaQuestion.answer",
  "flag.update",
  "fund.create", "fund.update", "fund.delete",
  "intake.create", "intake.update", "intake.delete",
  "ledger.create", "ledger.update", "ledger.delete", "ledger.export",
  "media.upload", "media.update", "media.delete",
  "menu.create", "menu.update", "menu.delete",
  "message.read", "message.unread", "message.read-all", "message.delete",
  "notice.create", "notice.update", "notice.delete",
  "outbox.retry", "outbox.resend",
  "person.create", "person.update", "person.delete",
  "post.create", "post.update", "post.delete", "postCategory.create",
  "publication.create", "publication.update", "publication.delete",
  "researchProject.create", "researchProject.update", "researchProject.delete",
  "setting.update",
  "stat.create", "stat.update", "stat.delete",
  "team.create", "team.update", "team.delete", "team.reorder",
  "user.create", "user.update", "user.delete", "user.reset-password",
  "video.create", "video.update", "video.delete",
] as const;

describe("auditActionLabelBn", () => {
  test("every action the codebase writes maps to a Bangla sentence", () => {
    for (const action of KNOWN_ACTIONS) {
      const label = auditActionLabelBn(action);
      expect(label).not.toBe(action);
      expect(label.length).toBeGreaterThan(0);
      // Bangla sentences, not leftover dot-codes or ascii-only labels.
      expect(/[\u0980-\u09FF]/.test(label)).toBe(true);
      expect(label.includes(".")).toBe(false);
    }
  });

  test("representative samples read as expected", () => {
    expect(auditActionLabelBn("notice.create")).toBe("নোটিশ তৈরি");
    expect(auditActionLabelBn("notice.update")).toBe("নোটিশ সম্পাদনা");
    expect(auditActionLabelBn("notice.delete")).toBe("নোটিশ মুছে ফেলা");
    expect(auditActionLabelBn("fatwaQuestion.publish")).toBe("ফতোয়া প্রশ্নের উত্তর প্রকাশ");
    expect(auditActionLabelBn("user.reset-password")).toBe("ইউজারের পাসওয়ার্ড রিসেট");
  });

  test("unknown actions pass through unchanged (never lie)", () => {
    expect(auditActionLabelBn("moon.landing")).toBe("moon.landing");
    expect(auditActionLabelBn("")).toBe("");
  });
});

describe("auditEntityLabelBn", () => {
  test("every entity the APIs write maps to a Bangla label", () => {
    const entities = [
      "Album", "AlbumImage", "Application", "Campaign", "ContactMessage", "Course",
      "Donation", "DownloadResource", "Faq", "FatwaCategory", "FatwaEntry",
      "FatwaQuestion", "FeatureFlag", "Fund", "HomeSection", "Intake",
      "ManualLedgerEntry", "Media", "MenuItem", "Notice", "OutboxEmail", "Person",
      "Post", "PostCategory", "Publication", "ResearchProject", "SiteSetting",
      "Stat", "Team", "User", "Video",
    ];
    for (const entity of entities) {
      const label = auditEntityLabelBn(entity);
      expect(label).not.toBe(entity);
      expect(/[\u0980-\u09FF]/.test(label)).toBe(true);
    }
  });

  test("representative samples read as expected", () => {
    expect(auditEntityLabelBn("Notice")).toBe("নোটিশ");
    expect(auditEntityLabelBn("MenuItem")).toBe("মেনু আইটেম");
    expect(auditEntityLabelBn("ManualLedgerEntry")).toBe("লেজার এন্ট্রি");
    expect(auditEntityLabelBn("Person")).toBe("শিক্ষক/কর্মকর্তা");
  });

  test("unknown entities pass through unchanged", () => {
    expect(auditEntityLabelBn("UFO")).toBe("UFO");
  });
});
