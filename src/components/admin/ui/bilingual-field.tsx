"use client";

import { useState, type ReactNode } from "react";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bilingual field wrapper — বাংলা / English tabs above the input pair.
 * Every visitor-facing field in the admin uses this so content is always
 * editable in both languages.
 */
export function BilingualField({
  label,
  bnLabel = "বাংলা",
  enLabel = "English",
  required,
  children, // render prop: receives { active } — render bn/en inputs side by side or stacked
  stacked = true,
  hint,
}: {
  label: string;
  bnLabel?: string;
  enLabel?: string;
  required?: boolean;
  children: (active: "bn" | "en") => ReactNode;
  stacked?: boolean;
  hint?: string;
}) {
  const [active, setActive] = useState<"bn" | "en">("bn");

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-semibold">
          {label}
          {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        </label>
        <div
          role="tablist"
          aria-label={`${label} — ভাষা নির্বাচন`}
          className="inline-flex rounded-md border bg-secondary/40 p-0.5"
        >
          {(["bn", "en"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              role="tab"
              aria-selected={active === lang}
              onClick={() => setActive(lang)}
              className={cn(
                "rounded px-2.5 py-0.5 text-[11.5px] font-semibold transition-colors",
                active === lang ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {lang === "bn" ? bnLabel : enLabel}
            </button>
          ))}
        </div>
      </div>
      <div className={cn(stacked ? "space-y-2" : "grid gap-2 sm:grid-cols-2")}>{children(active)}</div>
      {hint ? <p className="text-[11.5px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** Small bilingual badge showing which language has content. */
export function LanguageStatus({ hasBn, hasEn }: { hasBn: boolean; hasEn: boolean }) {
  return (
    <span className="inline-flex items-center gap-1" title="ভাষার অবস্থা">
      <Languages aria-hidden className="h-3 w-3 text-muted-foreground" />
      <span className={cn("text-[10px] font-bold", hasBn ? "text-primary" : "text-destructive")}>বাং</span>
      <span className={cn("text-[10px] font-bold", hasEn ? "text-primary" : "text-muted-foreground/50")}>EN</span>
    </span>
  );
}
