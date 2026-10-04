import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  CircleDollarSign,
  HandHeart,
  LayoutDashboard,
  Lock,
  Mail,
  Repeat,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getLang } from "@/lib/i18n-server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatNumber, formatTaka } from "@/lib/format";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { StarMotif } from "@/components/shared/ornaments";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LogoutButton } from "@/components/auth/logout-button";
import { QuickAccess } from "@/components/account/quick-access";
import { FUND_LABELS } from "@/components/donations/donation-types";
import type { FundType, Language } from "@/types";
import type { SessionRole } from "@/lib/auth";
import { pick } from "@/types";

export const metadata: Metadata = {
  title: "আমার অ্যাকাউন্ট",
  description: "ডোনার ড্যাশবোর্ড — অনুদানের ইতিহাস, রিসিপ্ট ও স্পন্সর রিপোর্ট।",
};

const ROLE_LABELS: Record<SessionRole, { bn: string; en: string }> = {
  student: { bn: "শিক্ষার্থী", en: "Student" },
  donor: { bn: "ডোনার", en: "Donor" },
  alumni: { bn: "অ্যালামনাই", en: "Alumni" },
  admin: { bn: "অ্যাডমিন", en: "Admin" },
};

function amountLabel(amount: number, currency: string, lang: Language): string {
  if (currency === "BDT") return formatTaka(amount, lang);
  return `${formatNumber(amount, lang)} ${currency}`;
}

