import Link from "next/link";
import { BookMarked, Newspaper, ScrollText } from "lucide-react";

/**
 * Alumni portal home (v1): the institute's public life — notices,
 * publications, the library — plus an honest note that the alumni register
 * is office-curated. Deeper alumni features (batch directory, update-contact
 * form) are recorded as follow-ups in GAPS.
 */
export function AlumniHome() {
  const cards = [
    {
      href: "/notices",
      icon: Newspaper,
      title: "নোটিশ বোর্ড",
      description: "ইনস্টিটিউটের সর্বশেষ ঘোষণা ও কার্যক্রম",
    },
    {
      href: "/research/publications",
      icon: BookMarked,
      title: "প্রকাশনা",
      description: "জার্নাল, গবেষণা পত্রিকা ও অন্যান্য প্রকাশনা",
    },
    {
      href: "/research/library",
      icon: ScrollText,
      title: "লাইব্রেরি",
      description: "ডিজিটাল ক্যাটালগ ও পাঠ",
    },
  ];

  return (
    <div className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md"
          >
            <card.icon aria-hidden className="h-6 w-6 text-gold" />
            <h2 className="mt-3 text-[15.5px] font-bold group-hover:text-primary">{card.title}</h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{card.description}</p>
          </Link>
        ))}
      </div>
      <p className="rounded-2xl border border-dashed border-gold/40 bg-card px-5 py-4 text-center text-[12.5px] leading-relaxed text-muted-foreground">
        প্রাক্তনদের ব্যাচ ডিরেক্টরি ও তথ্য হালনাগাদ ফর্ম পরবর্তী ধাপে যুক্ত হবে — আপনার সর্বশেষ
        তথ্য অফিসে জানাতে ভুলবেন না।
      </p>
    </div>
  );
}
