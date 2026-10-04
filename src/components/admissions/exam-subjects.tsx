import { BookOpenText, Languages, Newspaper } from "lucide-react";
import { pick } from "@/types";
import type { Language, LocalizedText } from "@/types";

interface ExamSubject {
  id: string;
  icon: "arabic" | "islamic" | "contemporary";
  title: LocalizedText;
  description: LocalizedText;
}

const examSubjects: ExamSubject[] = [
  {
    id: "basic-arabic",
    icon: "arabic",
    title: { bn: "বেসিক আরবী", en: "Basic Arabic" },
    description: {
      bn: "হরফ চেনা, সহজ বাক্য গঠন ও প্রাথমিক অনুবাদ — কোর্সভেদে স্তর নির্ধারিত হয়।",
      en: "Letters, simple sentence formation, and elementary translation — level depends on the course.",
    },
  },
  {
    id: "general-islamic",
    icon: "islamic",
    title: { bn: "সাধারণ ইসলামিয়াত", en: "General Islamic Studies" },
    description: {
      bn: "ঈমান, ইবাদত, সীরাত ও দৈনন্দিন ফিকহের মৌলিক ধারণা — মাধ্যমিক স্তরের প্রশ্ন।",
      en: "Foundational concepts of faith, worship, seerah, and everyday fiqh — intermediate-level questions.",
    },
  },
  {
    id: "contemporary",
    icon: "contemporary",
    title: { bn: "সমকালীন জ্ঞান", en: "Contemporary Knowledge" },
    description: {
      bn: "সাম্প্রতিক ঘটনাবলি, বিশ্ব পরিস্থিতি ও মুসলিম উম্মাহর চ্যালেঞ্জ সম্পর্কে সাধারণ জ্ঞান।",
      en: "General awareness of current affairs, the world order, and challenges facing the ummah.",
    },
  },
];

const subjectIcons = { arabic: Languages, islamic: BookOpenText, contemporary: Newspaper } as const;

/** Written-test subject hints — what to prepare before sitting the exam. */
export function ExamSubjects({ lang }: { lang: Language }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {examSubjects.map((subject) => {
        const Icon = subjectIcons[subject.icon];
        return (
          <article
            key={subject.id}
            className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md sm:p-6"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15 text-gold">
              <Icon aria-hidden className="h-5 w-5" />
            </div>
            <h3 className="font-heading mt-4 text-base font-semibold sm:text-lg">
              {pick(subject.title, lang)}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {pick(subject.description, lang)}
            </p>
          </article>
        );
      })}
    </div>
  );
}
