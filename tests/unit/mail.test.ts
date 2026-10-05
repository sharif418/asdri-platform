import { describe, test, expect } from "bun:test";
import { buildDonationReceiptEmail, escapeHtml } from "@/lib/mail";

describe("escapeHtml", () => {
  test("escapes the HTML-significant characters", () => {
    expect(escapeHtml(`<a href="x">&</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;");
  });
  test("plain text passes through", () => {
    expect(escapeHtml("As-Sunnah Institute 2026")).toBe("As-Sunnah Institute 2026");
  });
});

describe("buildDonationReceiptEmail", () => {
  const email = buildDonationReceiptEmail({
    to: "donor@example.com",
    receiptNo: "ASDRI-R-000123",
    trackingCode: "DN-2026-000123",
    fundName: "Zakat Fund",
    amount: 1500,
    currency: "BDT",
    donorName: `Rahim <"q"&sons>`,
    paidAt: new Date(Date.UTC(2025, 0, 15, 10, 30)),
  });

  test("kind is donation.receipt and the subject carries the receipt number", () => {
    expect(email.kind).toBe("donation.receipt");
    expect(email.subject).toBe("Donation Receipt ASDRI-R-000123 — As-Sunnah Institute");
    expect(email.to).toBe("donor@example.com");
  });

  test("every receipt field is present in the plain-text body", () => {
    expect(email.body).toContain("Receipt No.: ASDRI-R-000123");
    expect(email.body).toContain("Tracking Code: DN-2026-000123");
    expect(email.body).toContain("Fund: Zakat Fund");
    expect(email.body).toContain("Amount: BDT 1,500");
    expect(email.body).toContain(`Donor: Rahim <"q"&sons>`);
    expect(email.body).toContain("Date: 2025-01-15");
  });

  test("HTML escapes the donor name (XSS-safe receipt)", () => {
    expect(email.html).toContain("Rahim &lt;&quot;q&quot;&amp;sons&gt;");
    expect(email.html).not.toContain(`<"q"&sons>`);
  });

  test("HTML includes the receipt card and grouped amount", () => {
    expect(email.html).toContain("Donation Receipt");
    expect(email.html).toContain("ASDRI-R-000123");
    expect(email.html).toContain("BDT 1,500");
  });

  test("payload keeps the template data for re-send/audit", () => {
    const payload = email.payload as Record<string, unknown>;
    expect(payload.receiptNo).toBe("ASDRI-R-000123");
    expect(payload.trackingCode).toBe("DN-2026-000123");
    expect(payload.amount).toBe(1500);
    expect(payload.currency).toBe("BDT");
    expect(payload.fundName).toBe("Zakat Fund");
  });
});