/** Account dashboard (server component): profile + donation ledger. */
export default async function AccountPage() {
  const lang = await getLang();
  const session = await getSession();

  /* ——— Not signed in: premium login-required state ——— */
  if (!session) {
    return (
      <>
        <PageHero
          eyebrow={lang === "bn" ? "অ্যাকাউন্ট" : "Account"}
          title={lang === "bn" ? "আমার অ্যাকাউন্ট" : "My Account"}
          description={
            lang === "bn"
              ? "অনুদানের রিসিপ্ট, স্পন্সর রিপোর্ট ও ব্যক্তিগত আপডেট দেখতে লগইন করুন।"
              : "Sign in to view your donation receipts, sponsor reports, and personal updates."
          }
          lang={lang}
          breadcrumb={[{ label: { bn: "অ্যাকাউন্ট", en: "Account" } }]}
          className="py-10 sm:py-14"
        />

        <section className="flex-1 bg-parchment py-16 sm:py-24" aria-label={lang === "bn" ? "লগইন প্রয়োজন" : "Login required"}>
          <div className="container-site">
            <Reveal>
              <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 text-center shadow-lg shadow-primary/5 sm:p-10">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/15">
                  <Lock aria-hidden className="h-8 w-8 text-gold" />
                </span>
                <h2 className="font-heading mt-5 text-xl font-semibold">
                  {lang === "bn" ? "এই পৃষ্ঠাটি দেখতে লগইন প্রয়োজন" : "Sign in required to view this page"}
                </h2>
                <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">
                  {lang === "bn"
                    ? "আপনার অনুদানের সম্পূর্ণ ইতিহাস, রিসিপ্ট নম্বর ও স্পন্সরকৃত শিক্ষার্থীর অগ্রগতি রিপোর্ট দেখতে অ্যাকাউন্টে লগইন করুন।"
                    : "Sign in to view your complete donation history, receipt numbers, and sponsored students' progress reports."}
                </p>
                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    {lang === "bn" ? "লগইন করুন" : "Sign In"}
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-6 py-2.5 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-gold-foreground"
                  >
                    <Sparkles aria-hidden className="h-4 w-4" />
                    {lang === "bn" ? "নতুন অ্যাকাউন্ট খুলুন" : "Create Account"}
                  </Link>
                </div>
                <p className="mt-5 text-[12px] leading-relaxed text-muted-foreground">
                  {lang === "bn"
                    ? "অ্যাকাউন্ট ছাড়াও অনুদান দিতে পারেন — "
                    : "You can donate without an account — "}
                  <Link href="/support" className="font-semibold text-primary hover:underline">
                    {lang === "bn" ? "সাপোর্ট পেজে যান" : "go to the support page"}
                  </Link>
                </p>
              </div>
            </Reveal>
          </div>
        </section>
      </>
    );
  }

  /* ——— Signed in: profile + donation ledger ——— */
  const [userRecord, donations, subscription] = await Promise.all([
    db.user.findUnique({
      where: { id: session.id },
      select: { createdAt: true, lastLoginAt: true },
    }),
    db.donationIntent.findMany({
      where: { email: session.email },
      orderBy: { createdAt: "desc" },
    }),
    // Newsletter subscription joined on the session email — the same table
    // the footer subscribe form writes to (no new API needed).
    db.newsletterSubscriber.findUnique({
      where: { email: session.email },
      select: { createdAt: true },
    }),
  ]);

  const roleLabel = ROLE_LABELS[session.role] ?? ROLE_LABELS.donor;
  const initials = session.name.trim().charAt(0).toUpperCase() || "?";
  const bdtTotal = donations
    .filter((d) => d.currency === "BDT")
    .reduce((sum, d) => sum + d.amount, 0);
  const recurringCount = donations.filter((d) => d.recurring).length;

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "অ্যাকাউন্ট" : "Account"}
        title={lang === "bn" ? "আমার অ্যাকাউন্ট" : "My Account"}
        description={
          lang === "bn"
            ? "আপনার প্রোফাইল, অনুদানের সম্পূর্ণ ইতিহাস ও রিসিপ্ট — সব এক জায়গায়।"
            : "Your profile, complete donation history, and receipts — all in one place."
        }
        lang={lang}
        breadcrumb={[{ label: { bn: "অ্যাকাউন্ট", en: "Account" } }]}
        className="py-10 sm:py-14"
      />

      <section className="flex-1 bg-parchment py-12 sm:py-16" aria-label={lang === "bn" ? "ড্যাশবোর্ড" : "Dashboard"}>
        <div className="container-site space-y-8">
          {/* Admin shortcut (admins only) */}
          {session.role === "admin" ? (
            <Reveal>
              <div className="relative overflow-hidden rounded-2xl border border-gold/40 bg-gold/10 p-5 shadow-sm sm:p-6">
                <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gold-gradient" />
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3.5">
                    <span
                      aria-hidden
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-gold"
                    >
                      <ShieldCheck className="h-5.5 w-5.5" />
                    </span>
                    <div>
                      <h2 className="font-heading text-[16px] font-bold">
                        {lang === "bn" ? "অ্যাডমিন অ্যাক্সেস সক্রিয়" : "Admin access enabled"}
                      </h2>
                      <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
                        {lang === "bn"
                          ? "নোটিশ প্রকাশ, ফতোয়া মডারেশন ও কনটেন্ট ব্যবস্থাপনার জন্য অ্যাডমিন প্যানেলে প্রবেশ করুন।"
                          : "Open the admin panel to publish notices, moderate fatwa questions, and manage content."}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/admin"
                    className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-gold-gradient px-5 text-[13.5px] font-bold text-gold-foreground transition-opacity hover:opacity-90"
                  >
                    <LayoutDashboard aria-hidden className="h-4 w-4" />
                    {lang === "bn" ? "অ্যাডমিন প্যানেলে যান" : "Go to Admin Panel"}
                  </Link>
                </div>
              </div>
            </Reveal>
          ) : null}

          {/* Profile card */}
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
              <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gold-gradient" />
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span
                    aria-hidden
                    className="font-heading flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-deep text-2xl font-bold text-gold shadow-md ring-2 ring-gold/40"
                  >
                    {initials}
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                      {lang === "bn" ? "আসসালামু আলাইকুম" : "Assalamu Alaikum"}
                    </p>
                    <h2 className="font-heading mt-1 text-xl font-semibold">{session.name}</h2>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                      <Mail aria-hidden className="h-3.5 w-3.5" />
                      <span dir="ltr">{session.email}</span>
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge className="gap-1 border-gold/40 bg-gold/10 font-semibold text-gold" variant="outline">
                        <BadgeCheck aria-hidden className="h-3.5 w-3.5" />
                        {pick(roleLabel, lang)}
                      </Badge>
                      {userRecord?.createdAt ? (
                        <span className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
                          <CalendarDays aria-hidden className="h-3.5 w-3.5" />
                          {lang === "bn" ? "সদস্য হয়েছেন:" : "Member since:"}{" "}
                          {formatDate(userRecord.createdAt, lang)}
                        </span>
                      ) : null}
                      {userRecord?.lastLoginAt ? (
                        <span className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
                          <Sparkles aria-hidden className="h-3.5 w-3.5" />
                          {lang === "bn" ? "শেষ লগইন:" : "Last login:"}{" "}
                          {formatDate(userRecord.lastLoginAt, lang)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <LogoutButton lang={lang} />
              </div>

              {/* Quick stats */}
              <div className="mt-6 grid gap-3 border-t border-dashed pt-5 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <HandHeart aria-hidden className="h-4.5 w-4.5" />
                  </span>
                  <span>
                    <span className="block font-heading text-lg font-bold leading-none">
                      {formatNumber(donations.length, lang)}
                    </span>
                    <span className="text-[11.5px] text-muted-foreground">
                      {lang === "bn" ? "মোট অনুদান" : "Total donations"}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/15 text-gold">
                    <CircleDollarSign aria-hidden className="h-4.5 w-4.5" />
                  </span>
                  <span>
                    <span className="block font-heading text-lg font-bold leading-none">
                      {formatTaka(bdtTotal, lang)}
                    </span>
                    <span className="text-[11.5px] text-muted-foreground">
                      {lang === "bn" ? "সর্বমোট (৳)" : "Total given (৳)"}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Repeat aria-hidden className="h-4.5 w-4.5" />
                  </span>
                  <span>
                    <span className="block font-heading text-lg font-bold leading-none">
                      {formatNumber(recurringCount, lang)}
                    </span>
                    <span className="text-[11.5px] text-muted-foreground">
                      {lang === "bn" ? "মাসিক অটো-ডোনেশন" : "Monthly auto-donations"}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Quick access (role-aware) */}
          <Reveal delay={0.06}>
            <QuickAccess
              lang={lang}
              role={session.role}
              newsletterSince={subscription?.createdAt ?? null}
              donationCount={donations.length}
              donationTotalBdt={bdtTotal}
            />
          </Reveal>

          {/* Donation history */}
          <Reveal delay={0.08}>
            <div
              id="donation-history"
              className="scroll-mt-11 rounded-2xl border bg-card p-6 shadow-sm sm:p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-heading flex items-center gap-2.5 text-lg font-semibold">
                  <StarMotif className="h-4 w-4 text-gold" />
                  {lang === "bn" ? "অনুদানের ইতিহাস" : "Donation History"}
                </h3>
                <Link
                  href="/support"
                  className="inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-4 py-2 text-[13px] font-semibold text-gold-foreground transition-opacity hover:opacity-95"
                >
                  <HandHeart aria-hidden className="h-3.5 w-3.5" />
                  {lang === "bn" ? "নতুন অনুদান দিন" : "Make a Donation"}
                </Link>
              </div>

              {donations.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed bg-background/60 p-8 text-center">
                  <p className="text-[14px] font-medium">
                    {lang === "bn" ? "এখনো কোনো অনুদানের রেকর্ড নেই" : "No donation records yet"}
                  </p>
                  <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-muted-foreground">
                    {lang === "bn"
                      ? "সাপোর্ট পেজ থেকে প্রথম অনুদান দিন — রিসিপ্ট ও স্ট্যাটাস স্বয়ংক্রিয়ভাবে এখানে যুক্ত হবে ইনশাআল্লাহ।"
                      : "Make your first donation from the support page — receipts and statuses will appear here automatically."}
                  </p>
                </div>
              ) : (
                <div className="mt-6 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[12px]">{lang === "bn" ? "রিসিপ্ট নং" : "Receipt"}</TableHead>
                        <TableHead className="text-[12px]">{lang === "bn" ? "তারিখ" : "Date"}</TableHead>
                        <TableHead className="text-[12px]">{lang === "bn" ? "ফান্ড" : "Fund"}</TableHead>
                        <TableHead className="text-[12px] text-right">{lang === "bn" ? "পরিমাণ" : "Amount"}</TableHead>
                        <TableHead className="text-[12px]">{lang === "bn" ? "স্ট্যাটাস" : "Status"}</TableHead>
                        <TableHead className="text-[12px] sr-only">{lang === "bn" ? "ধরন" : "Type"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {donations.map((donation) => {
                        const fund = FUND_LABELS[donation.fundType as FundType] ?? FUND_LABELS.general;
                        const isCompleted = donation.status === "completed";
                        return (
                          <TableRow key={donation.id} className="text-[13px]">
                            <TableCell dir="ltr" className="whitespace-nowrap font-mono text-[12px] font-semibold">
                              {donation.receiptNo}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-muted-foreground">
                              {formatDate(donation.createdAt, lang)}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{pick(fund, lang)}</span>
                              {donation.studentRef ? (
                                <span dir="ltr" className="ml-1.5 font-mono text-[11px] text-muted-foreground">
                                  {donation.studentRef}
                                </span>
                              ) : null}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-right font-bold">
                              {amountLabel(donation.amount, donation.currency, lang)}
                              {donation.recurring ? (
                                <Repeat
                                  aria-label={lang === "bn" ? "মাসিক" : "Monthly"}
                                  className="ml-1.5 inline h-3.5 w-3.5 text-gold"
                                />
                              ) : null}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  isCompleted
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                                    : "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                                }
                              >
                                {isCompleted
                                  ? lang === "bn"
                                    ? "সম্পন্ন"
                                    : "Completed"
                                  : lang === "bn"
                                    ? "প্রক্রিয়াধীন"
                                    : "Processing"}
                              </Badge>
                            </TableCell>
                            <TableCell className="sr-only">
                              {donation.recurring ? (lang === "bn" ? "মাসিক" : "Monthly") : ""}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              <p className="mt-5 text-[12px] leading-relaxed text-muted-foreground">
                {lang === "bn"
                  ? "“প্রক্রিয়াধীন” মানে অনুদান রেকর্ড হয়েছে এবং পেমেন্ট নিশ্চিত হওয়ার অপেক্ষায় আছে — পেমেন্ট নিশ্চিত হলে স্ট্যাটাস হালনাগাদ হবে। কোনো ভুল দেখলে আমাদের জানান।"
                  : "“Processing” means your donation is recorded and awaiting payment confirmation — the status updates once confirmed. Contact us if anything looks wrong."}
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
