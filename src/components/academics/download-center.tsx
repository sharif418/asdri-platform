"use client";

import { useMemo, useState } from "react";
import { Download, FileArchive, FileText, FileType2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { downloadItems } from "@/content/research";
import { cn } from "@/lib/utils";
import { pick } from "@/types";
import type { DownloadItem, Language } from "@/types";

const fileIcons: Record<DownloadItem["fileType"], LucideIcon> = {
  PDF: FileType2,
  DOC: FileText,
  ZIP: FileArchive,
};

const categories: { value: DownloadItem["category"] | "all"; label: { bn: string; en: string } }[] = [
  { value: "all", label: { bn: "সবগুলো", en: "All" } },
  { value: "syllabus", label: { bn: "সিলেবাস", en: "Syllabus" } },
  { value: "form", label: { bn: "ফর্ম", en: "Forms" } },
  { value: "dawah", label: { bn: "দাওয়াহ ম্যাটেরিয়ালস", en: "Dawah Materials" } },
  { value: "prospectus", label: { bn: "প্রসপেক্টাস", en: "Prospectus" } },
];

/** Download center — category-filtered list with file-type badges + sizes. */
export function DownloadCenter({ lang }: { lang: Language }) {
  const [activeCategory, setActiveCategory] = useState<DownloadItem["category"] | "all">("all");

  const filtered = useMemo(
    () => (activeCategory === "all" ? downloadItems : downloadItems.filter((item) => item.category === activeCategory)),
    [activeCategory],
  );

  return (
    <div>
      <div
        role="tablist"
        aria-label={lang === "bn" ? "ডাউনলোড বিভাগ" : "Download categories"}
        className="scrollbar-thin flex flex-wrap items-center gap-2 overflow-x-auto pb-2"
      >
        {categories.map((category) => {
          const isActive = activeCategory === category.value;
          const count =
            category.value === "all"
              ? downloadItems.length
              : downloadItems.filter((item) => item.category === category.value).length;
          return (
            <button
              key={category.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveCategory(category.value)}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                isActive
                  ? "border-gold/60 bg-emerald-deep text-ivory shadow-md"
                  : "border-border bg-card text-muted-foreground hover:border-gold/40 hover:text-foreground",
              )}
            >
              {pick(category.label, lang)}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                  isActive ? "bg-gold/20 text-gold" : "bg-secondary text-secondary-foreground",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <ul className="mt-8 space-y-4">
        {filtered.map((item) => {
          const FileIcon = fileIcons[item.fileType] ?? FileText;
          return (
            <li key={item.id}>
              <article className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md hover:shadow-emerald-950/5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-700 to-emerald-900 text-gold shadow-sm">
                    <FileIcon aria-hidden className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-heading text-[15px] font-semibold leading-snug">{pick(item.title, lang)}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
                        {item.fileType}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{item.sizeLabel}</span>
                      <span aria-hidden className="text-muted-foreground/50">
                        •
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {pick(
                          categories.find((c) => c.value === item.category)?.label ?? { bn: "", en: "" },
                          lang,
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <Button asChild size="sm" variant="outline" className="w-full shrink-0 border-gold/50 hover:bg-gold/10 hover:text-gold sm:w-auto">
                  <a href={item.url} download>
                    <Download aria-hidden className="h-4 w-4" />
                    {lang === "bn" ? "ডাউনলোড" : "Download"}
                  </a>
                </Button>
              </article>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          {lang === "bn" ? "এই বিভাগে কোনো ফাইল নেই।" : "No files in this category."}
        </p>
      ) : null}
    </div>
  );
}
