import { describe, test, expect, beforeAll } from "bun:test";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

/**
 * Public self-service lookups through the REAL handlers:
 *   • POST /api/admissions/status-lookup — tracking number + phone pair
 *   • POST /api/donations/status-lookup  — tracking/receipt code + phone|email pair
 *
 * Pins the security properties these routes exist for: codes alone are
 * sequential (enumerable), so the second factor must be enforced; every
 * not-found / wrong-factor outcome must be indistinguishable; both routes
 * are same-origin checked and rate-limited.
 */

process.env.SESSION_SECRET ??= "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2";

const { POST: APP_LOOKUP } = await import("@/app/api/admissions/status-lookup/route");
const { POST: DON_LOOKUP } = await import("@/app/api/donations/status-lookup/route");

const appUrl = "http://localhost:3000/api/admissions/status-lookup";
const donUrl = "http://localhost:3000/api/donations/status-lookup";

function jsonRequest(url: string, body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

/* ————— fixtures ————— */

const APP_PHONE = "01712345678";
let appTracking = "";
let draftTracking = "";

let donationCode = ""; // DN-…
let receiptCode = ""; // ASDRI-R-… (completed donation)
let pendingCode = ""; // DN-… (PENDING)
let silentCode = ""; // donation with neither phone nor email

beforeAll(async () => {
  const year = new Date().getFullYear();
  const rand = String(Date.now()).slice(-6);

  const course = await db.course.create({
    data: { code: `SSC-${rand}`, titleBn: "কোর্স", titleEn: "Course", slug: `ss-${rand}` },
  });
  const intake = await db.intake.create({
    data: {
      courseId: course.id,
      year,
      status: "OPEN",
      isPublished: true,
      opensAt: new Date(Date.now() - 86_400_000),
      closesAt: new Date(Date.now() + 30 * 86_400_000),
      seatsTotal: 30,
    },
  });

  const application = await db.application.create({
    data: {
      trackingNo: `ASDRI-${year}-${rand}`,
      intakeId: intake.id,
      fullNameBn: "আবেদনকারী",
      fullNameEn: "Applicant",
      fatherName: "পিতা",
      motherName: "মাতা",
      phone: APP_PHONE,
      status: "UNDER_REVIEW",
      events: {
        create: [
          { status: "SUBMITTED", note: "internal note" },
          { status: "UNDER_REVIEW", note: "officer-only remark" },
        ],
      },
    },
  });
  appTracking = application.trackingNo;

  const draft = await db.application.create({
    data: {
      trackingNo: `ASDRI-${year}-${String(Number(rand) + 1).padStart(6, "0")}`,
      intakeId: intake.id,
      fullNameBn: "খসড়া আবেদনকারী",
      fullNameEn: "Draft Applicant",
      fatherName: "পিতা",
      motherName: "মাতা",
      phone: APP_PHONE,
      status: "DRAFT",
    },
  });
  draftTracking = draft.trackingNo;

  const fund = await db.fund.create({
    data: { key: `ss-${rand}`, nameBn: "ফান্ড", nameEn: "Fund" },
  });

  const completed = await db.donation.create({
    data: {
      trackingCode: `DN-${year}-${rand}`,
      receiptNo: `ASDRI-R-${rand}`,
      fundId: fund.id,
      amount: 2500,
      donorName: "দাতা",
      donorEmail: "Donor@Example.COM",
      donorPhone: "+880 1712-345678",
      status: "COMPLETED",
      paidAt: new Date(),
    },
  });
  donationCode = completed.trackingCode;
  receiptCode = completed.receiptNo!;

  const pending = await db.donation.create({
    data: {
      trackingCode: `DN-${year}-${String(Number(rand) + 2).padStart(6, "0")}`,
      receiptNo: `ASDRI-R-${String(Number(rand) + 2).padStart(6, "0")}`,
      fundId: fund.id,
      amount: 700,
      donorName: "অপেক্ষমাণ দাতা",
      donorPhone: "01812345678",
      donorEmail: "pending@example.com",
      status: "PENDING",
    },
  });
  pendingCode = pending.trackingCode;

  const silent = await db.donation.create({
    data: {
      trackingCode: `DN-${year}-${String(Number(rand) + 3).padStart(6, "0")}`,
      receiptNo: `ASDRI-R-${String(Number(rand) + 3).padStart(6, "0")}`,
      fundId: fund.id,
      amount: 300,
      donorName: "নীরব দাতা",
      status: "PENDING",
    },
  });
  silentCode = silent.trackingCode;
});

/* ————— admissions lookup ————— */

describe("POST /api/admissions/status-lookup", () => {
  test("200 returns the status track for the matching pair", async () => {
    const res = await APP_LOOKUP(
      jsonRequest(appUrl, { trackingNo: appTracking, phone: APP_PHONE }, { "x-forwarded-for": "10.30.0.1" }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      data: {
        trackingNo: string;
        status: string;
        applicantName: string;
        course: { code: string };
        intakeYear: number;
        events: { status: string; at: string }[];
      };
    };
    expect(json.data.trackingNo).toBe(appTracking);
    expect(json.data.status).toBe("UNDER_REVIEW");
    expect(json.data.applicantName).toBe("আবেদনকারী");
    expect(json.data.course.code).toMatch(/^SSC-/);
    expect(json.data.intakeYear).toBe(new Date().getFullYear());
    expect(json.data.events.map((e) => e.status)).toEqual(["SUBMITTED", "UNDER_REVIEW"]);
    // officer notes never leave the server
    expect(JSON.stringify(json)).not.toContain("internal note");
    expect(JSON.stringify(json)).not.toContain("officer-only remark");
  });

  test("200 accepts the same phone with +880 prefix or Bengali digits", async () => {
    const withPrefix = await APP_LOOKUP(
      jsonRequest(appUrl, { trackingNo: appTracking, phone: "+8801712345678" }, { "x-forwarded-for": "10.30.0.2" }),
    );
    expect(withPrefix.status).toBe(200);

    const bengaliDigits = await APP_LOOKUP(
      jsonRequest(appUrl, { trackingNo: appTracking, phone: "০১৭১২৩৪৫৬৭৮" }, { "x-forwarded-for": "10.30.0.3" }),
    );
    expect(bengaliDigits.status).toBe(200);
  });

  test("404 wrong phone is indistinguishable from unknown tracking number", async () => {
    const wrongPhone = await APP_LOOKUP(
      jsonRequest(appUrl, { trackingNo: appTracking, phone: "01999999999" }, { "x-forwarded-for": "10.30.0.4" }),
    );
    const unknown = await APP_LOOKUP(
      jsonRequest(appUrl, { trackingNo: `ASDRI-2026-999999`, phone: APP_PHONE }, { "x-forwarded-for": "10.30.0.4" }),
    );
    expect(wrongPhone.status).toBe(404);
    expect(unknown.status).toBe(404);
    const wrongBody = (await wrongPhone.json()) as { error: string };
    const unknownBody = (await unknown.json()) as { error: string };
    expect(wrongBody.error).toBe(unknownBody.error);
    // lang defaults to bn — the mismatch message must be Bangla (a wrong-branch
    // return of the English string pinned here once broke this in review)
    expect(wrongBody.error).toContain("তথ্য মেলেনি");
  });

  test("404 unsubmitted drafts behave like unknown numbers", async () => {
    const res = await APP_LOOKUP(
      jsonRequest(appUrl, { trackingNo: draftTracking, phone: APP_PHONE }, { "x-forwarded-for": "10.30.0.5" }),
    );
    expect(res.status).toBe(404);
  });

  test("400 malformed input", async () => {
    const res = await APP_LOOKUP(
      jsonRequest(appUrl, { trackingNo: "not-a-number", phone: "12" }, { "x-forwarded-for": "10.30.0.6" }),
    );
    expect(res.status).toBe(400);
  });

  test("403 cross-origin", async () => {
    const res = await APP_LOOKUP(
      jsonRequest(appUrl, { trackingNo: appTracking, phone: APP_PHONE }, {
        "x-forwarded-for": "10.30.0.7",
        origin: "https://evil.example",
      }),
    );
    expect(res.status).toBe(403);
  });

  test("429 after the 8-attempt window from one IP", async () => {
    for (let i = 0; i < 8; i++) {
      const res = await APP_LOOKUP(
        jsonRequest(appUrl, { trackingNo: appTracking, phone: APP_PHONE }, { "x-forwarded-for": "10.30.0.8" }),
      );
      expect(res.status).toBe(200);
    }
    const ninth = await APP_LOOKUP(
      jsonRequest(appUrl, { trackingNo: appTracking, phone: APP_PHONE }, { "x-forwarded-for": "10.30.0.8" }),
    );
    expect(ninth.status).toBe(429);
    expect(ninth.headers.get("retry-after")).toBeTruthy();
  });
});

/* ————— donations lookup ————— */

describe("POST /api/donations/status-lookup", () => {
  test("200 verifies by phone (prefix/format tolerant) and returns the receipt", async () => {
    const res = await DON_LOOKUP(
      jsonRequest(donUrl, { code: donationCode, phone: "01712345678" }, { "x-forwarded-for": "10.31.0.1" }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      data: {
        trackingCode: string;
        receiptNo: string | null;
        status: string;
        amount: number;
        fundName: { bn: string };
        paymentInfo: unknown;
      };
    };
    expect(json.data.trackingCode).toBe(donationCode);
    expect(json.data.receiptNo).toBe(receiptCode);
    expect(json.data.status).toBe("COMPLETED");
    expect(json.data.amount).toBe(2500);
    expect(json.data.fundName.bn).toBe("ফান্ড");
    expect(json.data.paymentInfo).toBeNull(); // completed → no manual channels
  });

  test("200 verifies by email (case-insensitive) and by receipt number instead of the tracking code", async () => {
    const byEmail = await DON_LOOKUP(
      jsonRequest(donUrl, { code: donationCode, email: "donor@example.com" }, { "x-forwarded-for": "10.31.0.2" }),
    );
    expect(byEmail.status).toBe(200);

    const byReceipt = await DON_LOOKUP(
      jsonRequest(donUrl, { code: receiptCode, email: "DONOR@example.com" }, { "x-forwarded-for": "10.31.0.2" }),
    );
    expect(byReceipt.status).toBe(200);
    const json = (await byReceipt.json()) as { data: { trackingCode: string } };
    expect(json.data.trackingCode).toBe(donationCode);
  });

  test("200 PENDING donation repeats the manual payment channels", async () => {
    const res = await DON_LOOKUP(
      jsonRequest(donUrl, { code: pendingCode, phone: "01812345678" }, { "x-forwarded-for": "10.31.0.3" }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      data: { status: string; receiptNo: string | null; paymentInfo: { bkash: string; bank: string } | null };
    };
    expect(json.data.status).toBe("PENDING");
    expect(json.data.receiptNo).toBeNull(); // receipt number appears only when completed
    expect(json.data.paymentInfo).not.toBeNull();
    expect(json.data.paymentInfo!.bkash.length).toBeGreaterThan(0);
    expect(json.data.paymentInfo!.bank.length).toBeGreaterThan(0);
  });

  test("404 wrong second factor is indistinguishable from unknown code", async () => {
    const wrongPhone = await DON_LOOKUP(
      jsonRequest(donUrl, { code: donationCode, phone: "01999999999" }, { "x-forwarded-for": "10.31.0.4" }),
    );
    const wrongEmail = await DON_LOOKUP(
      jsonRequest(donUrl, { code: donationCode, email: "someone-else@example.com" }, { "x-forwarded-for": "10.31.0.4" }),
    );
    const unknown = await DON_LOOKUP(
      jsonRequest(donUrl, { code: "DN-2026-999999", phone: "01712345678" }, { "x-forwarded-for": "10.31.0.4" }),
    );
    expect([wrongPhone.status, wrongEmail.status, unknown.status]).toEqual([404, 404, 404]);
    const bodies = await Promise.all(
      [wrongPhone, wrongEmail, unknown].map((r) => r.json() as Promise<{ error: string }>),
    );
    expect(new Set(bodies.map((b) => b.error)).size).toBe(1);
  });

  test("404 donation stored without phone or email cannot be verified publicly", async () => {
    const res = await DON_LOOKUP(
      jsonRequest(donUrl, { code: silentCode, phone: "01700000000", email: "guess@example.com" }, { "x-forwarded-for": "10.31.0.5" }),
    );
    expect(res.status).toBe(404);
  });

  test("400 without any second factor", async () => {
    const res = await DON_LOOKUP(
      jsonRequest(donUrl, { code: donationCode }, { "x-forwarded-for": "10.31.0.6" }),
    );
    expect(res.status).toBe(400);
  });

  test("400 malformed code", async () => {
    const res = await DON_LOOKUP(
      jsonRequest(donUrl, { code: "hello", phone: "01712345678" }, { "x-forwarded-for": "10.31.0.7" }),
    );
    expect(res.status).toBe(400);
  });

  test("429 after the 8-attempt window from one IP", async () => {
    for (let i = 0; i < 8; i++) {
      const res = await DON_LOOKUP(
        jsonRequest(donUrl, { code: pendingCode, phone: "01812345678" }, { "x-forwarded-for": "10.31.0.8" }),
      );
      expect(res.status).toBe(200);
    }
    const ninth = await DON_LOOKUP(
      jsonRequest(donUrl, { code: pendingCode, phone: "01812345678" }, { "x-forwarded-for": "10.31.0.8" }),
    );
    expect(ninth.status).toBe(429);
  });
});
