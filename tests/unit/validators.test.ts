import { describe, test, expect } from "bun:test";
import {
  contactSchema,
  newsletterSchema,
  fatwaQuestionSchema,
  donationSchema,
  paymentCallbackSchema,
  loginSchema,
  registerSchema,
  zodFields,
} from "@/lib/validators";

describe("donationSchema", () => {
  const valid = {
    fundType: "general",
    amount: 1500,
    donorName: "মুহাম্মাদ রহিম",
    email: "donor@example.com",
  };

  test("happy path fills defaults: BDT currency, not anonymous, not recurring", () => {
    const parsed = donationSchema.parse(valid);
    expect(parsed.currency).toBe("BDT");
    expect(parsed.anonymous).toBe(false);
    expect(parsed.recurring).toBe(false);
    expect(parsed.phone).toBeUndefined();
    expect(parsed.message).toBeUndefined();
  });

  test("anonymous donations parse and keep the donor name (ledger integrity)", () => {
    const parsed = donationSchema.parse({ ...valid, anonymous: true });
    expect(parsed.anonymous).toBe(true);
    expect(parsed.donorName).toBe("মুহাম্মাদ রহিম");
  });

  test("Bengali-digit amounts are rejected (client must convert to a number first)", () => {
    const result = donationSchema.safeParse({ ...valid, amount: "১৫০০" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(zodFields(result.error).amount).toBe("সঠিক পরিমাণ লিখুন");
    }
  });

  test("amount bounds: below 10 and above 1 crore both fail with Bengali messages", () => {
    for (const amount of [5, 10000001]) {
      const result = donationSchema.safeParse({ ...valid, amount });
      expect(result.success).toBe(false);
    }
    const low = donationSchema.safeParse({ ...valid, amount: 5 });
    if (!low.success) expect(zodFields(low.error).amount).toBe("সর্বনিম্ন ১০ টাকা");
  });

  test("currency must be one of the four enum values", () => {
    expect(donationSchema.safeParse({ ...valid, currency: "GBP" }).success).toBe(false);
    expect(donationSchema.parse({ ...valid, currency: "USD" }).currency).toBe("USD");
  });

  test("per-field errors: short donor name and bad email surface separately", () => {
    const result = donationSchema.safeParse({ ...valid, donorName: "আ", email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = zodFields(result.error);
      expect(fields.donorName).toBe("নাম লিখুন");
      expect(fields.email).toBe("সঠিক ইমেইল দিন");
    }
  });

  test("phone is optional but must look like a phone when present", () => {
    expect(donationSchema.safeParse({ ...valid, phone: "01712345678" }).success).toBe(true);
    expect(donationSchema.safeParse({ ...valid, phone: "" }).success).toBe(true);
    expect(donationSchema.safeParse({ ...valid, phone: "hello" }).success).toBe(false);
  });

  test("unknown fundType is rejected (enum)", () => {
    expect(donationSchema.safeParse({ ...valid, fundType: "gold" }).success).toBe(false);
  });
});

describe("contactSchema", () => {
  const valid = {
    name: "আব্দুল্লাহ",
    email: "a@example.com",
    subject: "ভর্তি সংক্রান্ত জিজ্ঞাসা",
    message: "অনুগ্রহ করে বিস্তারিত জানাবেন।",
  };

  test("happy path with optional phone", () => {
    expect(contactSchema.parse(valid).phone).toBeUndefined();
    expect(contactSchema.parse({ ...valid, phone: "+880171234567" }).phone).toBe("+880171234567");
  });

  test("rejects short name, bad email, short subject and short message", () => {
    const result = contactSchema.safeParse({
      name: "আ",
      email: "nope",
      subject: "x",
      message: "ছোট",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = zodFields(result.error);
      expect(fields.name).toBe("নাম কমপক্ষে ২ অক্ষরের হতে হবে");
      expect(fields.email).toBe("সঠিক ইমেইল দিন");
      expect(fields.subject).toBe("বিষয় লিখুন");
      expect(fields.message).toBe("বার্তা কমপক্ষে ১০ অক্ষরের হতে হবে");
    }
  });
});

describe("newsletterSchema", () => {
  test("happy path", () => {
    expect(newsletterSchema.parse({ email: "sub@example.com" }).email).toBe("sub@example.com");
  });
  test("bad email rejected", () => {
    expect(newsletterSchema.safeParse({ email: "sub@example" }).success).toBe(false);
  });
});

describe("fatwaQuestionSchema", () => {
  const valid = {
    name: "প্রশ্নকারী",
    email: "q@example.com",
    category: "ibadat",
    question: "পাঁচ ওয়াক্ত নামাজের সময়সীমা কি কি?",
  };

  test("happy path defaults to public question", () => {
    const parsed = fatwaQuestionSchema.parse(valid);
    expect(parsed.isPrivate).toBe(false);
    expect(parsed.phone).toBeUndefined();
  });

  test("private question parses", () => {
    expect(fatwaQuestionSchema.parse({ ...valid, isPrivate: true }).isPrivate).toBe(true);
  });

  test("rejects short questions and unknown categories", () => {
    const short = fatwaQuestionSchema.safeParse({ ...valid, question: "ছোট প্রশ্ন" });
    expect(short.success).toBe(false);
    if (!short.success) {
      expect(zodFields(short.error).question).toContain("কমপক্ষে ১৫");
    }
    expect(fatwaQuestionSchema.safeParse({ ...valid, category: "fiqh" }).success).toBe(false);
  });
});

describe("paymentCallbackSchema (sandbox gateway callback)", () => {
  test("accepts a well-formed signed callback", () => {
    const parsed = paymentCallbackSchema.parse({
      trackingCode: "DN-2026-000001",
      status: "COMPLETED",
      providerTxnId: "TXN-ABC-123",
      signature: "a".repeat(64),
    });
    expect(parsed.status).toBe("COMPLETED");
  });

  test("tracking code must match DN-YYYY-NNNNNN", () => {
    for (const bad of ["DN-26-000001", "ASDRI-2026-1", "DN-2026-1", ""]) {
      expect(paymentCallbackSchema.safeParse({
        trackingCode: bad,
        status: "COMPLETED",
        signature: "a".repeat(64),
      }).success).toBe(false);
    }
  });

  test("status only allows COMPLETED | FAILED; signature must be 64 hex", () => {
    expect(paymentCallbackSchema.safeParse({
      trackingCode: "DN-2026-000001",
      status: "REFUNDED",
      signature: "a".repeat(64),
    }).success).toBe(false);
    expect(paymentCallbackSchema.safeParse({
      trackingCode: "DN-2026-000001",
      status: "FAILED",
      signature: "z".repeat(64), // not hex
    }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  test("happy path", () => {
    expect(loginSchema.parse({ email: "a@b.co", password: "Password123" }).email).toBe("a@b.co");
  });
  test("password must be at least 8 characters", () => {
    const result = loginSchema.safeParse({ email: "a@b.co", password: "short" });
    expect(result.success).toBe(false);
    if (!result.success) expect(zodFields(result.error).password).toContain("৮");
  });
});

describe("registerSchema", () => {
  const valid = {
    name: "নতুন শিক্ষার্থী",
    email: "new@example.com",
    role: "student",
    password: "Password123",
    confirmPassword: "Password123",
  };

  test("happy path", () => {
    expect(registerSchema.parse(valid).role).toBe("student");
  });

  test("password mismatch lands on the confirmPassword field", () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: "Different123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(zodFields(result.error).confirmPassword).toBe("পাসওয়ার্ড দুটি মিলছে না");
    }
  });

  test("password rules: minimum length applies to registration too", () => {
    expect(registerSchema.safeParse({ ...valid, password: "Short1", confirmPassword: "Short1" }).success).toBe(false);
  });

  test("role must be student | donor | alumni", () => {
    expect(registerSchema.safeParse({ ...valid, role: "staff" }).success).toBe(false);
  });
});

describe("zodFields", () => {
  test("maps the first issue per field path", () => {
    const result = donationSchema.safeParse({ fundType: "x", amount: 1, donorName: "y", email: "z" });
    expect(result.success).toBe(false);
    if (result.success) return;
    const fields = zodFields(result.error);
    expect(Object.keys(fields).sort()).toEqual(["amount", "donorName", "email", "fundType"]);
    for (const message of Object.values(fields)) {
      expect(typeof message).toBe("string");
      expect(message.length).toBeGreaterThan(0);
    }
  });
});
