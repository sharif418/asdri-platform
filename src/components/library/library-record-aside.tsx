import Link from "next/link";
import {
  ArrowRight,
  BookMarked,
  BookOpenText,
  Building2,
  CalendarDays,
  Download,
  ExternalLink,
  Languages,
  LibraryBig,
  Lock,
  MapPin,
} from "lucide-react";
import { langPath } from "@/lib/locale";
import { formatNumber, toBnDigits } from "@/lib/format";
import { pick, type Language } from "@/types";
import type { LibraryCardItem, LibraryItemDetail } from "@/lib/content/library";
import { Reveal } from "@/components/shared/reveal";
import { LibraryRelatedRow } from "@/components/library/library-card";
import {
  LIBRARY_TYPE_LABELS,
  libraryLanguageLabel,
  libraryReaderHref,
} from "@/components/library/library-shared";

/**
 * The record page's right rail (server component): the actions card —
 * "পড়া শুরু করুন" into the reader, ডাউনলোড, বাইরের লিংক, or the MEMBERS
 * notice + login CTA for anonymous visitors on gated items — then the
 * publication metadata and same-category related items. Extracted from the
 * page to keep both inside the 500-line house style.
 */

interface LibraryRecordAsideProps {
  lang: Language;
  item: LibraryItemDetail;
  related: LibraryCardItem[];
  /** MEMBERS items: true only when a session (any role) is present. */
  canReadFile: boolean;
}

