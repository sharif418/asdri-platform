import Link from "next/link";
import { ArrowRight, Flag, Map, Settings, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatNumber } from "@/lib/format";

export const metadata = { title: "সাইট সেটিংস" };

/** Site settings hub — identity/contact, navigation menus and feature flags. */
export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "settings")) redirect("/admin");

  const [settingsCount, menuCount, visibleMenus, flagsCount, enabledFlags] = await Promise.all([
    db.siteSetting.count(),
    db.menuItem.count(),
    db.menuItem.count({ where: { isVisible: true } }),
    db.featureFlag.count(),
    db.featureFlag.count({ where: { isEnabled: true } }),
  ]);

  const cards = [
    {
      href: "/admin/settings/identity",
      icon: Map,
      title: "পরিচিতি ও যোগাযোগ",
      description: "ইনস্টিটিউটের নাম, ঠিকানা, ফোন, ইমেইল, সোশ্যাল লিংক, পেমেন্ট চ্যানেল ও যাকাত হার।",
      stat: `${formatNumber(settingsCount, "bn")}টি সেটিংস কী`,
    },
    {
      href: "/admin/settings/menus",
      icon: Settings,
      title: "নেভিগেশন মেনু",
      description: "হেডার, ইউটিলিটি বার ও ফুটারের মেনু — লেবেল, লিংক, ক্রম, দৃশ্যমানতা ও ফ্ল্যাগ।",
      stat: `${formatNumber(visibleMenus, "bn")} / ${formatNumber(menuCount, "bn")} আইটেম দৃশ্যমান`,
    },
    {
      href: "/admin/settings/flags",
      icon: Flag,
      title: "ফিচার ফ্ল্যাগ",
      description: "মডিউল চালু/বন্ধ — বন্ধ মডিউল নেভিগেশন, সাইটম্যাপ, সার্চ ও পাবলিক API থেকে সরে যায়।",
      stat: `${formatNumber(enabledFlags, "bn")} / ${formatNumber(flagsCount, "bn")} মডিউল চালু`,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <Wallet aria-hidden className="h-3.5 w-3.5" />
        <span>সাইট সেটিংস</span>
      </div>
      <h1 className="font-heading mt-1 flex items-center gap-2 text-2xl font-bold">
        <Settings aria-hidden className="h-6 w-6 text-primary" />
        সাইট সেটিংস
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        প্রতিষ্ঠানের পরিচয়, যোগাযোগ, নেভিগেশন ও মডিউল নিয়ন্ত্রণ — সব ডেটাবেসে, সবই এখান থেকে সম্পাদনাযোগ্য।
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group flex flex-col rounded-2xl border bg-card p-5 shadow-sm transition-all hover:border-gold/50 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <card.icon aria-hidden className="h-5 w-5" />
              </span>
              <ArrowRight aria-hidden className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-gold" />
            </div>
            <h2 className="font-heading mt-4 text-base font-bold">{card.title}</h2>
            <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-muted-foreground">{card.description}</p>
            <p className="mt-4 rounded-lg bg-secondary/40 px-2.5 py-1.5 text-[11.5px] font-semibold text-muted-foreground">
              {card.stat}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
