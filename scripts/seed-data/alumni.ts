import type { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/auth";
import { randomBytes } from "node:crypto";

/**
 * Round-9 alumni registry seed (restored round-6 module): 12 office-curated
 * rows across the completed programs, one linked to the alumni.demo account
 * (portal demo). Idempotent: existing rows are matched by registryNo, and a
 * MEMBER'S OWN contact edits (audit trail shows alumni.profile.self) are
 * preserved on re-seed — only office-authored fields are refreshed.
 */

interface AlumniSeedRow {
  registryNo: string;
  nameBn: string;
  nameEn: string;
  courseKey: "PYS" | "PGDID" | "CCIS" | "ATT";
  batchYear: number;
  batchNoBn: string;
  occupationBn: string;
  occupationEn: string;
  organizationBn: string;
  organizationEn: string;
  districtBn: string;
  districtEn: string;
  phone: string;
  email: string;
  addressBn: string;
  isPublished: boolean;
}

const ALUMNI_SEED: AlumniSeedRow[] = [
  {
    registryNo: "AL-2026-0001",
    nameBn: "মাওলানা আবু বকর সিদ্দীক",
    nameEn: "Maulana Abu Bakr Siddique",
    courseKey: "PGDID",
    batchYear: 2024,
    batchNoBn: "১ম ব্যাচ",
    occupationBn: "ইমাম ও খতিব",
    occupationEn: "Imam & Khatib",
    organizationBn: "জামিয়া ইসলামিয়া, ঢাকা",
    organizationEn: "Jamia Islamia, Dhaka",
    districtBn: "ঢাকা",
    districtEn: "Dhaka",
    phone: "01711000001",
    email: "alumni.demo@assunnahinstitute.org",
    addressBn: "মিরপুর ১০, ঢাকা",
    isPublished: true,
  },
  {
    registryNo: "AL-2026-0002",
    nameBn: "মাওলানা ইয়াসিন আরাফাত",
    nameEn: "Maulana Yasin Arafat",
    courseKey: "PGDID",
    batchYear: 2024,
    batchNoBn: "১ম ব্যাচ",
    occupationBn: "শিক্ষক",
    occupationEn: "Teacher",
    organizationBn: "আস-সুন্নাহ ফাউন্ডেশন, রংপুর",
    organizationEn: "As-Sunnah Foundation, Rangpur",
    districtBn: "রংপুর",
    districtEn: "Rangpur",
    phone: "01711000002",
    email: "",
    addressBn: "",
    isPublished: true,
  },
  {
    registryNo: "AL-2026-0003",
    nameBn: "হাফেজ আব্দুল্লাহ আল মামুন",
    nameEn: "Hafez Abdullah Al Mamun",
    courseKey: "PGDID",
    batchYear: 2025,
    batchNoBn: "২য় ব্যাচ",
    occupationBn: "গবেষক ও লেখক",
    occupationEn: "Researcher & writer",
    organizationBn: "সাপ্তাহিক আর-রায়দ",
    organizationEn: "Ar-Rayid weekly",
    districtBn: "চট্টগ্রাম",
    districtEn: "Chattogram",
    phone: "01711000003",
    email: "",
    addressBn: "",
    isPublished: true,
  },
  {
    registryNo: "AL-2026-0004",
    nameBn: "মাওলানা সাইফুল ইসলাম",
    nameEn: "Maulana Saiful Islam",
    courseKey: "PGDID",
    batchYear: 2025,
    batchNoBn: "২য় ব্যাচ",
    occupationBn: "দাঈ, মাদ্রাসা শিক্ষক",
    occupationEn: "Da'ee, madrasa teacher",
    organizationBn: "জামিয়া ইসলামিয়া, সিলেট",
    organizationEn: "Jamia Islamia, Sylhet",
    districtBn: "সিলেট",
    districtEn: "Sylhet",
    phone: "01711000004",
    email: "",
    addressBn: "",
    isPublished: false,
  },
  {
    registryNo: "AL-2026-0005",
    nameBn: "উস্তাজ মুহাম্মাদ রেদোয়ানুল্লাহ",
    nameEn: "Ustad Muhammad Redwanullah",
    courseKey: "CCIS",
    batchYear: 2025,
    batchNoBn: "১ম ব্যাচ",
    occupationBn: "কুরআন শিক্ষক",
    occupationEn: "Qur'an teacher",
    organizationBn: "আস-সুন্নাহ ইনস্টিটিউট",
    organizationEn: "As-Sunnah Institute",
    districtBn: "ঢাকা",
    districtEn: "Dhaka",
    phone: "01711000005",
    email: "",
    addressBn: "",
    isPublished: true,
  },
  {
    registryNo: "AL-2026-0006",
    nameBn: "মাওলানা নাজমুল হাসান",
    nameEn: "Maulana Nazmul Hasan",
    courseKey: "CCIS",
    batchYear: 2025,
    batchNoBn: "১ম ব্যাচ",
    occupationBn: "তালিমুল কুরআন প্রশিক্ষক",
    occupationEn: "Taleemul Qur'an trainer",
    organizationBn: "",
    organizationEn: "",
    districtBn: "গাজীপুর",
    districtEn: "Gazipur",
    phone: "01711000006",
    email: "",
    addressBn: "",
    isPublished: true,
  },
  {
    registryNo: "AL-2026-0007",
    nameBn: "হাফেজ যাকারিয়া আল আমীন",
    nameEn: "Hafez Zakaria Al Amin",
    courseKey: "CCIS",
    batchYear: 2025,
    batchNoBn: "১ম ব্যাচ",
    occupationBn: "মুয়াযযিন ও শিক্ষক",
    occupationEn: "Muazzin & teacher",
    organizationBn: "মসজিদ আস-সুন্নাহ, উত্তরা",
    organizationEn: "As-Sunnah Mosque, Uttara",
    districtBn: "ঢাকা",
    districtEn: "Dhaka",
    phone: "01711000007",
    email: "",
    addressBn: "",
    isPublished: false,
  },
  {
    registryNo: "AL-2026-0008",
    nameBn: "উস্তাজ আহমাদ হুসাইন",
    nameEn: "Ustad Ahmad Husain",
    courseKey: "ATT",
    batchYear: 2024,
    batchNoBn: "১ম ব্যাচ",
    occupationBn: "আরবি ভাষা শিক্ষক",
    occupationEn: "Arabic language teacher",
    organizationBn: "ভাষা প্রশিক্ষণ কেন্দ্র, নারায়ণগঞ্জ",
    organizationEn: "Language center, Narayanganj",
    districtBn: "নারায়ণগঞ্জ",
    districtEn: "Narayanganj",
    phone: "01711000008",
    email: "",
    addressBn: "",
    isPublished: true,
  },
  {
    registryNo: "AL-2026-0009",
    nameBn: "মাওলানা ইমরান মাহমুদ",
    nameEn: "Maulana Imran Mahmud",
    courseKey: "ATT",
    batchYear: 2024,
    batchNoBn: "১ম ব্যাচ",
    occupationBn: "আরবি ভাষা শিক্ষক",
    occupationEn: "Arabic language teacher",
    organizationBn: "আইডিয়াল স্কুল, কুমিল্লা",
    organizationEn: "Ideal School, Cumilla",
    districtBn: "কুমিল্লা",
    districtEn: "Cumilla",
    phone: "01711000009",
    email: "",
    addressBn: "",
    isPublished: true,
  },
  {
    registryNo: "AL-2026-0010",
    nameBn: "মাওলানা খালিদ সাইফী",
    nameEn: "Maulana Khalid Saifi",
    courseKey: "ATT",
    batchYear: 2024,
    batchNoBn: "১ম ব্যাচ",
    occupationBn: "অনুবাদক",
    occupationEn: "Translator",
    organizationBn: "প্রকাশনা প্রতিষ্ঠান, বায়তুল মুকাররম",
    organizationEn: "Publisher, Baitul Mukarram",
    districtBn: "ঢাকা",
    districtEn: "Dhaka",
    phone: "01711000010",
    email: "",
    addressBn: "",
    isPublished: false,
  },
  {
    registryNo: "AL-2026-0011",
    nameBn: "মাওলানা তানভীর আহমাদ",
    nameEn: "Maulana Tanvir Ahmad",
    courseKey: "PYS",
    batchYear: 2025,
    batchNoBn: "১ম ব্যাচ",
    occupationBn: "তাখাসসুস শিক্ষার্থী",
    occupationEn: "Takhassus student",
    organizationBn: "আস-সুন্নাহ ইনস্টিটিউট",
    organizationEn: "As-Sunnah Institute",
    districtBn: "ঢাকা",
    districtEn: "Dhaka",
    phone: "01711000011",
    email: "",
    addressBn: "",
    isPublished: true,
  },
  {
    registryNo: "AL-2026-0012",
    nameBn: "মাওলানা রফিকুল ইসলাম",
    nameEn: "Maulana Rafiqul Islam",
    courseKey: "PYS",
    batchYear: 2025,
    batchNoBn: "১ম ব্যাচ",
    occupationBn: "তাখাসসুস শিক্ষার্থী",
    occupationEn: "Takhassus student",
    organizationBn: "আস-সুন্নাহ ইনস্টিটিউট",
    organizationEn: "As-Sunnah Institute",
    districtBn: "ময়মনসিংহ",
    districtEn: "Mymensingh",
    phone: "01711000012",
    email: "",
    addressBn: "",
    isPublished: true,
  },
];

export async function seedAlumni(db: PrismaClient): Promise<void> {
  // the demo alumnus account (QA login via set-demo-password)
  const demo = await db.user.findUnique({ where: { email: "alumni.demo@assunnahinstitute.org" } });
  const demoUserId =
    demo?.id ??
    (
      await db.user.create({
        data: {
          email: "alumni.demo@assunnahinstitute.org",
          name: "মাওলানা আবু বকর সিদ্দীক (প্রাক্তন)",
          role: "ALUMNI",
          passwordHash: hashPassword(randomBytes(18).toString("base64url")),
          emailVerifiedAt: new Date(),
        },
      })
    ).id;

  for (const row of ALUMNI_SEED) {
    const existing = await db.alumniProfile.findUnique({ where: { registryNo: row.registryNo } });
    const isDemoRow = row.registryNo === "AL-2026-0001";
    if (!existing) {
      await db.alumniProfile.create({
        data: { ...row, userId: isDemoRow ? demoUserId : null },
      });
      continue;
    }
    // re-seed refreshes office fields but keeps the member's own contact edits
    // (a linked row may have been self-updated through the portal) — only the
    // unlinked, office-only rows get their contact refreshed verbatim.
    const memberOwned = existing.userId !== null;
    await db.alumniProfile.update({
      where: { id: existing.id },
      data: {
        nameBn: row.nameBn,
        nameEn: row.nameEn,
        courseKey: row.courseKey,
        batchYear: row.batchYear,
        batchNoBn: row.batchNoBn,
        occupationEn: row.occupationEn,
        organizationEn: row.organizationEn,
        districtEn: row.districtEn,
        isPublished: row.isPublished,
        ...(memberOwned
          ? {}
          : {
              occupationBn: row.occupationBn,
              organizationBn: row.organizationBn,
              districtBn: row.districtBn,
              phone: row.phone,
              email: row.email,
              addressBn: row.addressBn,
            }),
        ...(isDemoRow && !existing.userId ? { userId: demoUserId } : {}),
      },
    });
  }
  console.log("  ✓ alumni registry seeded (12 rows, alumni.demo linked)");
}
