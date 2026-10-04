import { Inbox } from "lucide-react";
import type { Language, LocalizedText } from "@/types";

interface EmptyStateProps {
  lang: Language;
  /** What is missing, e.g. "কোর্স" / "Course". */
  subject: LocalizedText;
  /** Optional extra hint line. */
  hint?: LocalizedText;
}

/**
 * Designed empty state for list pages whose adapter returned zero rows —
 * a centered gold-ruled card instead of a blank section.
 */
export function EmptyState({ lang, subject, hint }: EmptyStateProps) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-gold/40 bg-card/60 px-6 py-14 text-center">
      <span
        aria-hidden
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold"
      >
        <Inbox className="h-7 w-7" />
      </span>
      <p className="font-heading text-base font-semibold text-foreground">
        {lang === "bn" ? `এখনো কোনো ${subject.bn} প্রকাশিত হয়নি` : `No ${subject.en} published yet`}
      </p>
      {hint ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{lang === "bn" ? hint.bn : hint.en}</p>
      ) : null}
    </div>
  );
}
