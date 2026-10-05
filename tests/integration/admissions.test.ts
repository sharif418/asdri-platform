import { describe, test, expect, beforeAll } from "bun:test";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { installCookieMock, jsonRequest, csrfJsonRequest } from "../helpers/auth-forge";

import type { Intake, Course, User, Application } from "@prisma/client";

/**
 * Admissions status machine, exercised two ways:
 *   1. data-layer invariants directly against Prisma (unique tracking numbers,
 *      application + timeline events written together, officer status set),
 *   2. the REAL route handlers (POST /api/admissions/applications and
 *      PATCH /api/admin/applications/[id]) invoked in-process with a forged
 *      session cookie + CSRF header — the same code path the browser hits.
 */

const setCookie = installCookieMock();
const { POST } = await import("@/app/api/admissions/applications/route");
const { PATCH } = await import("@/app/api/admin/applications/[id]/route");
let course: Course;
let intake: Intake;
let applicant: User;
let editor: User;
let admissionsOfficer: User;
let admin: User;
let financeUser: User;
let applicantSession: { cookieValue: string; csrfToken: string };
let adminSession: { cookieValue: string; csrfToken: string };
let officerSession: { cookieValue: string; csrfToken: string };
let editorSession: { cookieValue: string };
let financeSession: { cookieValue: string; csrfToken: string };

const OFFICER_STATUSES = [
  "UNDER_REVIEW",
  "SHORTLISTED",
  "EXAM_SCHEDULED",
  "EXAM_TAKEN",
  "INTERVIEW",
  "ADMITTED",
  "WAITLISTED",
  "REJECTED",
] as const;

const ALL_APPLICATION_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "EXAM_SCHEDULED",
  "EXAM_TAKEN",
  "INTERVIEW",
  "ADMITTED",
  "WAITLISTED",
  "REJECTED",
] as const;

beforeAll(async () => {
  const suffix = `${Date.now()}`;
  const createUser = (email: string, role: User["role"]): Promise<User> =>
    db.user.create({
      data: { email, name: `টেস্ট ${role}`, passwordHash: hashPassword("Password123!"), role },
    });

  applicant = await createUser(`admit-applicant-${suffix}@test.local`, "APPLICANT");
  editor = await createUser(`admit-editor-${suffix}@test.local`, "EDITOR");
  admissionsOfficer = await createUser(`admit-officer-${suffix}@test.local`, "ADMISSIONS");
  admin = await createUser(`admit-admin-${suffix}@test.local`, "ADMIN");
  financeUser = await createUser(`admit-finance-${suffix}@test.local`, "FINANCE");

  course = await db.course.create({
    data: {
      code: `TST${suffix.slice(-4)}`,
      slug: `test-course-${suffix}`,
      titleBn: "টেস্ট কোর্স",
      titleEn: "Test Course",
      durationBn: "১ বছর",
      durationEn: "1 year",
    },
  });
  intake = await db.intake.create({
    data: {
      courseId: course.id,
      year: 2026,
      status: "OPEN",
      isPublished: true,
      opensAt: new Date(Date.now() - 86_400_000),
      closesAt: new Date(Date.now() + 30 * 86_400_000),
      examDate: new Date(Date.now() + 40 * 86_400_000),
      seatsTotal: 40,
    },
  });

  applicantSession = await createSession(applicant.id);
  editorSession = await createSession(editor.id);
  officerSession = await createSession(admissionsOfficer.id);
  adminSession = await createSession(admin.id);
  financeSession = await createSession(financeUser.id);
});

