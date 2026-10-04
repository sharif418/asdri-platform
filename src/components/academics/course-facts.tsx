import Link from "next/link";
import { ArrowRight, BedDouble, Clock3, ListChecks, ScrollText, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { pick } from "@/types";
import type { Course, Language } from "@/types";

/** Key-facts sidebar for the course detail page. */
export function CourseFacts({ course, lang }: { course: Course; lang: Language }) {
  const facts = [
    {
      icon: ScrollText,
      label: { bn: "কোর্সের ধরন", en: "Course Type" },
      value: course.details.kind,
    },
    {
      icon: Clock3,
      label: { bn: "মেয়াদ", en: "Duration" },
      value: course.details.duration,
    },
    {
      icon: BedDouble,
      label: { bn: "আবাসন", en: "Accommodation" },
      value: course.details.accommodation,
    },
  ];

  return (
    <aside aria-label={lang === "bn" ? "কোর্সের মূল তথ্য" : "Course key facts"} className="lg:sticky lg:top-24">
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="bg-emerald-deep px-6 py-5">
          <h2 className="font-heading text-lg font-semibold text-ivory">
            {lang === "bn" ? "এক নজরে কোর্স" : "Course at a Glance"}
          </h2>
        </div>

        <div className="space-y-5 p-6">
          {facts.map((fact) => (
            <div key={fact.label.en} className="flex items-start gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
                <fact.icon aria-hidden className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {pick(fact.label, lang)}
                </p>
                <p className="mt-1 text-sm font-medium leading-relaxed">{pick(fact.value, lang)}</p>
              </div>
            </div>
          ))}

          <Separator />

          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
              <UserCheck aria-hidden className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {lang === "bn" ? "ভর্তির যোগ্যতা" : "Eligibility"}
              </p>
              <ul className="mt-2 space-y-2">
                {course.details.eligibility.map((item, index) => (
                  <li key={`eligibility-${index}`} className="flex items-start gap-2 text-sm leading-relaxed">
                    <ListChecks aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                    <span>{pick(item, lang)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Button
            asChild
            size="lg"
            className="bg-gold-gradient w-full font-semibold text-gold-foreground shadow-md hover:opacity-95"
          >
            <Link href="/admissions">
              {lang === "bn" ? "ভর্তির আবেদন করুন" : "Apply for Admission"}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </aside>
  );
}
