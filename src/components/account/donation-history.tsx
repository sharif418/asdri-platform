import { CheckCircle2, CircleDashed, HandCoins, ReceiptText, XCircle } from "lucide-react";
import type { Lang } from "@/lib/locale";
import { formatDate, formatNumber } from "@/lib/format";
import { pick } from "@/types";
import type { DonationStatus } from "@prisma/client";

/** A donation row shaped for the account history (joined fund names). */
export interface AccountDonationView {
  id: string;
  receiptNo: string | null;
  trackingCode: string;
  amount: number;
  currency: string;
  status: DonationStatus;
  isAnonymous: boolean;
  createdAt: Date;
  fundName: { bn: string; en: string };
  campaignTitle: { bn: string; en: string } | null;
}

const STATUS_META: Record<DonationStatus, { bn: string; en: string; className: string }> = {
  PENDING: { bn: "অপেক্ষমাণ", en: "Pending", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  COMPLETED: { bn: "সম্পন্ন", en: "Completed", className: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400" },
  FAILED: { bn: "ব্যর্থ", en: "Failed", className: "bg-destructive/10 text-destructive" },
  REFUNDED: { bn: "ফেরতকৃত", en: "Refunded", className: "bg-muted text-muted-foreground" },
};

function currencySymbol(currency: string): string {
  if (currency === "USD") return "$";
  if (currency === "EUR") return "€";
  if (currency === "SAR") return "﷼ ";
  return "৳";
}

/**
 * The signed-in visitor's donation history — matched by email, so any
 * account (student, donor, alumni) sees the receipts tied to their address.
 */
export function DonationHistory({ donations, lang }: { donations: AccountDonationView[]; lang: Lang }) {
  const bn = lang === "bn";
  if (donations.length === 0) return null;

  const completed = donations.filter((d) => d.status === "COMPLETED");
  const pending = donations.filter((d) => d.status === "PENDING").length;
  const bdtTotal = completed.reduce((sum, d) => (d.currency === "BDT" ? sum + d.amount : sum), 0);
  const allBdt = completed.every((d) => d.currency === "BDT");

  return (
    <section id="donation-history" className="mt-10 scroll-mt-24" aria-label={bn ? "আমার অনুদানসমূহ" : "My donations"}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-heading flex items-center gap-2.5 text-xl font-bold">
          <HandCoins aria-hidden className="h-5 w-5 text-gold" />
          {bn ? "আমার অনুদানসমূহ" : "My Donations"}
        </h2>
        <p className="text-[12px] text-muted-foreground">
          {bn
            ? "এই ইমেইল দিয়ে করা সব অনুদানের রিসিপ্ট ও স্ট্যাটাস"
            : "Every donation made with this email — receipts and statuses"}
        </p>
      </div>

      {/* Summary chips */}
      <div className="mt-4 flex flex-wrap gap-2.5">
        <span className="rounded-full border border-gold/40 bg-gold/[0.07] px-3.5 py-1.5 text-[12.5px] font-semibold text-gold">
          {bn ? "সম্পন্ন" : "Completed"}: {formatNumber(completed.length, lang)}
        </span>
        {allBdt && completed.length > 0 ? (
          <span className="rounded-full border border-emerald-600/30 bg-emerald-600/[0.07] px-3.5 py-1.5 text-[12.5px] font-semibold text-primary">
            {bn ? "মোট" : "Total"}: ৳{formatNumber(bdtTotal, lang)}
          </span>
        ) : null}
        {pending > 0 ? (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/[0.07] px-3.5 py-1.5 text-[12.5px] font-semibold text-amber-700 dark:text-amber-400">
            {bn ? "অপেক্ষমাণ" : "Pending"}: {formatNumber(pending, lang)}
          </span>
        ) : null}
      </div>

      {/* History rows */}
      <ol className="mt-5 space-y-3">
        {donations.slice(0, 20).map((donation) => {
          const meta = STATUS_META[donation.status];
          return (
            <li
              key={donation.id}
              className="rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:border-gold/40 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-mono text-[13px] font-bold text-foreground">
                    <ReceiptText aria-hidden className="h-4 w-4 shrink-0 text-gold" />
                    {donation.receiptNo ?? donation.trackingCode}
                  </p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {pick(donation.fundName, lang)}
                    {donation.campaignTitle ? (
                      <span className="text-gold"> · {pick(donation.campaignTitle, lang)}</span>
                    ) : null}
                    {donation.isAnonymous ? (
                      <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium">
                        {bn ? "গোপন" : "Anonymous"}
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="font-heading text-[15px] font-bold text-primary">
                    {currencySymbol(donation.currency)}
                    {formatNumber(donation.amount, lang)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.className}`}
                  >
                    {donation.status === "COMPLETED" ? (
                      <CheckCircle2 aria-hidden className="h-3 w-3" />
                    ) : donation.status === "PENDING" ? (
                      <CircleDashed aria-hidden className="h-3 w-3" />
                    ) : (
                      <XCircle aria-hidden className="h-3 w-3" />
                    )}
                    {bn ? meta.bn : meta.en}
                  </span>
                </div>
              </div>
              <p className="mt-2.5 border-t pt-2.5 text-[11.5px] text-muted-foreground">
                {formatDate(donation.createdAt, lang)}
                {donation.status === "PENDING" ? (
                  <span className="ml-2 text-amber-700 dark:text-amber-400">
                    {bn
                      ? "— পেমেন্ট সম্পন্ন হলে রিসিপ্ট ইমেইলে পাঠানো হবে ইনশাআল্লাহ"
                      : "— the receipt is emailed once the payment completes, in sha Allah"}
                  </span>
                ) : null}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