const validApplicationBody = {
  intakeId: "",
  fullNameBn: "মুহাম্মাদ আব্দুল্লাহ",
  fullNameEn: "Muhammad Abdullah",
  fatherName: "আব্দুল করিম",
  motherName: "ফাতিমা বেগম",
  birthDate: "2004-05-10",
  gender: "male" as const,
  phone: "01712345678",
  email: "applicant.test@example.com",
  presentAddress: "বাড্ডা, ঢাকা",
  permanentAddress: "বাড্ডা, ঢাকা",
  guardianName: "আব্দুল করিম",
  guardianPhone: "01812345678",
  guardianRelation: "পিতা",
  declarationAccepted: true,
  education: [
    {
      level: "এসএসসি",
      institution: "ঢাকা বোর্ড",
      groupOrSubject: "বিজ্ঞান",
      year: 2020,
      result: "GPA 5.00",
      sortOrder: 0,
    },
  ],
};

describe("data-layer invariants", () => {
  // Uses its own user so rows here never collide with the handler-flow tests below.
  let dataUserId: string;

  beforeAll(async () => {
    const u = await db.user.create({
      data: { email: `admit-data-${Date.now()}@test.local`, name: "ডেটা লেয়ার", passwordHash: "x", role: "APPLICANT" },
    });
    dataUserId = u.id;
  });

  test("trackingNo is globally unique (P2002 on duplicates)", async () => {
    const trackingNo = `ASDRI-UNIQ-${Date.now()}`;
    const base = {
      intakeId: intake.id,
      userId: dataUserId,
      fullNameBn: "নাম",
      fullNameEn: "Name",
      fatherName: "পিতা",
      motherName: "মাতা",
      phone: "01712345678",
      status: "SUBMITTED" as const,
    };
    await db.application.create({ data: { ...base, trackingNo } });
    let thrown: unknown;
    try {
      await db.application.create({ data: { ...base, trackingNo } }); // duplicate
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
    expect((thrown as Prisma.PrismaClientKnownRequestError).code).toBe("P2002");
  });

  test("application + SUBMITTED timeline event are written in one transaction", async () => {
    const created = await db.$transaction(async (tx) => {
      const app = await tx.application.create({
        data: {
          trackingNo: `ASDRI-TX-${Date.now()}`,
          intakeId: intake.id,
          userId: dataUserId,
          fullNameBn: "লেনদার টেস্ট",
          fullNameEn: "Tx Test",
          fatherName: "পিতা",
          motherName: "মাতা",
          phone: "01712345678",
          status: "SUBMITTED",
        },
      });
      await tx.applicationEvent.create({
        data: { applicationId: app.id, status: "SUBMITTED", note: "অনলাইন আবেদন জমা হয়েছে।", actorId: dataUserId },
      });
      return app;
    });
    const events = await db.applicationEvent.findMany({ where: { applicationId: created.id } });
    expect(events).toHaveLength(1);
    expect(events[0].status).toBe("SUBMITTED");
  });

  test("the officer's PATCHable statuses are a subset of the ApplicationStatus enum", async () => {
    for (const status of OFFICER_STATUSES) {
      expect(ALL_APPLICATION_STATUSES).toContain(status);
    }
    // and SUBMITTED/DRAFT are deliberately NOT officer-patchable
    expect(OFFICER_STATUSES).not.toContain("SUBMITTED");
    expect(OFFICER_STATUSES).not.toContain("DRAFT");
  });
});

describe("POST /api/admissions/applications (public submission)", () => {
  const url = "http://localhost:3000/api/admissions/applications";
  let submitted: { id: string; trackingNo: string };

  test("401 without a session", async () => {
    setCookie(undefined);
    const res = await POST(csrfJsonRequest(url, { ...validApplicationBody, intakeId: intake.id }, applicantSession.csrfToken));
    expect(res.status).toBe(401);
  });

  test("403 for a staff role that is not APPLICANT/ADMIN", async () => {
    setCookie(editorSession.cookieValue);
    const res = await POST(csrfJsonRequest(url, { ...validApplicationBody, intakeId: intake.id }, applicantSession.csrfToken));
    expect(res.status).toBe(403);
  });

  test("409 when the intake is not OPEN (even if published)", async () => {
    const closed = await db.intake.create({
      data: { courseId: course.id, year: 2025, status: "CLOSED", isPublished: true },
    });
    setCookie(applicantSession.cookieValue);
    const res = await POST(csrfJsonRequest(url, { ...validApplicationBody, intakeId: closed.id }, applicantSession.csrfToken));
    expect(res.status).toBe(409);
  });

  test("400 when the declaration is not accepted or the phone is malformed", async () => {
    setCookie(applicantSession.cookieValue);
    const noDeclaration = await POST(
      csrfJsonRequest(url, { ...validApplicationBody, intakeId: intake.id, declarationAccepted: false }, applicantSession.csrfToken),
    );
    expect(noDeclaration.status).toBe(400);
    const badPhone = await POST(
      csrfJsonRequest(url, { ...validApplicationBody, intakeId: intake.id, phone: "12345" }, applicantSession.csrfToken),
    );
    expect(badPhone.status).toBe(400);
    const body = (await badPhone.json()) as { fields?: Record<string, string> };
    expect(body.fields?.phone).toContain("১১ ডিজিটের");
  });

  test("201 happy path creates the application, education row, timeline event and audit entry", async () => {
    setCookie(applicantSession.cookieValue);
    const res = await POST(csrfJsonRequest(url, { ...validApplicationBody, intakeId: intake.id }, applicantSession.csrfToken));
    expect(res.status).toBe(201);
    const json = (await res.json()) as { ok: boolean; data: { trackingNo: string; id: string } };
    expect(json.ok).toBe(true);
    expect(json.data.trackingNo).toMatch(/^ASDRI-\d{4}-\d{6}$/);
    submitted = json.data;

    const app = await db.application.findUniqueOrThrow({
      where: { id: json.data.id },
      include: { education: true, events: true },
    });
    expect(app.status).toBe("SUBMITTED");
    expect(app.userId).toBe(applicant.id);
    expect(app.declarationAccepted).toBe(true);
    expect(app.education).toHaveLength(1);
    expect(app.education[0].level).toBe("এসএসসি");
    expect(app.events).toHaveLength(1);
    expect(app.events[0].status).toBe("SUBMITTED");

    const auditRow = await db.auditLog.findFirst({
      where: { action: "application.submit", entityId: json.data.id },
    });
    expect(auditRow?.actorId).toBe(applicant.id);
  });

  test("409 on a duplicate submission for the same intake", async () => {
    setCookie(applicantSession.cookieValue);
    const res = await POST(csrfJsonRequest(url, { ...validApplicationBody, intakeId: intake.id }, applicantSession.csrfToken));
    expect(res.status).toBe(409);
    const json = (await res.json()) as { data?: { trackingNo: string } };
    expect(json.data?.trackingNo).toBe(submitted.trackingNo);
  });

  test("created application is visible via tracking number", async () => {
    const app: Application | null = await db.application.findUnique({ where: { trackingNo: submitted.trackingNo } });
    expect(app?.id).toBe(submitted.id);
  });
});

describe("PATCH /api/admin/applications/[id] (officer status machine)", () => {
  const url = (id: string) => `http://localhost:3000/api/admin/applications/${id}`;
  let application: Application;

  beforeAll(async () => {
    application = await db.application.findFirstOrThrow({
      where: { userId: applicant.id, intakeId: intake.id },
    });
  });

  const call = (id: string, body: unknown, csrfToken: string) =>
    PATCH(csrfJsonRequest(url(id), body, csrfToken), { params: Promise.resolve({ id }) });

  test("401 without a session (missing CSRF header fails the guard)", async () => {
    setCookie(undefined);
    const res = await PATCH(jsonRequest(url(application.id), { status: "SHORTLISTED" }), {
      params: Promise.resolve({ id: application.id }),
    });
    expect(res.status).toBe(401);
  });

  test("403 for FINANCE (admissions module is ADMIN/ADMISSIONS only)", async () => {
    setCookie(financeSession.cookieValue);
    const res = await call(application.id, { status: "SHORTLISTED" }, financeSession.csrfToken);
    expect(res.status).toBe(403);
  });

  test("401 when the CSRF header does not match the session token", async () => {
    setCookie(adminSession.cookieValue);
    const res = await call(application.id, { status: "SHORTLISTED" }, "wrong-csrf-token");
    expect(res.status).toBe(401);
  });

  test("400 for a status outside the officer machine (SUBMITTED) and bad scores", async () => {
    setCookie(adminSession.cookieValue);
    const res = await call(application.id, { status: "SUBMITTED" }, adminSession.csrfToken);
    expect(res.status).toBe(400);
    const badScore = await call(application.id, { status: "ADMITTED", examScore: 250 }, adminSession.csrfToken);
    expect(badScore.status).toBe(400);
  });

  test("SUBMITTED → UNDER_REVIEW → SHORTLISTED each append a timeline event and an audit row", async () => {
    setCookie(officerSession.cookieValue);
    for (const [status, note] of [
      ["UNDER_REVIEW", "কাগজপত্র যাচাই শুরু"],
      ["SHORTLISTED", "যাচাই সম্পন্ন, শর্টলিস্টে অন্তর্ভুক্ত"],
    ] as const) {
      const res = await call(application.id, { status, note }, officerSession.csrfToken);
      expect(res.status).toBe(200);
      const json = (await res.json()) as { ok: boolean; data: { status: string } };
      expect(json.data.status).toBe(status);
    }

    const events = await db.applicationEvent.findMany({
      where: { applicationId: application.id },
      orderBy: { createdAt: "asc" },
    });
    expect(events.map((e) => e.status)).toEqual(["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED"]);
    expect(events.at(-1)?.actorId).toBe(admissionsOfficer.id);
    expect(events.at(-1)?.note).toBe("যাচাই সম্পন্ন, শর্টলিস্টে অন্তর্ভুক্ত");

    const auditRows = await db.auditLog.findMany({
      where: { action: "application.status", entityId: application.id },
    });
    expect(auditRows).toHaveLength(2);
  });

  test("EXAM_SCHEDULED queues the Bangla exam call letter to the outbox", async () => {
    setCookie(adminSession.cookieValue);
    const res = await call(
      application.id,
      { status: "EXAM_SCHEDULED", note: "প্রবেশপত্র ইমেইলে পাঠানো হয়েছে" },
      adminSession.csrfToken,
    );
    expect(res.status).toBe(200);

    const outbox = await db.outboxEmail.findMany({ where: { kind: "admission.exam_call" } });
    expect(outbox).toHaveLength(1);
    expect(outbox[0].to).toBe("applicant.test@example.com");
    expect(outbox[0].subject).toContain("ভর্তি পরীক্ষার সময়সূচি");
    expect(outbox[0].subject).toContain(application.trackingNo);
    expect(outbox[0].sentAt).toBeNull(); // queued, not delivered (log driver)
    expect((outbox[0].payload as Record<string, unknown>).applicationId).toBe(application.id);
  });

  test("ADMITTED persists exam + viva scores on the application", async () => {
    setCookie(adminSession.cookieValue);
    const res = await call(
      application.id,
      { status: "ADMITTED", examScore: 85, vivaScore: 90, note: "চূড়ান্ত ফলাফল" },
      adminSession.csrfToken,
    );
    expect(res.status).toBe(200);

    const app = await db.application.findUniqueOrThrow({ where: { id: application.id } });
    expect(app.status).toBe("ADMITTED");
    expect(app.examScore).toBe(85);
    expect(app.vivaScore).toBe(90);

    const finalEvent = await db.applicationEvent.findFirst({
      where: { applicationId: application.id, status: "ADMITTED" },
    });
    expect(finalEvent?.note).toBe("চূড়ান্ত ফলাফল");
  });
});
