import { Inbox } from "lucide-react";
import { BrandWatermark } from "@/components/shared/logo";
import type { Language, LocalizedText } from "@/types";

interface EmptyStateProps {
  lang: Language;
  /** What is missing, e.g. "কোর্স" / "Course". */
  subject: LocalizedText;
  /** Optional extra hint line. */
  hint?: LocalizedText;
  /** Quiet brand watermark behind the content (default on) — the mark's
   *  low-key reappearance where the site has nothing else to say. */
  ornament?: boolean;
}

/**
 * Designed empty state for list pages whose adapter returned zero rows —
 * a centered gold-ruled card instead of a blank section, with the
 * institute's mark as a barely-there watermark behind the message.
 */
export function EmptyState({ lang, subject, hint, ornament = true }: EmptyStateProps) {
  return (
    <div className="relative mx-auto max-w-xl overflow-hidden rounded-2xl border border-dashed border-gold/40 bg-card/60 px-6 py-14 text-center">
      {ornament ? <BrandWatermark tone="emerald" className="bottom-0 right-6 h-24 opacity-[0.05]" /> : null}
      {/* relative: paints above the watermark (both positioned, DOM order) */}
      <div className="relative">
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
    </div>
  );
}
