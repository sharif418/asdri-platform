import type { Metadata } from "next";
import { BadgeCheck, LayoutDashboard, Lock, Mail, ShieldCheck, Smartphone } from "lucide-react";
import type { Lang } from "@/lib/locale";
import { langPath } from "@/lib/locale";
import { db } from "@/lib/db";
import { getSession, isStaff } from "@/lib/auth";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { StarMotif } from "@/components/shared/ornaments";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/auth/logout-button";
import { pick } from "@/types";
import type { UserRole } from "@prisma/client";
import { ApplicationStatusCard } from "@/components/admissions/application-status-card";
import { DonationHistory, type AccountDonationView } from "@/components/account/donation-history";
import { EmailVerifyBanner } from "@/components/account/email-verify-banner";

export const metadata: Metadata = {
  title: "আমার অ্যাকাউন্ট",
  description: "আবেদনকারী ও ব্যবহারকারীর ড্যাশবোর্ড — আবেদনের স্ট্যাটাস ও প্রোফাইল।",
};

const ROLE_LABELS: Record<UserRole, { bn: string; en: string }> = {
  ADMIN: { bn: "অ্যাডমিনিস্ট্রেটর", en: "Administrator" },
  EDITOR: { bn: "সম্পাদক", en: "Editor" },
  ADMISSIONS: { bn: "ভর্তি কর্মকর্তা", en: "Admissions Officer" },
  FINANCE: { bn: "অর্থ বিভাগ", en: "Finance" },
  FATWA: { bn: "ফতোয়া বোর্ড", en: "Fatwa Board" },
  LIBRARIAN: { bn: "গ্রন্থাগারিক", en: "Librarian" },
  APPLICANT: { bn: "আবেদনকারী", en: "Applicant" },
  TEACHER: { bn: "শিক্ষক", en: "Teacher" },
  STUDENT: { bn: "শিক্ষার্থী", en: "Student" },
  GUARDIAN: { bn: "অভিভাবক", en: "Guardian" },
  DONOR: { bn: "দাতা", en: "Donor" },
  ALUMNI: { bn: "প্রাক্তন", en: "Alumni" },
};

