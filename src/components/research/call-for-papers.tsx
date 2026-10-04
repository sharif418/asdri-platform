import { CalendarClock, CheckCircle2, Mail } from "lucide-react";
import { callForPapers } from "@/content/research";
import { formatDate, toBnDigits } from "@/lib/format";
import { pick } from "@/types";
import type { Language, LocalizedText } from "@/types";

/**
 * Call for Papers panel — deadline countdown label, submission
 * guidelines, and the research email. Shown on the projects page.
 */
export function CallForPapers({ lang }: { lang: Language }) {
  if (!callForPapers.active) return null;

  const deadlineDate = new Date(callForPapers.deadline);
  const daysLeft = Math.max(0, Math.ceil((deadlineDate.getTime() - Date.now()) / 86400000));

  const fellowshipNote: LocalizedText = {
    bn: "গবেষণা ফেলোশিপ: চলমান প্রকল্পসমূহে নিয়মিত গবেষণা-সহকারী ও ফেলো নিয়োগ দেওয়া হয়। আগ্রহী আলেম ও গবেষকরা সিভি সহ ইমেইল করতে পারেন — ফেলোশিপ বিজ্ঞপ্তি নোটিশ বোর্ডে প্রকাশিত হয়।",
    en: "Research fellowship: ongoing projects regularly induct research assistants and fellows. Interested scholars may email their CV — fellowship notices are published on the notice board.",
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-gold/40 bg-card shadow-lg">
      <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-gold-gradient" />
      <div className="grid lg:grid-cols-5">
        {/* deadline panel */}
        <div className="relative overflow-hidden bg-emerald-deep p-7 text-ivory sm:p-9 lg:col-span-2">
          <div aria-hidden className="pattern-lattice-light absolute inset-0" />
          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold">
              {lang === "bn" ? "কল ফর পেপার্স" : "Call for Papers"}
            </p>
            <h3 className="font-heading mt-3 text-xl font-semibold leading-snug sm:text-2xl">
              {pick(callForPapers.title, lang)}
            </h3>

            <div className="mt-7 rounded-2xl border border-gold/40 bg-gold/10 p-5 text-center backdrop-blur">
              <p className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-gold/90">
                <CalendarClock aria-hidden className="h-3.5 w-3.5" />
                {lang === "bn" ? "জমা দেওয়ার শেষ তারিখ" : "Submission Deadline"}
              </p>
              <p className="font-heading mt-2 text-lg font-bold text-ivory">
                {formatDate(callForPapers.deadline, lang)}
              </p>
              <p className="mt-1.5 text-[12px] font-medium text-ivory/70">
                {lang === "bn"
                  ? `বাকি সময় আনুমানিক ${toBnDigits(daysLeft)} দিন`
                  : `Approximately ${daysLeft} days remaining`}
              </p>
            </div>

            <a
              href="mailto:research@assunnah-institute.org"
              className="mt-6 flex items-center gap-2.5 rounded-xl border border-ivory/20 bg-white/[0.06] p-4 text-sm font-semibold text-gold transition-colors hover:bg-white/10"
            >
              <Mail aria-hidden className="h-4 w-4 shrink-0" />
              research@assunnah-institute.org
            </a>
          </div>
        </div>

        {/* guidelines */}
        <div className="p-7 sm:p-9 lg:col-span-3">
          <h4 className="font-heading text-base font-semibold sm:text-lg">
            {lang === "bn" ? "লেখা জমার নির্দেশিকা" : "Submission Guidelines"}
          </h4>
          <ul className="mt-5 space-y-3.5">
            {callForPapers.guidelines.map((guideline, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle2 aria-hidden className="mt-0.5 h-4.5 w-4.5 shrink-0 text-gold" />
                <span className="text-sm leading-relaxed text-muted-foreground">{pick(guideline, lang)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7 rounded-xl border border-dashed bg-parchment p-4">
            <p className="text-[13px] leading-relaxed text-muted-foreground">{pick(fellowshipNote, lang)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
