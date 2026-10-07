import type { Prisma, PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/auth";
import { randomBytes } from "node:crypto";

type Db = PrismaClient;
type Tx = Prisma.TransactionClient;

/**
 * Round-5 admissions day-one reality: before this module the seed shipped no
 * Intake and no Application rows, so a fresh install showed "কোনো খোলা ইনটেক
 * নেই" on the public apply form, an empty ভর্তি কার্যালয় in the admin, and a
 * guardian portal with nothing linked (the round-4 seed line claimed a
 * "seeded application" that did not exist).
 *
 * Everything here is idempotent and office-safe: intakes upsert on the
 * course-year natural key, and applications are created only when their
 * tracking number is absent — a re-run never resets an officer's review.
 */

const APPLICANT_DEMO_EMAIL = "applicant.demo@assunnahinstitute.org";

interface IntakeSeed {
  courseCode: string;
  year: number;
  sessionBn: string;
  sessionEn: string;
  opensAt: Date;
  closesAt: Date;
  examDate: Date | null;
  seatsTotal: number;
  isPublished: boolean;
  status: "UPCOMING" | "OPEN" | "CLOSED";
}

/** The 2026 admission season the office is actually running. */
const INTAKE_SEEDS: IntakeSeed[] = [
  {
    courseCode: "PYS",
    year: 2026,
    sessionBn: "২০২৬ শিক্ষাবর্ষ",
    sessionEn: "2026 session",
    opensAt: new Date("2025-11-01T00:00:00Z"),
    closesAt: new Date("2026-02-15T23:59:59Z"),
    examDate: new Date("2026-02-25T00:00:00Z"),
    seatsTotal: 60,
    isPublished: true,
    status: "OPEN",
  },
  {
    courseCode: "ATT",
    year: 2026,
    sessionBn: "২০২৬ শিক্ষাবর্ষ",
    sessionEn: "2026 session",
    opensAt: new Date("2025-12-01T00:00:00Z"),
    closesAt: new Date("2026-01-31T23:59:59Z"),
    examDate: new Date("2026-02-10T00:00:00Z"),
    seatsTotal: 40,
    isPublished: true,
    status: "OPEN",
  },
  {
    courseCode: "CCIS",
    year: 2026,
    sessionBn: "২০২৬ শিক্ষাবর্ষ",
    sessionEn: "2026 session",
    opensAt: new Date("2026-02-20T00:00:00Z"),
    closesAt: new Date("2026-03-31T23:59:59Z"),
    examDate: null,
    seatsTotal: 50,
    isPublished: true,
    status: "UPCOMING",
  },
  {
    courseCode: "DIPLOM",
    year: 2025,
    sessionBn: "২০২৫ শিক্ষাবর্ষ",
    sessionEn: "2025 session",
    opensAt: new Date("2024-11-01T00:00:00Z"),
    closesAt: new Date("2025-01-15T23:59:59Z"),
    examDate: new Date("2025-01-25T00:00:00Z"),
    seatsTotal: 50,
    isPublished: true,
    status: "CLOSED",
  },
];

interface EducationSeed {
  level: string;
  institution: string;
  groupOrSubject: string;
  year: number;
  result: string;
}

interface ApplicationSeed {
  trackingNo: string;
  courseCode: string;
  year: number;
  submittedAt: Date;
  claimedByEmail: string | null; // linked applicant account
  fullNameBn: string;
  fullNameEn: string;
  fatherName: string;
  motherName: string;
  birthDate: Date;
  gender: string;
  phone: string;
  email: string | null;
  presentAddress: string;
  guardianName: string;
  guardianPhone: string;
  guardianRelation: string;
  status:
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "EXAM_SCHEDULED"
    | "SHORTLISTED"
    | "ADMITTED";
  education: EducationSeed[];
  /** Status trail in order; the first entry doubles as the submission event. */
  events: { status: ApplicationSeed["status"]; note: string }[];
}

const APPLICATION_SEEDS: ApplicationSeed[] = [
  {
    trackingNo: "ASDRI-2026-000101",
    courseCode: "PYS",
    year: 2026,
    submittedAt: new Date("2025-12-05T10:20:00Z"),
    claimedByEmail: APPLICANT_DEMO_EMAIL,
    fullNameBn: "মুহাম্মাদ আব্দুল্লাহ আল মামুন",
    fullNameEn: "Muhammad Abdullah Al Mamun",
    fatherName: "আব্দুল করিম",
    motherName: "ফাতিমা খাতুন",
    birthDate: new Date("2006-04-12T00:00:00Z"),
    gender: "male",
    phone: "01712345671",
    email: APPLICANT_DEMO_EMAIL,
    presentAddress: "বাড়ি ১২, রোড ৫, ধানমন্ডি, ঢাকা-১২০৫",
    guardianName: "আব্দুল করিম",
    guardianPhone: "01712345670",
    guardianRelation: "পিতা",
    status: "SUBMITTED",
    education: [
      { level: "এসএসসি", institution: "ধানমন্ডি সরকারি উচ্চ বিদ্যালয়, ঢাকা", groupOrSubject: "বিজ্ঞান", year: 2022, result: "জিপিএ ৪.৮৯" },
      { level: "এইচএসসি", institution: "ঢাকা কলেজ", groupOrSubject: "বিজ্ঞান", year: 2024, result: "জিপিএ ৪.৫৬" },
    ],
    events: [{ status: "SUBMITTED", note: "অনলাইন আবেদন জমা হয়েছে।" }],
  },
  {
    trackingNo: "ASDRI-2026-000102",
    courseCode: "ATT",
    year: 2026,
    submittedAt: new Date("2025-12-08T04:35:00Z"),
    claimedByEmail: null,
    fullNameBn: "সাইফুল ইসলাম",
    fullNameEn: "Saiful Islam",
    fatherName: "মোঃ ইউনুস আলী",
    motherName: "রহিমা বেগম",
    birthDate: new Date("2001-09-03T00:00:00Z"),
    gender: "male",
    phone: "01812345672",
    email: null,
    presentAddress: "গ্রাম: রামপুর, উপজেলা: সদর, জেলা: কুমিল্লা",
    guardianName: "মোঃ ইউনুস আলী",
    guardianPhone: "01812345670",
    guardianRelation: "পিতা",
    status: "UNDER_REVIEW",
    education: [
      { level: "এসএসসি", institution: "রামপুর উচ্চ বিদ্যালয়, কুমিল্লা", groupOrSubject: "মানবিক", year: 2017, result: "জিপিএ ৪.১০" },
      { level: "তাকমিল (হিফজ)", institution: "জামিয়া ইসলামিয়া, কুমিল্লা", groupOrSubject: "কুরআন মুখস্থ", year: 2020, result: "সনদ লাভ করেছেন" },
    ],
    events: [
      { status: "SUBMITTED", note: "অনলাইন আবেদন জমা হয়েছে।" },
      { status: "UNDER_REVIEW", note: "প্রাথমিক তালিকায় অন্তর্ভুক্ত — শিক্ষা সনদ যাচাই চলছে।" },
    ],
  },
  {
    trackingNo: "ASDRI-2026-000103",
    courseCode: "PYS",
    year: 2026,
    submittedAt: new Date("2025-12-10T09:05:00Z"),
    claimedByEmail: null,
    fullNameBn: "তাসনিম আরা বিনতে আলী",
    fullNameEn: "Tasneem Ara binte Ali",
    fatherName: "মোঃ আব্দুল কালাম",
    motherName: "নুরজাহান বেগম",
    birthDate: new Date("2005-01-25T00:00:00Z"),
    gender: "female",
    phone: "01912345673",
    email: null,
    presentAddress: "সেক্টর ১১, উত্তরা, ঢাকা-১২৩০",
    guardianName: "মোঃ আব্দুল কালাম",
    guardianPhone: "01912345670",
    guardianRelation: "পিতা",
    status: "EXAM_SCHEDULED",
    education: [
      { level: "এসএসসি", institution: "উত্তরা মডেল সরকারি উচ্চ বিদ্যালয়", groupOrSubject: "বিজ্ঞান", year: 2021, result: "জিপিএ ৫.০০" },
      { level: "এইচএসসি", institution: "ঢাকা মহিলা কলেজ", groupOrSubject: "বিজ্ঞান", year: 2023, result: "জিপিএ ৪.৯২" },
    ],
    events: [
      { status: "SUBMITTED", note: "অনলাইন আবেদন জমা হয়েছে।" },
      { status: "UNDER_REVIEW", note: "প্রাথমিক তালিকায় অন্তর্ভুক্ত।" },
      { status: "SHORTLISTED", note: "লিখিত পরীক্ষার জন্য নির্বাচিত।" },
      { status: "EXAM_SCHEDULED", note: "লিখিত পরীক্ষার প্রবেশপত্র প্রস্তুত — তারিখ ২৫ ফেব্রুয়ারি ২০২৬।" },
    ],
  },
];

/** Find-or-create the applicant demo account (random password by design). */
async function ensureApplicantDemo(db: Db): Promise<string> {
  const existing = await db.user.findUnique({ where: { email: APPLICANT_DEMO_EMAIL } });
  if (existing) return existing.id;
  const created = await db.user.create({
    data: {
      email: APPLICANT_DEMO_EMAIL,
      name: "মুহাম্মাদ আব্দুল্লাহ আল মামুন (আবেদনকারী)",
      role: "APPLICANT",
      passwordHash: hashPassword(randomBytes(18).toString("base64url")),
      emailVerifiedAt: new Date(),
    },
  });
  return created.id;
}

async function seedIntakes(db: Db): Promise<Map<string, string>> {
  const byCourseYear = new Map<string, string>();
  const courses = await db.course.findMany({ select: { id: true, code: true } });
  const courseByCode = new Map(courses.map((c) => [c.code, c.id]));

  for (const seed of INTAKE_SEEDS) {
    const courseId = courseByCode.get(seed.courseCode);
    if (!courseId) continue; // course not seeded (e.g. trimmed fixture DB)
    const intake = await db.intake.upsert({
      where: { courseId_year: { courseId, year: seed.year } },
      create: {
        courseId,
        year: seed.year,
        sessionBn: seed.sessionBn,
        sessionEn: seed.sessionEn,
        opensAt: seed.opensAt,
        closesAt: seed.closesAt,
        examDate: seed.examDate,
        seatsTotal: seed.seatsTotal,
        isPublished: seed.isPublished,
        status: seed.status,
      },
      update: {
        sessionBn: seed.sessionBn,
        sessionEn: seed.sessionEn,
        opensAt: seed.opensAt,
        closesAt: seed.closesAt,
        examDate: seed.examDate,
        seatsTotal: seed.seatsTotal,
        isPublished: seed.isPublished,
        status: seed.status,
      },
    });
    byCourseYear.set(`${seed.courseCode}-${seed.year}`, intake.id);
  }
  return byCourseYear;
}

async function seedApplications(db: Db, intakeIds: Map<string, string>, applicantUserId: string | null): Promise<number> {
  let created = 0;
  for (const seed of APPLICATION_SEEDS) {
    const intakeId = intakeIds.get(`${seed.courseCode}-${seed.year}`);
    if (!intakeId) continue;
    const existing = await db.application.findUnique({ where: { trackingNo: seed.trackingNo } });
    if (existing) continue; // office may have reviewed it — never reset
    const claimed = seed.claimedByEmail
      ? ((await db.user.findUnique({ where: { email: seed.claimedByEmail } }))?.id ?? null)
      : null;

    await db.$transaction(async (tx: Tx) => {
      const application = await tx.application.create({
        data: {
          trackingNo: seed.trackingNo,
          intakeId,
          userId: claimed ?? applicantUserId ?? null,
          fullNameBn: seed.fullNameBn,
          fullNameEn: seed.fullNameEn,
          fatherName: seed.fatherName,
          motherName: seed.motherName,
          birthDate: seed.birthDate,
          gender: seed.gender,
          phone: seed.phone,
          email: seed.email,
          presentAddress: seed.presentAddress,
          permanentAddress: seed.presentAddress,
          guardianName: seed.guardianName,
          guardianPhone: seed.guardianPhone,
          guardianRelation: seed.guardianRelation,
          declarationAccepted: true,
          status: seed.status,
          submittedAt: seed.submittedAt,
        },
      });
      for (let i = 0; i < seed.education.length; i++) {
        const row = seed.education[i];
        await tx.applicationEducation.create({
          data: { applicationId: application.id, ...row, sortOrder: i },
        });
      }
      for (const event of seed.events) {
        await tx.applicationEvent.create({
          data: {
            applicationId: application.id,
            status: event.status,
            note: event.note,
            // the applicant's own submission, then office-side review steps
            actorId: event.status === "SUBMITTED" ? (claimed ?? applicantUserId) : null,
          },
        });
      }
    });
    created++;
  }
  return created;
}

export async function seedAdmissions(db: Db): Promise<void> {
  const applicantUserId = await ensureApplicantDemo(db);
  const intakeIds = await seedIntakes(db);
  const created = await seedApplications(db, intakeIds, applicantUserId);
  const totalApplications = await db.application.count();
  console.log(
    `  ✓ admissions day-one: ${intakeIds.size} intakes (PYS+ATT open), ${created} new applications (total ${totalApplications}), applicant demo linked`,
  );
}

export { APPLICANT_DEMO_EMAIL };
