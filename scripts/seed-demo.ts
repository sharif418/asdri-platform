/**
 * Demo data seeder — fills the empty QA admin tables (finance/donations,
 * admissions/applications) through the REAL HTTP APIs, so every row carries
 * the same payment trail, outbox receipt, timeline event and audit log a
 * live flow produces. No ORM shortcuts on the money path.
 *
 *   DATABASE_URL=postgresql://z@127.0.0.1:5433/asdri bun scripts/seed-demo.ts
 *   (or: bun run db:seed:demo)
 *
 * Prerequisites: the dev server must be up (BASE_URL, default
 * http://localhost:3000) and the base content seed (bun scripts/seed.ts)
 * must have run once — funds, campaigns and courses come from it.
 *
 * Idempotent: donations are keyed by donor email, applications by applicant
 * email + intake, the demo intake by (courseId, year). Re-runs skip what
 * already exists and never duplicate.
 */
import { createHmac } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/auth";
import { env } from "@/lib/env";

const BASE_URL = process.env.SEED_BASE_URL ?? "http://localhost:3000";
const DEMO_INTAKE_YEAR = 2026;
const DEMO_COURSE_SLUG = "certificate-course-in-islamic-studies";
const OFFICER_EMAIL = "admissions-officer.demo@example.com";
const OFFICER_PASSWORD = "Demo#Officer2026";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set (bun loads .env automatically, or pass it inline).");
}
const db = new PrismaClient();

/* ————————— tiny HTTP client with a cookie jar ————————— */

class CookieJar {
  private readonly jar = new Map<string, string>();

