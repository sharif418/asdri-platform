import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BookMarked,
  ClipboardList,
  HandCoins,
  History,
  Inbox,
  Megaphone,
  MessageSquareText,
  PenLine,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, isStaff, roleCan } from "@/lib/auth";
import { formatNumber, formatTaka } from "@/lib/format";
import { toBnDigits } from "@/lib/format";
import { formatDate } from "@/lib/format";
import { auditActionLabelBn } from "@/lib/audit-labels";
import { cn } from "@/lib/utils";

export const metadata = { title: "ড্যাশবোর্ড" };

function StatCard({
  icon: Icon,
  value,
  label,
  caption,
  href,
  accent,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  caption: string;
  href?: string;
  accent?: "gold" | "emerald";
}) {
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
        <ArrowRight aria-hidden className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p className="font-heading mt-3 text-2xl font-bold leading-none tracking-tight">{value}</p>
      <p className="mt-1.5 text-[13px] font-semibold">{label}</p>
      <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">{caption}</p>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="group block rounded-2xl border bg-card p-5 shadow-sm transition-all hover:border-gold/50 hover:shadow-md">
        {inner}
      </Link>
    );
  }
  return <div className="rounded-2xl border bg-card p-5 shadow-sm">{inner}</div>;
}

/** Admin dashboard: live counts, latest activity, and the working queues. */
export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || !isStaff(session.user.role)) redirect("/login");
  const role = session.user.role;

  const [
    noticeCount,
    courseCount,
    peopleCount,
    postCount,
    pendingFatwa,
    pendingApplications,
    donationCompleted,
    donationPending,
    unreadMessages,
    subscribers,
    recentAudit,
    latestNotices,
  ] = await Promise.all([
    db.notice.count({ where: { isPublished: true } }),
    db.course.count({ where: { isPublished: true } }),
    db.person.count({ where: { isPublished: true } }),
    db.post.count({ where: { isPublished: true } }),
    db.fatwaQuestion.count({ where: { status: "PENDING" } }),
    db.application.count({ where: { status: "SUBMITTED" } }),
    db.donation.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
    db.donation.count({ where: { status: "PENDING" } }),
    db.contactMessage.count({ where: { isRead: false } }),
    db.newsletterSubscriber.count(),
    db.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { name: true } } },
    }),
    // প্রকাশিত নোটিশই ড্যাশবোর্ডে — খসড়া আর ঢুকবে না (r4 M1)।
    db.notice.findMany({
      where: { isPublished: true },
      take: 5,
      orderBy: { publishedAt: "desc" },
      select: { slug: true, titleBn: true, category: true, publishedAt: true, status: true },
    }),
  ]);

  const cards: { icon: LucideIcon; value: string; label: string; caption: string; href?: string; accent?: "gold" | "emerald"; show: boolean }[] = [
    { icon: Megaphone, value: formatNumber(noticeCount, "bn"), label: "প্রকাশিত নোটিশ", caption: "নোটিশ বোর্ডে এখন দৃশ্যমান", href: "/admin/notices", show: true },
    { icon: BookMarked, value: formatNumber(courseCount, "bn"), label: "চলমান কোর্স", caption: "সিলেবাসসহ সম্পূর্ণ কারিকুলাম", href: "/admin/courses", show: roleCan(role, "academics") },
    { icon: Users, value: formatNumber(peopleCount, "bn"), label: "শিক্ষক ও কর্মকর্তা", caption: "টিমসহ প্রোফাইল", href: "/admin/people", show: roleCan(role, "academics") },
    { icon: PenLine, value: formatNumber(postCount, "bn"), label: "ব্লগ পোস্ট", caption: "প্রকাশিত আর্টিকেল ও খবর", href: "/admin/blog", show: roleCan(role, "content") },
    { icon: MessageSquareText, value: toBnDigits(pendingFatwa), label: "অপেক্ষমাণ ফতোয়া প্রশ্ন", caption: "গবেষণা বোর্ডের উত্তরের অপেক্ষায়", href: "/admin/fatwa/questions", accent: "gold", show: roleCan(role, "fatwa") && pendingFatwa > 0 },
    { icon: ClipboardList, value: toBnDigits(pendingApplications), label: "নতুন ভর্তি আবেদন", caption: "প্রাথমিক যাচাইয়ের অপেক্ষায়", href: "/admin/admissions/applications", accent: "gold", show: roleCan(role, "admissions") },
    { icon: HandCoins, value: formatTaka(donationCompleted._sum.amount ?? 0, "bn"), label: "সম্পন্ন ডোনেশন (মোট)", caption: `${toBnDigits(donationPending)} টি পেন্ডিং লেনদেন`, href: "/admin/finance/donations", show: roleCan(role, "finance") },
    { icon: Inbox, value: toBnDigits(unreadMessages), label: "অপঠিত বার্তা", caption: "যোগাযোগ ফর্ম থেকে", href: "/admin/inbox/messages", accent: "gold", show: roleCan(role, "messages") && unreadMessages > 0 },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">স্বাগতম, {session.user.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ইনস্টিটিউটের সম্পূর্ণ কনটেন্ট এই প্যানেল থেকে পরিচালিত হয় — সবকিছু ডেটাবেসে সংরক্ষিত, দুই ভাষায়।
          </p>
        </div>
        <Link
          href="/"
          className="text-sm font-semibold text-primary hover:underline"
        >
          ওয়েবসাইট দেখুন →
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.filter((c) => c.show).map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <section className="min-w-0 rounded-2xl border bg-card p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Megaphone aria-hidden className="h-4 w-4 text-primary" />
              সাম্প্রতিক নোটিশ
            </h2>
            <Link href="/admin/notices" className="text-xs font-semibold text-primary hover:underline">
              সব দেখুন
            </Link>
          </div>
          <ul className="mt-4 divide-y">
            {latestNotices.length === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground">এখনো কোনো নোটিশ নেই — প্রথমটি তৈরি করুন।</li>
            )}
            {latestNotices.map((notice) => (
              <li key={notice.slug} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link href={`/admin/notices/${notice.slug}`} className="block truncate text-[13.5px] font-medium hover:text-primary">
                    {notice.titleBn}
                  </Link>
                  <p className="text-[11px] text-muted-foreground">{formatDate(notice.publishedAt, "bn")}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold",
                    notice.status === "NEW" && "bg-gold/15 text-gold",
                    notice.status === "ACTIVE" && "bg-primary/10 text-primary",
                    notice.status === "CLOSED" && "bg-muted text-muted-foreground",
                  )}
                >
                  {notice.status === "NEW" ? "নতুন" : notice.status === "ACTIVE" ? "চলছে" : "শেষ"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="min-w-0 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <History aria-hidden className="h-4 w-4 text-primary" />
              সাম্প্রতিক কার্যক্রম
            </h2>
            {roleCan(role, "audit") && (
              <Link href="/admin/audit" className="text-xs font-semibold text-primary hover:underline">
                অডিট লগ
              </Link>
            )}
          </div>
          <ul className="mt-4 space-y-3">
            {recentAudit.length === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground">এখনো কোনো পরিবর্তন হয়নি।</li>
            )}
            {recentAudit.map((log) => (
              <li key={log.id} className="flex items-start gap-2.5">
                <BadgeCheck aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-medium" title={log.action}>
                    {auditActionLabelBn(log.action)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {log.actor?.name ?? "সিস্টেম"} · {formatDate(log.createdAt, "bn")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t pt-3 text-[11px] text-muted-foreground">
            নিউজলেটার সাবস্ক্রাইবার: {toBnDigits(subscribers)} জন
          </p>
        </section>
      </div>
    </div>
  );
}

