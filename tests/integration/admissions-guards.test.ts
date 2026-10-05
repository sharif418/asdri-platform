import { describe, test, expect, beforeAll } from "bun:test";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { installCookieMock } from "../helpers/auth-forge";

/**
 * Round-3 CSRF/origin/rate-limit guards on the applicant's own mutating
 * routes — the ones that carry national-ID scans:
 *   • POST /api/admissions/documents (upload)
 *   • POST /api/admissions/applications (submit)
 * plus the photo-ownership check that was missing.
 */

process.env.SESSION_SECRET ??= "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2";

const setCookie = installCookieMock();
const { POST: SUBMIT } = await import("@/app/api/admissions/applications/route");
const { POST: UPLOAD } = await import("@/app/api/admissions/documents/route");
const { createSession } = await import("@/lib/auth");

const IP = { "x-forwarded-for": "10.9.0.13" };
const submitUrl = "http://localhost:3000/api/admissions/applications";
const uploadUrl = "http://localhost:3000/api/admissions/documents";

function jsonRequest(url: string, body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...IP, ...headers },
    body: JSON.stringify(body),
  });
}

/** multipart request for the upload route — a REAL 1×1 PNG (sharp must decode it). */
const REAL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function formRequest(csrf: string | null): NextRequest {
  const form = new FormData();
  form.append("kind", "IMAGE");
  form.append("file", new File([new Uint8Array(REAL_PNG)], "photo.png", { type: "image/png" }));
  const headers: Record<string, string> = { ...IP };
  if (csrf) headers["x-csrf-token"] = csrf;
  return new NextRequest(uploadUrl, { method: "POST", headers, body: form });
}

let applicantSession: { cookieValue: string; csrfToken: string };
let courseId: string;
let intakeId: string;

beforeAll(async () => {
  const applicant = await db.user.create({
    data: {
      email: `guard-${Date.now()}@test.local`,
      name: "আবেদনকারী",
      passwordHash: hashPassword("Password123!"),
      role: "APPLICANT",
    },
  });
  applicantSession = await createSession(applicant.id);

  const course = await db.course.create({
    data: { code: `GRD-${Date.now()}`, titleBn: "কোর্স", titleEn: "Course", slug: `guard-${Date.now()}` },
  });
  courseId = course.id;
  const intake = await db.intake.create({
    data: {
      courseId,
      year: 2026,
      status: "OPEN",
      isPublished: true,
      opensAt: new Date(Date.now() - 86_400_000),
      closesAt: new Date(Date.now() + 30 * 86_400_000),
      seatsTotal: 30,
    },
  });
  intakeId = intake.id;
});

const validBody = (extra: Record<string, unknown> = {}) => ({
  intakeId,
  fullNameBn: "মুহাম্মাদ আব্দুল্লাহ",
  fatherName: "আব্দুল করিম",
  motherName: "ফাতিমা বেগম",
  phone: "01712345678",
  gender: "male" as const,
  declarationAccepted: true,
  education: [{ level: "এসএসসি", institution: "বোর্ড", sortOrder: 0 }],
  ...extra,
});

describe("POST /api/admissions/applications (CSRF + origin guards)", () => {
  test("403 without the CSRF header (session alone is no longer enough)", async () => {
    setCookie(applicantSession.cookieValue);
    const res = await SUBMIT(jsonRequest(submitUrl, validBody()));
    expect(res.status).toBe(403);
  });

  test("403 when the CSRF header does not match the session token", async () => {
    setCookie(applicantSession.cookieValue);
    const res = await SUBMIT(jsonRequest(submitUrl, validBody(), { "x-csrf-token": "wrong-token" }));
    expect(res.status).toBe(403);
  });

  test("403 from a cross-origin POST even with a correct CSRF token", async () => {
    setCookie(applicantSession.cookieValue);
    const res = await SUBMIT(
      jsonRequest(submitUrl, validBody(), {
        "x-csrf-token": applicantSession.csrfToken,
        origin: "https://evil.example",
      }),
    );
    expect(res.status).toBe(403);
  });

  test("photo ownership: a photo uploaded by ANOTHER user is rejected", async () => {
    const stranger = await db.user.create({
      data: {
        email: `photo-other-${Date.now()}@test.local`,
        name: "অন্যজন",
        passwordHash: hashPassword("Password123!"),
        role: "APPLICANT",
      },
    });
    const media = await db.media.create({
      data: {
        key: `2026/10/foreign-${Date.now()}.png`,
        filename: "foreign.png",
        mime: "image/png",
        size: 100,
        kind: "IMAGE",
        visibility: "PRIVATE",
        uploadedById: stranger.id,
      },
    });
    setCookie(applicantSession.cookieValue);
    const res = await SUBMIT(
      jsonRequest(submitUrl, validBody({ photoMediaId: media.id }), {
        "x-csrf-token": applicantSession.csrfToken,
      }),
    );
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error?: string };
    expect(json.error).toContain("ছবিটি");
  });

  test("201 with the correct CSRF header + same-origin (the browser path)", async () => {
    setCookie(applicantSession.cookieValue);
    const res = await SUBMIT(
      jsonRequest(submitUrl, validBody(), { "x-csrf-token": applicantSession.csrfToken }),
    );
    expect(res.status).toBe(201);
    const json = (await res.json()) as { data?: { trackingNo: string } };
    expect(json.data?.trackingNo).toMatch(/^ASDRI-\d{4}-\d{6}$/);
  });
});

describe("POST /api/admissions/documents (CSRF + private visibility)", () => {
  test("403 without the CSRF header", async () => {
    setCookie(applicantSession.cookieValue);
    const res = await UPLOAD(formRequest(null));
    expect(res.status).toBe(403);
  });

  test("201 with the header, and the Media row is stored PRIVATE", async () => {
    setCookie(applicantSession.cookieValue);
    const res = await UPLOAD(formRequest(applicantSession.csrfToken));
    expect(res.status).toBe(201);
    const json = (await res.json()) as { data?: { mediaId: string } };
    expect(json.data?.mediaId).toBeTruthy();

    const media = await db.media.findUniqueOrThrow({ where: { id: json.data!.mediaId } });
    expect(media.visibility).toBe("PRIVATE");
  });
});