  capture(res: Response): void {
    const raw =
      typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [res.headers.get("set-cookie") ?? ""];
    for (const cookie of raw) {
      const [pair] = cookie.split(";");
      const eq = pair.indexOf("=");
      if (eq > 0) this.jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  }

  header(): string {
    return [...this.jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  get(name: string): string | undefined {
    return this.jar.get(name);
  }
}

async function api(
  path: string,
  method: "POST" | "PATCH",
  body: unknown,
  jar?: CookieJar,
  extraHeaders: Record<string, string> = {},
): Promise<Response> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(jar && jar.header() ? { cookie: jar.header() } : {}),
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
  jar?.capture(res);
  return res;
}

async function expectOk(res: Response, what: string): Promise<Record<string, unknown>> {
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(`${what} failed: HTTP ${res.status} ${JSON.stringify(json).slice(0, 300)}`);
  }
  return json;
}

/* ————————— donations: real intent API + signed sandbox callback ————————— */

interface DemoDonation {
  fundType: string;
  campaignSlug: string | null;
  amount: number;
  donorName: string;
  email: string;
  phone: string;
  message: string;
  anonymous: boolean;
  complete: boolean; // true → signed COMPLETED callback, false → stays PENDING
}

const DEMO_DONATIONS: DemoDonation[] = [
  {
    fundType: "general",
    campaignSlug: null,
    amount: 1500,
    donorName: "মুহাম্মাদ রফিকুল ইসলাম",
    email: "rafiqul.islam.demo@example.com",
    phone: "01712345678",
    message: "সাধারণ ফান্ডে সদকা হিসেবে দিলাম।",
    anonymous: false,
    complete: true,
  },
  {
    fundType: "zakat",
    campaignSlug: "winter-clothing-students",
    amount: 5000,
    donorName: "আয়েশা বেগম",
    email: "ayesha.begum.demo@example.com",
    phone: "01812345678",
    message: "যাকাত — আবাসিক শিক্ষার্থীদের শীতবস্ত্রের জন্য।",
    anonymous: true,
    complete: true,
  },
  {
    fundType: "general",
    campaignSlug: "library-1000-books",
    amount: 1200,
    donorName: "আব্দুল্লাহ আল মামুন",
    email: "abdullah.mamun.demo@example.com",
    phone: "01912345679",
    message: "লাইব্রেরির নতুন বই কেনার জন্য।",
    anonymous: false,
    complete: true,
  },
  {
    fundType: "scholarship",
    campaignSlug: null,
    amount: 500,
    donorName: "হাফেজ ইমরান হোসেন",
    email: "imran.hossain.demo@example.com",
    phone: "01612345676",
    message: "গরিব মেধাবী শিক্ষার্থীর বৃত্তির জন্য।",
    anonymous: false,
    complete: false,
  },
];

function callbackSignature(trackingCode: string, status: "COMPLETED", providerTxnId: string): string {
  return createHmac("sha256", env.paymentCallbackSecret)
    .update(`${trackingCode}|${status}|${providerTxnId}`)
    .digest("hex");
}

async function seedDonations(): Promise<void> {
  for (const demo of DEMO_DONATIONS) {
    const existing = await db.donation.findFirst({ where: { donorEmail: demo.email } });
    if (existing) {
      console.log(`↷ donation ${demo.email} already exists (${existing.status}) — skipped`);
      continue;
    }

    const intent = await expectOk(
      await api("/api/donations", "POST", {
        fundType: demo.fundType,
        ...(demo.campaignSlug ? { campaignSlug: demo.campaignSlug } : {}),
        amount: demo.amount,
        currency: "BDT",
        donorName: demo.donorName,
        email: demo.email,
        phone: demo.phone,
        anonymous: demo.anonymous,
        recurring: false,
        message: demo.message,
      }),
      `donation intent (${demo.email})`,
    );
    const trackingCode = (intent.data as { trackingCode: string }).trackingCode;
    console.log(`+ donation intent ${trackingCode} — ৳${demo.amount} ${demo.fundType}${demo.anonymous ? " (anonymous)" : ""}`);

    if (!demo.complete) {
      console.log(`  … left PENDING for QA (no callback sent)`);
      continue;
    }

    const providerTxnId = `DEMO-TXN-${trackingCode.slice(-6)}`;
    await expectOk(
      await api("/api/donations/callback", "POST", {
        trackingCode,
        status: "COMPLETED",
        providerTxnId,
        signature: callbackSignature(trackingCode, "COMPLETED", providerTxnId),
      }),
      `sandbox callback (${trackingCode})`,
    );
    const row = await db.donation.findUniqueOrThrow({ where: { trackingCode } });
    if (row.status !== "COMPLETED") throw new Error(`donation ${trackingCode} did not complete`);
    console.log(`  ✓ COMPLETED via signed sandbox callback (receipt emailed to outbox)`);
  }
}

/* ————————— admissions: demo intake + real public application API ————————— */

interface DemoApplicant {
  email: string;
  password: string;
  accountName: string;
  targetStatus: "SUBMITTED" | "UNDER_REVIEW";
  body: Record<string, unknown>;
}

const DEMO_APPLICANTS: DemoApplicant[] = [
  {
    email: "muhammad.abdullah.demo@example.com",
    password: "Demo#Applicant2026",
    accountName: "মুহাম্মাদ আব্দুল্লাহ",
    targetStatus: "UNDER_REVIEW",
    body: {
      fullNameBn: "মুহাম্মাদ আব্দুল্লাহ",
      fullNameEn: "Muhammad Abdullah",
      fatherName: "আব্দুল করিম",
      motherName: "ফাতিমা বেগম",
      birthDate: "2004-05-10",
      gender: "male",
      phone: "01712345679",
      email: "muhammad.abdullah.demo@example.com",
      presentAddress: "সাতারকুল, বাড্ডা, ঢাকা-১২১২",
      permanentAddress: "গ্রাম: রামপুর, উপজেলা: বেগমগঞ্জ, জেলা: নোয়াখালী",
      guardianName: "আব্দুল করিম",
      guardianPhone: "01812345679",
      guardianRelation: "পিতা",
      education: [
        {
          level: "এসএসসি",
          institution: "ঢাকা শিক্ষা বোর্ড",
          groupOrSubject: "বিজ্ঞান",
          year: 2020,
          result: "GPA 5.00",
          sortOrder: 0,
        },
        {
          level: "এইচএসসি",
          institution: "ঢাকা শিক্ষা বোর্ড",
          groupOrSubject: "বিজ্ঞান",
          year: 2022,
          result: "GPA 4.75",
          sortOrder: 1,
        },
      ],
    },
  },
  {
    email: "sumaiya.akter.demo@example.com",
    password: "Demo#Applicant2026",
    accountName: "সুমাইয়া আক্তার",
    targetStatus: "SUBMITTED",
    body: {
      fullNameBn: "সুমাইয়া আক্তার",
      fullNameEn: "Sumaiya Akter",
      fatherName: "মোঃ শফিকুল ইসলাম",
      motherName: "রহিমা খাতুন",
      birthDate: "2005-11-02",
      gender: "female",
      phone: "01912345677",
      email: "sumaiya.akter.demo@example.com",
      presentAddress: "উত্তরা সেক্টর ৭, ঢাকা-১২৩০",
      permanentAddress: "গ্রাম: কালিগঞ্জ, জেলা: গাজীপুর",
      guardianName: "মোঃ শফিকুল ইসলাম",
      guardianPhone: "01712345680",
      guardianRelation: "পিতা",
      education: [
        {
          level: "এসএসসি",
          institution: "ঢাকা শিক্ষা বোর্ড",
          groupOrSubject: "মানবিক",
          year: 2021,
          result: "GPA 4.83",
          sortOrder: 0,
        },
      ],
    },
  },
];

async function ensureDemoIntake(): Promise<string> {
  const course = await db.course.findUnique({ where: { slug: DEMO_COURSE_SLUG } });
  if (!course) throw new Error(`course ${DEMO_COURSE_SLUG} not found — run bun scripts/seed.ts first`);

  const now = Date.now();
  await db.intake.upsert({
    where: { courseId_year: { courseId: course.id, year: DEMO_INTAKE_YEAR } },
    create: {
      courseId: course.id,
      year: DEMO_INTAKE_YEAR,
      sessionBn: `${DEMO_INTAKE_YEAR} শিক্ষাবর্ষ`,
      sessionEn: `${DEMO_INTAKE_YEAR} academic session`,
      opensAt: new Date(now - 7 * 86_400_000),
      closesAt: new Date(now + 30 * 86_400_000),
      examDate: new Date(now + 40 * 86_400_000),
      seatsTotal: 60,
      isPublished: true,
      status: "OPEN",
    },
    update: { isPublished: true, status: "OPEN" }, // keep the demo intake open on re-runs
  });
  const intake = await db.intake.findUniqueOrThrow({
    where: { courseId_year: { courseId: course.id, year: DEMO_INTAKE_YEAR } },
  });
  console.log(`✓ demo intake OPEN — ${course.titleBn} (${DEMO_INTAKE_YEAR})`);
  return intake.id;
}

/** Register (first run) or log in (re-runs) an account via the real APIs. */
async function applicantSession(applicant: DemoApplicant): Promise<CookieJar> {
  const jar = new CookieJar();
  const registered = await api("/api/auth/register", "POST", {
    name: applicant.accountName,
    email: applicant.email,
    phone: (applicant.body as { phone: string }).phone,
    password: applicant.password,
    confirmPassword: applicant.password,
    role: "student",
  }, jar);
  if (registered.status === 201) {
    console.log(`+ applicant account ${applicant.email} registered`);
    return jar;
  }
  if (registered.status === 409) {
    await expectOk(
      await api("/api/auth/login", "POST", { email: applicant.email, password: applicant.password }, jar),
      `login (${applicant.email})`,
    );
    return jar;
  }
  throw new Error(`register (${applicant.email}) failed: HTTP ${registered.status}`);
}

async function seedApplications(intakeId: string): Promise<void> {
  for (const applicant of DEMO_APPLICANTS) {
    const user = await db.user.findUnique({ where: { email: applicant.email } });
    const existing = user
      ? await db.application.findFirst({ where: { userId: user.id, intakeId } })
      : null;
    if (existing) {
      console.log(`↷ application ${existing.trackingNo} (${applicant.email}, ${existing.status}) already exists — skipped`);
      continue;
    }

    const jar = await applicantSession(applicant);
    const created = await expectOk(
      await api("/api/admissions/applications", "POST", {
        ...applicant.body,
        intakeId,
        declarationAccepted: true,
      }, jar),
      `application submission (${applicant.email})`,
    );
    const { trackingNo } = created.data as { trackingNo: string };
    console.log(`+ application ${trackingNo} submitted — ${applicant.accountName}`);
  }
}

/* ————————— officer transition through the real admin API ————————— */

async function moveOneApplicationToUnderReview(intakeId: string): Promise<void> {
  const applicant = DEMO_APPLICANTS.find((a) => a.targetStatus === "UNDER_REVIEW");
  if (!applicant) return;
  const user = await db.user.findUnique({ where: { email: applicant.email } });
  if (!user) return;
  const app = await db.application.findFirst({ where: { userId: user.id, intakeId } });
  if (!app) return;
  if (app.status !== "SUBMITTED") {
    console.log(`↷ application ${app.trackingNo} already ${app.status} — officer step skipped`);
    return;
  }

  // ADMISSIONS officer account (scrypt-hashed here, logged in via the real
  // login API so the PATCH goes through the exact officer code path).
  await db.user.upsert({
    where: { email: OFFICER_EMAIL },
    create: {
      email: OFFICER_EMAIL,
      name: "ভর্তি অফিসার (ডেমো)",
      passwordHash: hashPassword(OFFICER_PASSWORD),
      role: "ADMISSIONS",
    },
    update: {},
  });

  const jar = new CookieJar();
  await expectOk(
    await api("/api/auth/login", "POST", { email: OFFICER_EMAIL, password: OFFICER_PASSWORD }, jar),
    "officer login",
  );
  const csrf = jar.get("asr-csrf");
  if (!csrf) throw new Error("officer login did not set the CSRF cookie");

  await expectOk(
    await api(
      `/api/admin/applications/${app.id}`,
      "PATCH",
      { status: "UNDER_REVIEW", note: "কাগজপত্র যাচাই শুরু হয়েছে (ডেমো)" },
      jar,
      { "x-csrf-token": csrf },
    ),
    "officer status transition (UNDER_REVIEW)",
  );
  console.log(`✓ application ${app.trackingNo} → UNDER_REVIEW via the officer API`);
}

/* ————————— main ————————— */

async function main(): Promise<void> {
  const health = await fetch(`${BASE_URL}/`).catch(() => null);
  if (!health || !health.ok) {
    throw new Error(`dev server not reachable at ${BASE_URL} — start it first (bun run dev)`);
  }

  await seedDonations();
  const intakeId = await ensureDemoIntake();
  await seedApplications(intakeId);
  await moveOneApplicationToUnderReview(intakeId);

  const [donations, applications, outbox] = await Promise.all([
    db.donation.groupBy({ by: ["status"], _count: { _all: true } }),
    db.application.groupBy({ by: ["status"], _count: { _all: true } }),
    db.outboxEmail.count(),
  ]);
  console.log("\n— demo data summary —");
  console.log(`donations:     ${donations.map((d) => `${d._count._all} ${d.status}`).join(", ")}`);
  console.log(`applications:  ${applications.map((a) => `${a._count._all} ${a.status}`).join(", ")}`);
  console.log(`outbox emails: ${outbox}`);
}

main()
  .catch((error) => {
    console.error(`✗ ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
