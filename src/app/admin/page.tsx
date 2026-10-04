import Link from "next/link";
import {
  ArrowRight,
  BookMarked,
  HandHeart,
  History,
  Hourglass,
  Inbox,
  Mail,
  Megaphone,
  MessageSquareText,
  Plus,
  Target,
  Users,
} from "lucide-react";
import { db } from "@/lib/db";
import { getLang } from "@/lib/i18n-server";
import { daysAgoLabel, formatDate, formatNumber } from "@/lib/format";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { adminCategoryLabel, adminStatusBadgeClass, adminStatusLabel } from "@/components/admin/admin-types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Language, NoticeCategory, NoticeStatus } from "@/types";

export const metadata = { title: "ড্যাশবোর্ড" };

interface StatCardProps {
  icon: typeof Megaphone;
  value: number;
  label: string;
  caption: string;
  lang: Language;
  href?: string;
  accent?: "gold" | "emerald";
}

function StatCard({ icon: Icon, value, label, caption, lang, href, accent }: StatCardProps) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          aria-hidden
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            accent === "gold" ? "bg-gold/15 text-gold" : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        {accent === "gold" && value > 0 ? (
          <span className="relative flex h-2.5 w-2.5" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold" />
          </span>
        ) : null}
      </div>
      <p className="font-heading mt-3 text-3xl font-bold leading-none tracking-tight">
        {formatNumber(value, lang)}
      </p>
      <p className="mt-1.5 text-[13.5px] font-semibold">{label}</p>
      <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">{caption}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-2xl border bg-card p-5 shadow-sm transition-all hover:border-gold/50 hover:shadow-md"
      >
        {inner}
      </Link>
    );
  }
  return <div className="rounded-2xl border bg-card p-5 shadow-sm">{inner}</div>;
}

