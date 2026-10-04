import Link from "next/link";
import {
  ArrowRight,
  BookMarked,
  Calculator,
  CheckCircle2,
  Download,
  GraduationCap,
  HandHeart,
  Mail,
  MailCheck,
} from "lucide-react";
import { formatDate, formatNumber, formatTaka } from "@/lib/format";
import type { SessionRole } from "@/lib/auth";
import type { Language } from "@/types";

/* ————————————————— Role-aware welcome hints ————————————————— */

const ROLE_HINTS: Record<SessionRole, { bn: string; en: string }> = {
  student: {
    bn: "আপনার কোর্স, নোটিশ ও পড়ার উপকরণের দ্রুত প্রবেশ।",
    en: "Quick access to your courses, notices, and study materials.",
  },
  donor: {
    bn: "অনুদানের ইতিহাস ও চলমান কার্যক্রমের আপডেট এক নজরে।",
    en: "Your donation history and program updates at a glance.",
  },
  alumni: {
    bn: "প্রাক্তন শিক্ষার্থী হিসেবে কার্যক্রম ও রিসোর্সে যুক্ত থাকুন।",
    en: "Stay connected with programs and resources as an alumnus.",
  },
  admin: {
    bn: "নোটিশ, ফতোয়া ও কনটেন্ট ব্যবস্থাপনার দ্রুত পথ।",
    en: "Fast paths to notice, fatwa, and content management.",
  },
};

/* ————————————————— Shared card visuals ————————————————— */

const cardBase =
  "group flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm transition-all";

const linkCard = `${cardBase} hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md`;

