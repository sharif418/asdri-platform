import Link from "next/link";
import { ArrowRight, FileDown, LayoutTemplate, ListOrdered, MessageCircleQuestion, ScrollText } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatNumber } from "@/lib/format";

export const metadata = { title: "পেজ কনটেন্ট" };

/** Page content hub — the home page composition, FAQs and admission copy. */
export default async function AdminContentPage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "content.manage")) redirect("/admin");

  const [sectionCount, enabledCount, statCount, publishedStats, faqCount, publishedFaqs] = await Promise.all([
    db.homeSection.count(),
    db.homeSection.count({ where: { isEnabled: true } }),
    db.stat.count(),
    db.stat.count({ where: { isPublished: true } }),
    db.faq.count(),
    db.faq.count({ where: { isPublished: true } }),
  ]);

  const cards = [
    {
      href: "/admin/content/home",
      icon: LayoutTemplate,
      title: "হোম সেকশন ও পরিসংখ্যান",
      description: "হোম পেজের সেকশনগুলোর ক্রম, শিরোনাম ও সক্রিয়তা — এবং “এক নজরে” ব্যান্ডের সংখ্যাগুলো।",
      stat: `${formatNumber(enabledCount, "bn")} / ${formatNumber(sectionCount, "bn")} সেকশন সক্রিয় · ${formatNumber(publishedStats, "bn")} / ${formatNumber(statCount, "bn")} পরিসংখ্যান`,
    },
    {
      href: "/admin/content/faqs",
      icon: MessageCircleQuestion,
      title: "সচরাচর প্রশ্ন (FAQ)",
      description: "ভর্তি প্রশ্নোত্তর পেজের ক্যাটাগরি, প্রশ্ন ও উত্তর — দুই ভাষায়।",
      stat: `${formatNumber(publishedFaqs, "bn")} / ${formatNumber(faqCount, "bn")} প্রকাশিত`,
    },
    {
      href: "/admin/content/admission",
      icon: ScrollText,
      title: "ভর্তি প্রক্রিয়া ও ঘোষণাপত্র",
      description: "আবেদন ফর্মের ঘোষণাপত্র ও ভর্তি পেজের ভূমিকা — আইনি কপি সহ।",
      stat: "সেটিংসভিত্তিক কনটেন্ট",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <FileDown aria-hidden className="h-3.5 w-3.5" />
        <span>পেজ কনটেন্ট</span>
      </div>
      <h1 className="font-heading mt-1 flex items-center gap-2 text-2xl font-bold">
        <ListOrdered aria-hidden className="h-6 w-6 text-primary" />
        পেজ কনটেন্ট
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        হোম পেজের গঠন, প্রশ্নোত্তর ও ভর্তির লেখা — এই তিনটি কনটেন্ট গ্রুপ এখান থেকে সম্পাদনা হয়।
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
