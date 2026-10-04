import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { getLang } from "@/lib/i18n-server";

/** Branded 404 for the admin area (e.g. a notice id that no longer exists). */
export default async function AdminNotFound() {
  const lang = await getLang();
  const bn = lang === "bn";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span aria-hidden className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/15">
        <Compass className="h-8 w-8 text-gold" />
      </span>
      <h1 className="font-heading mt-5 text-2xl font-bold">{bn ? "পৃষ্ঠাটি পাওয়া যায়নি" : "Page not found"}</h1>
      <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-muted-foreground">
        {bn
          ? "আপনি যে রেকর্ডটি খুঁজছেন সেটি হয় মুছে ফেলা হয়েছে, নয়তো লিংকটি ভুল।"
          : "The record you are looking for was either deleted or the link is incorrect."}
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/admin"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 text-[13.5px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          {bn ? "ড্যাশবোর্ডে ফিরে যান" : "Back to dashboard"}
        </Link>
        <Link
          href="/admin/notices"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-6 text-[13.5px] font-bold text-gold transition-colors hover:bg-gold hover:text-gold-foreground"
        >
          {bn ? "নোটিশ তালিকা" : "Notice list"}
        </Link>
      </div>
    </div>
  );
}
