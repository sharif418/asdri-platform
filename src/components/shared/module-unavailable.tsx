import Link from "next/link";
import { Compass, type LucideIcon } from "lucide-react";
import type { Lang } from "@/lib/locale";
import { langPath } from "@/lib/locale";

/**
 * Designed unavailable-state for a module the institute has switched off
 * (feature flag). Renders instead of the module's content everywhere the
 * flag is consulted — page, notFound-style framing, same craft.
 */
export function ModuleUnavailable({
  lang,
  moduleLabelBn,
  moduleLabelEn,
  icon: Icon = Compass,
}: {
  lang: Lang;
  moduleLabelBn: string;
  moduleLabelEn: string;
  icon?: LucideIcon;
}) {
  const isBn = lang === "bn";
  return (
    <div className="container-site py-16 sm:py-24">
      <div className="mx-auto max-w-md rounded-3xl border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10 text-gold">
          <Icon aria-hidden className="h-7 w-7" />
        </span>
        <h1 className="font-heading mt-5 text-2xl font-bold text-balance">
          {isBn ? `${moduleLabelBn} এখন সাময়িকভাবে বন্ধ আছে` : `${moduleLabelEn} is temporarily unavailable`}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {isBn
            ? "ইনস্টিটিউট এই অংশটি সাময়িকভাবে সরিয়ে রেখেছে। অদ্যাবধি জানার জন্য আমাদের নোটিশ বোর্ড দেখুন বা সরাসরি যোগাযোগ করুন।"
            : "The institute has temporarily disabled this section. Please check the notice board or contact us directly in the meantime."}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link
            href={langPath(lang, "/notices")}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {isBn ? "নোটিশ বোর্ড" : "Notice board"}
          </Link>
          <Link
            href={langPath(lang, "/contact")}
            className="rounded-lg border border-primary/30 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            {isBn ? "যোগাযোগ করুন" : "Contact us"}
          </Link>
        </div>
      </div>
    </div>
  );
}
