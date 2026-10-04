import Link from "next/link";
import { BookMarked, FileQuestion, FolderKanban, LibraryBig, MessagesSquare } from "lucide-react";
import { pick } from "@/types";
import type { Language, LocalizedText } from "@/types";
import { langPath } from "@/lib/locale";

interface ResearchLink {
  href: string;
  icon: typeof LibraryBig;
  title: LocalizedText;
  description: LocalizedText;
}

/**
 * The five research sub-destinations rendered as a linked card grid —
 * used on the research overview page.
 */
export function ResearchLinks({ lang }: { lang: Language }) {
  const links: ResearchLink[] = [
    {
      href: "/research/library",
      icon: LibraryBig,
      title: { bn: "লাইব্রেরি ও জার্নাল", en: "Library & Journals" },
      description: {
        bn: "জার্নাল ও পত্রিকার তালিকা, মেটাডেটা ও সাইটেশন জেনারেটর — APA/Chicago/MLA।",
        en: "Journal catalog with metadata and an APA/Chicago/MLA citation generator.",
      },
    },
    {
      href: "/research/projects",
      icon: FolderKanban,
      title: { bn: "গবেষণা প্রকল্প ও ফেলোশিপ", en: "Projects & Fellowships" },
      description: {
        bn: "চলমান প্রকল্পের অগ্রগতি, কল ফর পেপার্স ও ফেলোশিপ ঘোষণা।",
        en: "Ongoing project progress, call for papers, and fellowship notices.",
      },
    },
    {
      href: "/research/publications",
      icon: BookMarked,
      title: { bn: "প্রকাশনা ও গ্রন্থ", en: "Publications & Books" },
      description: {
        bn: "শিক্ষক-গবেষকদের জার্নাল প্রবন্ধ, গ্রন্থ ও রিসার্চ পেপারের সংগ্রহ।",
        en: "Faculty journal articles, books, and research papers.",
      },
    },
    {
      href: "/research/clarifications",
      icon: MessagesSquare,
      title: { bn: "সংশয় নিরসন ও জবাব", en: "Clarifications & Refutations" },
      description: {
        bn: "সায়েন্টিজম, সেকুলারিজম, নাস্তিক্যবাদসহ ছয়টি খাতে বুদ্ধিবৃত্তিক জবাব।",
        en: "Intellectual responses across six tracks — scientism, secularism, atheism, and more.",
      },
    },
    {
      href: "/research/fatwa",
      icon: FileQuestion,
      title: { bn: "ফতোয়া ও অনলাইন জিজ্ঞাসা", en: "Fatwa & Online Queries" },
      description: {
        bn: "সার্চেবল ফতোয়া ব্যাংক — ইবাদত, লেনদেন, আকীদা, পারিবারিক ও সমকালীন বিষয়ে।",
        en: "A searchable fatwa bank — worship, transactions, creed, family, and contemporary issues.",
      },
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {links.map((link) => (
        <Link
          key={link.href}
          href={langPath(lang, link.href)}
          className="group flex h-full flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-deep text-gold">
            <link.icon aria-hidden className="h-5 w-5" />
          </div>
          <h3 className="font-heading mt-4 text-base font-semibold transition-colors group-hover:text-primary sm:text-lg">
            {pick(link.title, lang)}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pick(link.description, lang)}</p>
          <span className="mt-auto pt-4 text-[13px] font-semibold text-gold">
            {lang === "bn" ? "প্রবেশ করুন →" : "Enter →"}
          </span>
        </Link>
      ))}
    </div>
  );
}