function CardIcon({ Icon, tone = "gold" }: { Icon: typeof Mail; tone?: "gold" | "emerald" }) {
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
        tone === "gold" ? "bg-gold/15 text-gold" : "bg-primary/10 text-primary"
      }`}
    >
      <Icon aria-hidden className="h-5 w-5" />
    </span>
  );
}

function CardArrow() {
  return (
    <ArrowRight
      aria-hidden
      className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-gold"
    />
  );
}

/* ————————————————— Quick-access grid ————————————————— */

interface QuickAccessProps {
  lang: Language;
  role: SessionRole;
  /** Newsletter subscription joined on the session email (createdAt), or null. */
  newsletterSince: Date | null;
  /** Donation totals joined on the session email. */
  donationCount: number;
  donationTotalBdt: number;
}

/**
 * Role-aware quick access for the account dashboard: live newsletter
 * subscription status (same DB table the footer form writes to), a
 * donation summary linking to the ledger below, and curated site quick
 * links — all in the established gold-hover card language.
 */
export function QuickAccess({
  lang,
  role,
  newsletterSince,
  donationCount,
  donationTotalBdt,
}: QuickAccessProps) {
  const bn = lang === "bn";
  const hint = ROLE_HINTS[role] ?? ROLE_HINTS.donor;

  const quickLinks = [
    {
      href: "/research/fatwa",
      Icon: BookMarked,
      title: bn ? "ফতোয়া ব্যাংক" : "Fatwa Bank",
      desc: bn ? "প্রশ্ন করুন ও প্রামাণ্য জবাব পড়ুন" : "Ask questions and read evidenced answers",
    },
    {
      href: "/academics/courses",
      Icon: GraduationCap,
      title: bn ? "কোর্সসমূহ" : "Courses",
      desc: bn ? "চলমান সব কোর্স ও ভর্তি তথ্য দেখুন" : "Browse running courses and admission info",
    },
    {
      href: "/support/zakat-calculator",
      Icon: Calculator,
      title: bn ? "যাকাত ক্যালকুলেটর" : "Zakat Calculator",
      desc: bn ? "সহজে যাকাতের হিসাব করুন" : "Calculate your zakat easily",
    },
    {
      href: "/academics/downloads",
      Icon: Download,
      title: bn ? "ডাউনলোড সেন্টার" : "Download Center",
      desc: bn ? "সিলেবাস, ফর্ম ও প্রকাশনা ডাউনলোড করুন" : "Download syllabi, forms, and publications",
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-heading flex items-center gap-2.5 text-lg font-semibold">
          <span aria-hidden className="inline-block h-2 w-2 rotate-45 bg-gold" />
          {bn ? "দ্রুত প্রবেশ" : "Quick Access"}
        </h3>
        <p className="text-[13px] text-muted-foreground">{bn ? hint.bn : hint.en}</p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* ——— Newsletter subscription (live status) ——— */}
        {newsletterSince ? (
          <article className={cardBase}>
            <div className="flex items-center justify-between gap-3">
              <CardIcon Icon={MailCheck} tone="emerald" />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                <CheckCircle2 aria-hidden className="h-3 w-3" />
                {bn ? "সক্রিয়" : "Active"}
              </span>
            </div>
            <h4 className="font-heading mt-3.5 text-[15px] font-semibold">
              {bn ? "নিউজলেটার সাবস্ক্রিপশন" : "Newsletter Subscription"}
            </h4>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              {bn
                ? `আপনার ইমেইল সাবস্ক্রাইব করা আছে — যোগদান: ${formatDate(newsletterSince, lang)}`
                : `Your email is subscribed — since ${formatDate(newsletterSince, lang)}`}
            </p>
          </article>
        ) : (
          <Link href="/#newsletter" className={linkCard}>
            <div className="flex items-center justify-between gap-3">
              <CardIcon Icon={Mail} />
              <CardArrow />
            </div>
            <h4 className="font-heading mt-3.5 text-[15px] font-semibold">
              {bn ? "নিউজলেটার সাবস্ক্রিপশন" : "Newsletter Subscription"}
            </h4>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              {bn
                ? "সাপ্তাহিক আপডেট ও গুরুত্বপূর্ণ নোটিশ সরাসরি ইনবক্সে পেতে সাবস্ক্রাইব করুন"
                : "Subscribe to get weekly updates and important notices in your inbox"}
            </p>
          </Link>
        )}

        {/* ——— Donation summary (live totals) ——— */}
        {donationCount > 0 ? (
          <a href="#donation-history" className={linkCard}>
            <div className="flex items-center justify-between gap-3">
              <CardIcon Icon={HandHeart} tone="emerald" />
              <CardArrow />
            </div>
            <h4 className="font-heading mt-3.5 text-[15px] font-semibold">
              {bn ? "অনুদান সারসংক্ষেপ" : "Donation Summary"}
            </h4>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              {bn
                ? `মোট ${formatNumber(donationCount, lang)}টি অনুদান · ${formatTaka(donationTotalBdt, lang)}`
                : `${formatNumber(donationCount, lang)} donations · ${formatTaka(donationTotalBdt, lang)}`}
            </p>
          </a>
        ) : (
          <Link href="/support" className={linkCard}>
            <div className="flex items-center justify-between gap-3">
              <CardIcon Icon={HandHeart} />
              <CardArrow />
            </div>
            <h4 className="font-heading mt-3.5 text-[15px] font-semibold">
              {bn ? "অনুদান সারসংক্ষেপ" : "Donation Summary"}
            </h4>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              {bn
                ? "এখনো কোনো অনুদানের রেকর্ড নেই — প্রথম অনুদান দিয়ে শুরু করুন"
                : "No donation records yet — make your first donation"}
            </p>
          </Link>
        )}

        {/* ——— Curated quick links ——— */}
        {quickLinks.map(({ href, Icon, title, desc }) => (
          <Link key={href} href={href} className={linkCard}>
            <div className="flex items-center justify-between gap-3">
              <CardIcon Icon={Icon} />
              <CardArrow />
            </div>
            <h4 className="font-heading mt-3.5 text-[15px] font-semibold">{title}</h4>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
