import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { installCookieMock, jsonRequest, csrfJsonRequest } from "../helpers/auth-forge";

import type { Course, Intake, User } from "@prisma/client";

/**
 * Round 5 — exam-schedule persistence per intake.
 *
 * The officer used to re-type সময়/স্থান into every exam-call letter print;
 * now they live on the intake (examTimeBn / examVenueBn), prefill every
 * letter, and surface on the applicant's status lookup. Pins:
 *   • the intake PATCH accepts, trims and persists both fields (ADMISSIONS),
 *   • the length caps answer 400 with the Bangla field message,
 *   • non-admissions roles stay 403,
 *   • the public status lookup carries the schedule to the applicant with
 *     the right second factor — and never leaks it otherwise.
 */

const setCookie = installCookieMock();
const { PATCH: INTAKE_PATCH } = await import("@/app/api/admin/intakes/[id]/route");
const { POST: APP_LOOKUP } = await import("@/app/api/admissions/status-lookup/route");
process.env.SESSION_SECRET ??= "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2";

let course: Course;
let intake: Intake;
let officer: User;
let editor: User;
let application: { id: string; trackingNo: string; phone: string };
let officerSession: { cookieValue: string; csrfToken: string };
let editorSession: { cookieValue: string; csrfToken: string };

const lookupUrl = "http://localhost:3000/api/admissions/status-lookup";

beforeAll(async () => {
  const suffix = `${Date.now()}`;
  const createUser = (email: string, role: User["role"]): Promise<User> =>
    db.user.create({ data: { email, name: `টেস্ট ${role}`, passwordHash: hashPassword("Password123!"), role } });

  officer = await createUser(`exam-officer-${suffix}@test.local`, "ADMISSIONS");
  editor = await createUser(`exam-editor-${suffix}@test.local`, "EDITOR");

  course = await db.course.create({
    data: {
      code: `EXM${suffix.slice(-4)}`,
      slug: `exam-course-${suffix}`,
      titleBn: "পরীক্ষা কোর্স",
      titleEn: "Exam Course",
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
      examDate: new Date("2026-02-25T00:00:00Z"),
      seatsTotal: 40,
    },
  });
  const row = await db.application.create({
    data: {
      trackingNo: `ASDRI-2026-77${suffix.slice(-4)}`,
      intakeId: intake.id,
      fullNameBn: "পরীক্ষার্থী",
      fullNameEn: "Examinee",
      fatherName: "পিতা",
      motherName: "মাতা",
      phone: "01712345699",
      status: "EXAM_SCHEDULED",
      declarationAccepted: true,
    },
  });
  application = { id: row.id, trackingNo: row.trackingNo, phone: row.phone };

  officerSession = await createSession(officer.id);
  editorSession = await createSession(editor.id);
});

afterAll(async () => {
  await db.applicationEvent.deleteMany({ where: { applicationId: application.id } });
  await db.application.deleteMany({ where: { id: application.id } });
  await db.intake.deleteMany({ where: { id: intake.id } });
  await db.course.deleteMany({ where: { id: course.id } });
  await db.session.deleteMany({ where: { userId: { in: [officer.id, editor.id] } } });
  await db.user.deleteMany({ where: { id: { in: [officer.id, editor.id] } } });
});

function patchIntake(body: unknown): Promise<Response> {
  setCookie(officerSession.cookieValue);
  return INTAKE_PATCH(
    csrfJsonRequest(`http://localhost:3000/api/admin/intakes/${intake.id}`, body, officerSession.csrfToken),
    { params: Promise.resolve({ id: intake.id }) },
  );
}

describe("PATCH /api/admin/intakes/[id] — exam schedule", () => {
  test("admissions officer persists time + venue (trimmed)", async () => {
    const res = await patchIntake({ examTimeBn: "  সকাল ১০:০০  ", examVenueBn: " মূল ক্যাম্পাস, কক্ষ ২০১ " });
    expect(res.status).toBe(200);
    const row = await db.intake.findUnique({ where: { id: intake.id } });
    expect(row?.examTimeBn).toBe("সকাল ১০:০০");
    expect(row?.examVenueBn).toBe("মূল ক্যাম্পাস, কক্ষ ২০১");
  });

  test("empty strings clear the schedule", async () => {
    const res = await patchIntake({ examTimeBn: "", examVenueBn: "" });
    expect(res.status).toBe(200);
    const row = await db.intake.findUnique({ where: { id: intake.id } });
    expect(row?.examTimeBn).toBe("");
    expect(row?.examVenueBn).toBe("");
  });

  test("over-length values answer 400 with the field message", async () => {
    const res = await patchIntake({ examTimeBn: "ক".repeat(61) });
    expect(res.status).toBe(400);
    const json = (await res.json()) as { ok: boolean; error?: string };
    expect(json.ok).toBe(false);
    expect(json.error).toBe("যাচাই করুন।");
  });

  test("editor role stays 403", async () => {
    setCookie(editorSession.cookieValue);
    const res = await INTAKE_PATCH(
      csrfJsonRequest(`http://localhost:3000/api/admin/intakes/${intake.id}`, { examTimeBn: "সকাল ৯টা" }, editorSession.csrfToken),
      { params: Promise.resolve({ id: intake.id }) },
    );
    expect(res.status).toBe(403);
    const row = await db.intake.findUnique({ where: { id: intake.id } });
    expect(row?.examTimeBn).toBe("");
  });
});

describe("POST /api/admissions/status-lookup — exam schedule surfaced", () => {
  beforeAll(async () => {
    // set the schedule once for the lookup assertions
    await patchIntake({ examTimeBn: "সকাল ১০:০০", examVenueBn: "মূল ক্যাম্পাস, কক্ষ ২০১" });
  });

  function lookup(body: unknown, ip: string): Promise<Response> {
    return APP_LOOKUP(
      jsonRequest(lookupUrl, body, { "x-forwarded-for": ip }) as Parameters<typeof APP_LOOKUP>[0],
    );
  }

  test("right trackingNo + phone returns the persisted schedule", async () => {
    const res = await lookup({ trackingNo: application.trackingNo, phone: application.phone, lang: "bn" }, "10.77.0.1");
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      data: { exam: { date: string | null; timeBn: string; venueBn: string } };
    };
    expect(json.data.exam.date).toBe("2026-02-25T00:00:00.000Z");
    expect(json.data.exam.timeBn).toBe("সকাল ১০:০০");
    expect(json.data.exam.venueBn).toBe("মূল ক্যাম্পাস, কক্ষ ২০১");
  });

  test("wrong second factor never reveals the schedule", async () => {
    const res = await lookup({ trackingNo: application.trackingNo, phone: "01700000000", lang: "bn" }, "10.77.0.2");
    expect(res.status).toBe(404);
    const text = await res.text();
    expect(text).not.toContain("সকাল ১০:০০");
    expect(text).not.toContain("মূল ক্যাম্পাস");
  });
});