/** Account hub: profile, role, and the doorways available to this account. */
export default async function AccountPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const session = await getSession();

  /* ——— Not signed in: login-required state ——— */
  if (!session) {
    return (
      <div className="container-site py-16 sm:py-24">
        <div className="mx-auto max-w-md rounded-3xl border bg-card p-8 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Lock aria-hidden className="h-7 w-7" />
          </span>
          <h1 className="font-heading mt-5 text-2xl font-bold text-balance">
            {lang === "bn" ? "লগইন করা হয়নি" : "You are signed out"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {lang === "bn"
              ? "আবেদনের স্ট্যাটাস দেখতে বা অ্যাকাউন্ট পরিচালনা করতে লগইন করুন।"
              : "Sign in to track your application or manage your account."}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <a
              href={langPath(lang, "/login")}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {lang === "bn" ? "লগইন করুন" : "Sign in"}
            </a>
            <a
              href={langPath(lang, "/register")}
              className="rounded-lg border border-primary/30 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
            >
              {lang === "bn" ? "নতুন অ্যাকাউন্ট খুলুন" : "Create an account"}
            </a>
          </div>
        </div>
      </div>
    );
  }

  const user = session.user;
  const roleLabel = pick(ROLE_LABELS[user.role] ?? { bn: user.role, en: user.role }, lang);

  const applications =
    user.role === "APPLICANT" || user.role === "ADMIN"
      ? await db.application.findMany({
          where: { userId: user.id },
          orderBy: { submittedAt: "desc" },
          include: {
            intake: { include: { course: { select: { titleBn: true, titleEn: true, code: true } } } },
            events: { orderBy: { createdAt: "asc" } },
          },
        })
      : [];

  // Donor history: donations made with this account's email. Round 3: the
  // address must be VERIFIED first — registering someone else's email must
  // not expose their donation trail. Unverified accounts get the banner +
  // resend action instead.
  const emailVerified = user.emailVerifiedAt !== null;
  const donationRows = emailVerified
    ? await db.donation.findMany({
        where: { donorEmail: { equals: user.email, mode: "insensitive" } },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          receiptNo: true,
          trackingCode: true,
          amount: true,
          currency: true,
          status: true,
          isAnonymous: true,
          createdAt: true,
          fund: { select: { nameBn: true, nameEn: true } },
          campaign: { select: { titleBn: true, titleEn: true } },
        },
      })
    : [];
  const donations: AccountDonationView[] = donationRows.map((row) => ({
    id: row.id,
    receiptNo: row.receiptNo,
    trackingCode: row.trackingCode,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    isAnonymous: row.isAnonymous,
    createdAt: row.createdAt,
    fundName: { bn: row.fund.nameBn, en: row.fund.nameEn },
    campaignTitle: row.campaign ? { bn: row.campaign.titleBn, en: row.campaign.titleEn } : null,
  }));

  return (
    <div className="container-site pb-16 pt-10 sm:pb-24">
      <PageHero
        eyebrow={lang === "bn" ? "আমার অ্যাকাউন্ট" : "My account"}
        title={lang === "bn" ? `স্বাগতম, ${user.name}` : `Welcome, ${user.name}`}
        description={
          lang === "bn"
            ? "আপনার প্রোফাইল ও এই প্ল্যাটফর্মে আপনার ভূমিকা।"
            : "Your profile and role on this platform."
        }
        breadcrumb={[{ label: lang === "bn" ? "হোম" : "Home", href: langPath(lang, "/") }]}
        lang={lang}
      />

      <Reveal className="mx-auto mt-10 max-w-3xl">
        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/15 font-heading text-lg font-bold text-gold">
                {user.name.trim().charAt(0) || "?"}
              </span>
              <div>
                <p className="font-heading text-lg font-bold">{user.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1.5">
                    <BadgeCheck aria-hidden className="h-3.5 w-3.5 text-primary" />
                    {roleLabel}
                  </Badge>
                </div>
              </div>
            </div>
            <LogoutButton lang={lang} />
          </div>

          <dl className="mt-6 grid gap-4 border-t pt-6 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <Mail aria-hidden className="h-4 w-4 text-muted-foreground" />
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {lang === "bn" ? "ইমেইল" : "Email"}
                </dt>
                <dd className="text-sm font-medium">{user.email}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Smartphone aria-hidden className="h-4 w-4 text-muted-foreground" />
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {lang === "bn" ? "ফোন" : "Phone"}
                </dt>
                <dd className="text-sm font-medium">{user.phone ?? "—"}</dd>
              </div>
            </div>
          </dl>

          {!emailVerified && <EmailVerifyBanner lang={lang} />}

          <div className="mt-8 border-t pt-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck aria-hidden className="h-4 w-4 text-primary" />
              {lang === "bn" ? "দ্রুত প্রবেশ" : "Quick access"}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {isStaff(user.role) && (
                <a
                  href="/admin"
                  className="group flex items-center justify-between rounded-xl border p-4 transition-all hover:border-gold/50 hover:shadow-md"
                >
                  <span className="flex items-center gap-3">
                    <LayoutDashboard aria-hidden className="h-5 w-5 text-primary" />
                    <span className="text-sm font-semibold">
                      {lang === "bn" ? "অ্যাডমিন প্যানেল" : "Admin panel"}
                    </span>
                  </span>
                  <span className="text-gold opacity-0 transition-opacity group-hover:opacity-100">→</span>
                </a>
              )}
              <a
                href={langPath(lang, "/admissions")}
                className="group flex items-center justify-between rounded-xl border p-4 transition-all hover:border-gold/50 hover:shadow-md"
              >
                <span className="flex items-center gap-3">
                  <StarMotif aria-hidden className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold">
                    {lang === "bn" ? "ভর্তি তথ্য" : "Admissions"}
                  </span>
                </span>
                <span className="text-gold opacity-0 transition-opacity group-hover:opacity-100">→</span>
              </a>
            </div>
            {applications.length > 0 ? (
              <a
                href={langPath(lang, "/admissions/apply")}
                className="group flex items-center justify-between rounded-xl border p-4 transition-all hover:border-gold/50 hover:shadow-md"
              >
                <span className="flex items-center gap-3">
                  <StarMotif aria-hidden className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold">
                    {lang === "bn" ? "নতুন আবেদন করুন" : "New application"}
                  </span>
                </span>
                <span className="text-gold opacity-0 transition-opacity group-hover:opacity-100">→</span>
              </a>
            ) : null}
          </div>
        </div>

        {applications.length > 0 && (
          <section className="mt-10">
            <h2 className="font-heading text-xl font-bold">
              {lang === "bn" ? "আমার ভর্তি আবেদনসমূহ" : "My admission applications"}
            </h2>
            <div className="mt-4 space-y-4">
              {applications.map((application) => (
                <ApplicationStatusCard key={application.id} application={application} lang={lang} />
              ))}
            </div>
          </section>
        )}

        {donations.length > 0 && <DonationHistory donations={donations} lang={lang} />}
      </Reveal>
    </div>
  );
}