/** Admin dashboard: live counts, latest notices, and the pending fatwa queue. */
export default async function AdminDashboardPage() {
  const lang = await getLang();
  const bn = lang === "bn";

  const [
    noticeTotal,
    fatwaEntryTotal,
    fatwaPending,
    contactNew,
    subscriberTotal,
    donationTotal,
    campaignTotal,
    auditTotal,
    userTotal,
    recentNotices,
    pendingQuestions,
  ] = await Promise.all([
    db.notice.count(),
    db.fatwaEntry.count(),
    db.fatwaQuestion.count({ where: { status: "pending" } }),
    db.contactMessage.count({ where: { status: "new" } }),
    db.newsletterSubscriber.count(),
    db.donationIntent.count(),
    db.fundingCampaign.count(),
    db.adminAction.count(),
    db.user.count(),
    db.notice.findMany({ orderBy: { publishedAt: "desc" }, take: 5 }),
    db.fatwaQuestion.findMany({ where: { status: "pending" }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  return (
    <>
      <AdminPageHeader
        eyebrow={bn ? "অ্যাডমিন প্যানেল" : "Admin Panel"}
        title={bn ? "ড্যাশবোর্ড" : "Dashboard"}
        description={
          bn
            ? "নোটিশ বোর্ড, ফতোয়া মডারেশন ও সাইটের সর্বশেষ কার্যক্রমের এক নজরে সারসংক্ষেপ।"
            : "A live overview of the notice board, fatwa moderation queue, and site activity."
        }
      >
        <Link
          href="/admin/notices/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold-gradient px-5 text-[13.5px] font-bold text-gold-foreground transition-opacity hover:opacity-90"
        >
          <Plus aria-hidden className="h-4 w-4" />
          {bn ? "নতুন নোটিশ" : "New Notice"}
        </Link>
        <Link
          href="/admin/fatwa"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-5 text-[13.5px] font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <MessageSquareText aria-hidden className="h-4 w-4" />
          {bn ? "ফতোয়া মডারেশন" : "Fatwa Moderation"}
        </Link>
      </AdminPageHeader>

      {/* Stat cards */}
      <section aria-label={bn ? "পরিসংখ্যান" : "Statistics"} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Megaphone}
          value={noticeTotal}
          label={bn ? "মোট নোটিশ" : "Total notices"}
          caption={bn ? "প্রকাশিত বিজ্ঞপ্তি বোর্ডে" : "Published board notices"}
          lang={lang}
          href="/admin/notices"
        />
        <StatCard
          icon={Hourglass}
          value={fatwaPending}
          label={bn ? "অপেক্ষমাণ ফতোয়া প্রশ্ন" : "Pending fatwa questions"}
          caption={bn ? "গবেষণা বোর্ডের উত্তরের অপেক্ষায়" : "Awaiting a board answer"}
          lang={lang}
          href="/admin/fatwa"
          accent="gold"
        />
        <StatCard
          icon={BookMarked}
          value={fatwaEntryTotal}
          label={bn ? "ফতোয়া ব্যাংক এন্ট্রি" : "Fatwa bank entries"}
          caption={bn ? "প্রকাশিত ফতোয়া সংকলন" : "Published fatwa collection"}
          lang={lang}
        />
        <StatCard
          icon={Inbox}
          value={contactNew}
          label={bn ? "নতুন যোগাযোগ বার্তা" : "New contact messages"}
          caption={bn ? "যোগাযোগ ফর্ম থেকে এসেছে" : "Arrived via the contact form"}
          lang={lang}
          href="/admin/messages"
          accent="gold"
        />
        <StatCard
          icon={Mail}
          value={subscriberTotal}
          label={bn ? "নিউজলেটার সাবস্ক্রাইবার" : "Newsletter subscribers"}
          caption={bn ? "সাপ্তাহিক আপডেট গ্রহণকারী" : "Receiving weekly updates"}
          lang={lang}
          href="/admin/subscribers"
        />
        <StatCard
          icon={HandHeart}
          value={donationTotal}
          label={bn ? "অনুদান রেকর্ড" : "Donation records"}
          caption={bn ? "সকল অনুদান ইন্টেন্ট" : "All donation intents"}
          lang={lang}
          href="/admin/donations"
        />
        <StatCard
          icon={Target}
          value={campaignTotal}
          label={bn ? "ফান্ডরাইজিং ক্যাম্পেইন" : "Funding campaigns"}
          caption={bn ? "লক্ষ্য ও অগ্রগতি ব্যবস্থাপনা" : "Target & progress management"}
          lang={lang}
          href="/admin/campaigns"
        />
        <StatCard
          icon={History}
          value={auditTotal}
          label={bn ? "অ্যাডমিন কার্যক্রম লগ" : "Admin audit trail"}
          caption={bn ? "সকল পরিবর্তনের নথি" : "Recorded admin actions"}
          lang={lang}
          href="/admin/audit"
        />
      </section>

      <p className="mt-4 flex items-center gap-2 text-[12px] text-muted-foreground">
        <Users aria-hidden className="h-3.5 w-3.5 text-primary" />
        {bn ? "নিবন্ধিত অ্যাকাউন্ট: " : "Registered accounts: "}
        <span className="font-bold text-foreground">{formatNumber(userTotal, lang)}</span>
      </p>

      {/* Recent activity panels */}
      <section aria-label={bn ? "সাম্প্রতিক কার্যক্রম" : "Recent activity"} className="mt-8 grid gap-4 lg:grid-cols-2">
        {/* Latest notices */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading flex items-center gap-2 text-lg font-semibold">
              <Megaphone aria-hidden className="h-4.5 w-4.5 text-gold" />
              {bn ? "সর্বশেষ নোটিশ" : "Latest Notices"}
            </h2>
            <Link
              href="/admin/notices"
              className="link-sweep inline-flex items-center gap-1 text-[12.5px] font-bold text-primary dark:text-gold"
            >
              {bn ? "সব দেখুন" : "View all"}
              <ArrowRight aria-hidden className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentNotices.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed p-5 text-center text-[13px] text-muted-foreground">
              {bn ? "এখনো কোনো নোটিশ নেই।" : "No notices yet."}
            </p>
          ) : (
            <ul className="mt-4 space-y-1">
              {recentNotices.map((notice) => (
                <li key={notice.id}>
                  <Link
                    href={`/admin/notices/${notice.id}`}
                    className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold group-hover:text-primary">{notice.titleBn}</p>
                      <p className="mt-0.5 text-[11.5px] text-muted-foreground">{formatDate(notice.publishedAt, lang)}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 border-primary/30 bg-primary/5 text-[10px] font-semibold text-primary dark:text-gold">
                      {adminCategoryLabel(notice.category as NoticeCategory, lang)}
                    </Badge>
                    <Badge variant="outline" className={cn("shrink-0 text-[10px] font-semibold", adminStatusBadgeClass(notice.status as NoticeStatus))}>
                      {adminStatusLabel(notice.status as NoticeStatus, lang)}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pending fatwa questions */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading flex items-center gap-2 text-lg font-semibold">
              <Hourglass aria-hidden className="h-4.5 w-4.5 text-gold" />
              {bn ? "অপেক্ষমাণ ফতোয়া প্রশ্ন" : "Pending Fatwa Questions"}
            </h2>
            <Link
              href="/admin/fatwa"
              className="link-sweep inline-flex items-center gap-1 text-[12.5px] font-bold text-primary dark:text-gold"
            >
              {bn ? "মডারেশনে যান" : "Open queue"}
              <ArrowRight aria-hidden className="h-3.5 w-3.5" />
            </Link>
          </div>

          {pendingQuestions.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed p-5 text-center text-[13px] text-muted-foreground">
              {bn ? "আলহামদুলিল্লাহ — কোনো অপেক্ষমাণ প্রশ্ন নেই।" : "Alhamdulillah — no pending questions."}
            </p>
          ) : (
            <ul className="mt-4 space-y-1">
              {pendingQuestions.map((question) => (
                <li key={question.id}>
                  <Link
                    href="/admin/fatwa"
                    className="group block rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/60"
                  >
                    <p className="line-clamp-2 text-[13px] leading-relaxed group-hover:text-primary">{question.question}</p>
                    <p className="mt-1 text-[11.5px] text-muted-foreground">
                      {question.name} · {daysAgoLabel(question.createdAt, lang)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
