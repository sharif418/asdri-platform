import Link from "next/link";
import { BadgeCheck, HeartHandshake, MailWarning } from "lucide-react";
import type { DonorSelfView } from "@/lib/portals/access";
import { formatDate, formatNumber, formatTaka } from "@/lib/format";
import { StarMotif } from "@/components/shared/ornaments";

const STATUS_LABEL: Record<string, { label: string; chip: string }> = {
  PENDING: { label: "অপেক্ষমাণ", chip: "bg-gold/15 text-gold" },
  COMPLETED: { label: "সম্পন্ন", chip: "bg-primary/10 text-primary" },
  FAILED: { label: "ব্যর্থ", chip: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300" },
  REFUNDED: { label: "ফেরত", chip: "bg-muted text-muted-foreground" },
};

/** Donor portal home: this donor's own history, verification-gated like /account. */
export function DonorHome({ self }: { self: DonorSelfView }) {
  if (!self.emailVerified) {
    return (
      <div className="rounded-2xl border border-gold/40 bg-gold-soft/30 px-6 py-10 text-center">
        <MailWarning aria-hidden className="mx-auto h-8 w-8 text-gold" />
        <h2 className="mt-3 text-lg font-bold">ইমেইল যাচাই বাকি</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          আপনার অনুদানের ইতিহাস দেখতে অ্যাকাউন্টের ইমেইলটি যাচাই করতে হবে। রেজিস্ট্রেশনের সময়
          যে ইমেইল দিয়েছিলেন সেখানে পাঠানো লিংকটি এখনো ব্যবহার করা হয়নি।
        </p>
        <Link href="/verify-email" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground">
          ইমেইল যাচাই করুন
        </Link>
      </div>
    );
  }

  const completed = self.donations.filter((d) => d.status === "COMPLETED");
  const total = completed.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="grid gap-6">
      {/* keepsake band — the donor's lifetime card (gold spine + star divider) */}
      <section className="relative overflow-hidden rounded-2xl border bg-emerald-deep p-6 pt-7 text-ivory shadow-sm">
        <span aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-gold-gradient" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span
              aria-hidden
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-gold/15 text-xl font-bold text-gold"
            >
              {"দ"}
            </span>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-gold">মোট অনুদান (সম্পন্ন)</p>
              <p className="mt-1 text-3xl font-bold">{formatTaka(total, "bn")}</p>
              <p className="mt-1 text-[12.5px] text-ivory/70">
                {formatNumber(completed.length, "bn")} টি সম্পন্ন · মোট {formatNumber(self.donations.length, "bn")} টি লেনদেন
              </p>
            </div>
          </div>
          <HeartHandshake aria-hidden className="h-12 w-12 text-gold/70" />
        </div>
        <div className="mt-5 flex items-center justify-center" aria-hidden>
          <StarMotif className="h-4 w-4 text-gold/60" />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <h2 className="border-b bg-secondary/40 px-5 py-3 text-[13.5px] font-bold">অনুদানের ইতিহাস</h2>
        {self.donations.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            এই অ্যাকাউন্টের ইমেইলে এখনো কোনো অনুদান জমা হয়নি।
          </p>
        ) : (
          <ul className="divide-y">
            {self.donations.map((donation) => {
              const meta = STATUS_LABEL[donation.status] ?? { label: donation.status, chip: "bg-muted text-muted-foreground" };
              return (
                <li key={donation.trackingCode} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold">{donation.fundNameBn}</p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {formatDate(donation.completedAt ?? donation.createdAt, "bn")} ·{" "}
                      <span dir="ltr">{donation.receiptNo !== "—" ? donation.receiptNo : donation.trackingCode}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[15px] font-bold">{formatTaka(donation.amount, "bn")}</span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.chip}`}>{meta.label}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="flex items-center justify-center gap-1.5 text-[12px] text-muted-foreground">
        <BadgeCheck aria-hidden className="h-3.5 w-3.5 text-primary" />
        রিসিপ্ট পুনরায় দেখতে <Link href="/support/receipt-lookup" className="font-semibold text-primary hover:underline">রিসিপ্ট খুঁজুন</Link> পাতাটি ব্যবহার করুন।
      </p>
    </div>
  );
}