export function LibraryRecordAside({
  lang,
  item,
  related,
  canReadFile,
}: LibraryRecordAsideProps) {
  const bn = lang === "bn";

  return (
    <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
      <Reveal>
        <div className="rounded-2xl border border-gold/25 bg-card p-5 shadow-sm">
          <h2 className="font-heading text-base font-semibold">
            {bn ? "এই আইটেমটি পড়ুন" : "Read this item"}
          </h2>

          {canReadFile ? (
            <div className="mt-4 space-y-2.5">
              {item.fileUrl ? (
                <Link
                  href={libraryReaderHref(lang, item.slug)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <BookOpenText aria-hidden className="h-4 w-4" />
                  {bn ? "পড়া শুরু করুন" : "Start reading"}
                </Link>
              ) : (
                <p className="rounded-xl border border-dashed border-border bg-parchment p-3 text-[12.5px] leading-relaxed text-muted-foreground dark:bg-secondary/40">
                  {bn
                    ? "এই আইটেমের কোনো ডিজিটাল ফাইল সংযুক্ত নেই — নিচের তথ্য ও বাইরের লিংক (থাকলে) দেখুন।"
                    : "No digital file is attached to this item — see the metadata below, or the external link when present."}
                </p>
              )}
              {item.fileUrl ? (
                <a
                  href={item.fileUrl}
                  download
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold/50 px-5 py-2.5 text-[13px] font-bold text-gold transition-colors hover:bg-gold hover:text-gold-foreground"
                >
                  <Download aria-hidden className="h-4 w-4" />
                  {bn ? "ডাউনলোড" : "Download"}
                  {item.filePages != null ? (
                    <span className="font-medium opacity-80">
                      ·{" "}
                      {bn
                        ? `${formatNumber(item.filePages, "bn")} পৃষ্ঠা`
                        : `${item.filePages} pages`}
                    </span>
                  ) : null}
                </a>
              ) : null}
              {item.externalUrl ? (
                <a
                  href={item.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:border-gold/50 hover:text-foreground"
                >
                  <ExternalLink aria-hidden className="h-4 w-4" />
                  {bn ? "বাইরের লিংক" : "External link"}
                </a>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-gold/40 bg-gold/10 p-4">
              <p className="flex items-center gap-2 text-[13px] font-bold text-gold-foreground">
                <Lock aria-hidden className="h-4 w-4" />
                {bn ? "সদস্যদের জন্য সংরক্ষিত" : "Reserved for members"}
              </p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                {bn
                  ? "এই আইটেমের পিডিএফ ও রিডার খোলার জন্য একটি অ্যাকাউন্ট প্রয়োজন — লগইন করে ফিরে আসুন।"
                  : "Reading this item's PDF needs an account — sign in and come back."}
              </p>
              <Link
                href={langPath(lang, "/login")}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-[13px] font-bold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {bn ? "লগইন করুন" : "Sign in"}
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
              <p className="mt-2 text-center text-[11.5px] text-muted-foreground">
                {bn ? "অ্যাকাউন্ট নেই? " : "No account? "}
                <Link
                  href={langPath(lang, "/register")}
                  className="font-semibold text-primary underline-offset-2 hover:underline dark:text-gold"
                >
                  {bn ? "নিবন্ধন করুন" : "Register"}
                </Link>
              </p>
            </div>
          )}
        </div>
      </Reveal>

      {/* publication metadata */}
      <Reveal>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="font-heading text-base font-semibold">
            {bn ? "প্রকাশনার তথ্য" : "Publication"}
          </h2>
          <dl className="mt-4 space-y-3 text-[13px]">
            <div className="flex items-start gap-2.5">
              <BookMarked
                aria-hidden
                className="mt-0.5 h-4 w-4 shrink-0 text-gold"
              />
              <div>
                <dt className="sr-only">{bn ? "ধরন" : "Type"}</dt>
                <dd>{pick(LIBRARY_TYPE_LABELS[item.type], lang)}</dd>
              </div>
            </div>
            {item.category ? (
              <div className="flex items-start gap-2.5">
                <LibraryBig
                  aria-hidden
                  className="mt-0.5 h-4 w-4 shrink-0 text-gold"
                />
                <div>
                  <dt className="sr-only">{bn ? "ক্যাটাগরি" : "Category"}</dt>
                  <dd>
                    <Link
                      href={langPath(
                        lang,
                        `/research/library?category=${item.category.slug}`,
                      )}
                      className="font-medium text-primary underline-offset-2 hover:underline dark:text-gold"
                    >
                      {pick(item.category.name, lang)}
                    </Link>
                  </dd>
                </div>
              </div>
            ) : null}
            <div className="flex items-start gap-2.5">
              <Languages
                aria-hidden
                className="mt-0.5 h-4 w-4 shrink-0 text-gold"
              />
              <div>
                <dt className="sr-only">{bn ? "ভাষা" : "Language"}</dt>
                <dd>{pick(libraryLanguageLabel(item.language), lang)}</dd>
              </div>
            </div>
            {item.year != null ? (
              <div className="flex items-start gap-2.5">
                <CalendarDays
                  aria-hidden
                  className="mt-0.5 h-4 w-4 shrink-0 text-gold"
                />
                <div>
                  <dt className="sr-only">{bn ? "প্রকাশকাল" : "Published"}</dt>
                  <dd className="tabular-nums">
                    {bn ? toBnDigits(item.year) : item.year}
                  </dd>
                </div>
              </div>
            ) : null}
            {item.publisher ? (
              <div className="flex items-start gap-2.5">
                <Building2
                  aria-hidden
                  className="mt-0.5 h-4 w-4 shrink-0 text-gold"
                />
                <div>
                  <dt className="sr-only">{bn ? "প্রকাশক" : "Publisher"}</dt>
                  <dd>{pick(item.publisher.name, lang)}</dd>
                </div>
              </div>
            ) : null}
            {item.publishPlaceBn ? (
              <div className="flex items-start gap-2.5">
                <MapPin
                  aria-hidden
                  className="mt-0.5 h-4 w-4 shrink-0 text-gold"
                />
                <div>
                  <dt className="sr-only">{bn ? "প্রকাশস্থান" : "Place"}</dt>
                  <dd>{item.publishPlaceBn}</dd>
                </div>
              </div>
            ) : null}
            {item.journal ? (
              <div className="flex items-start gap-2.5">
                <BookOpenText
                  aria-hidden
                  className="mt-0.5 h-4 w-4 shrink-0 text-gold"
                />
                <div>
                  <dt className="sr-only">{bn ? "জার্নাল" : "Journal"}</dt>
                  <dd>
                    <Link
                      href={langPath(
                        lang,
                        `/research/library?journal=${encodeURIComponent(item.journal.key)}`,
                      )}
                      className="font-medium text-primary underline-offset-2 hover:underline dark:text-gold"
                    >
                      {pick(item.journal.name, lang)}
                    </Link>
                  </dd>
                </div>
              </div>
            ) : null}
          </dl>
        </div>
      </Reveal>

      {/* related items */}
      {related.length > 0 ? (
        <Reveal>
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="font-heading text-base font-semibold">
              {bn ? "সম্পর্কিত আইটেম" : "Related items"}
            </h2>
            <div className="mt-4 space-y-2.5">
              {related.map((relatedItem) => (
                <LibraryRelatedRow
                  key={relatedItem.id}
                  item={relatedItem}
                  lang={lang}
                />
              ))}
            </div>
          </div>
        </Reveal>
      ) : null}
    </aside>
  );
}
