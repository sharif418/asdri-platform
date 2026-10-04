"use client";

import { Check, MapPin, PenLine } from "lucide-react";
import { sponsorStudents } from "@/content/media";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatTaka } from "@/lib/format";
import { pick } from "@/types";
import type { Language } from "@/types";
import { cn } from "@/lib/utils";

interface SponsorPickerProps {
  value: string;
  lang: Language;
  onChange: (ref: string) => void;
  onPickStudent: (monthlyCost: number) => void;
}

/**
 * Privacy-protected sponsor list: coded student cards (no names/photos) plus
 * a manual reference input for donors who already know a student's code.
 */
export function SponsorPicker({ value, lang, onChange, onPickStudent }: SponsorPickerProps) {
  const bn = lang === "bn";

  return (
    <div className="rounded-xl border border-dashed border-gold/50 bg-gold/[0.06] p-4 sm:p-5">
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        {bn
          ? "নিচের গোপনীয়তা-সংরক্ষিত তালিকা থেকে একজন শিক্ষার্থী বেছে নিন — শিক্ষার্থীর পরিচয় গোপন রেখে কোড নম্বর দেখানো হয়। নির্দিষ্ট কারো স্পন্সর নিতে চাইলে কোডটি হাতে লিখেও দিতে পারেন।"
          : "Pick a student from the privacy-protected coded list below — identities stay confidential. You may also type a student code manually if you already sponsor someone specific."}
      </p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2" aria-label={bn ? "স্পন্সরযোগ্য শিক্ষার্থী" : "Sponsorable students"}>
        {sponsorStudents.map((student) => {
          const isSelected = value.trim().toUpperCase() === student.id;
          return (
            <li key={student.id}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  onChange(student.id);
                  onPickStudent(student.monthlyCost);
                }}
                className={cn(
                  "flex h-full w-full flex-col rounded-lg border bg-card p-3.5 text-left transition-all",
                  "hover:border-gold/60 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
                  isSelected ? "border-gold/70 ring-2 ring-gold/40" : "border-border",
                )}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[12px] font-bold tracking-wide text-primary">
                    {student.id}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                      student.needLevel === "high"
                        ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                        : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
                    )}
                  >
                    {student.needLevel === "high"
                      ? bn
                        ? "উচ্চ প্রয়োজন"
                        : "High need"
                      : bn
                        ? "মাঝারি প্রয়োজন"
                        : "Medium need"}
                  </span>
                </span>

                <span className="mt-2 text-[13px] font-medium">{pick(student.classYear, lang)}</span>
                <span className="mt-0.5 flex items-center gap-1 text-[12px] text-muted-foreground">
                  <MapPin aria-hidden className="h-3 w-3" />
                  {pick(student.district, lang)}
                </span>

                <span className="mt-2.5 flex w-full items-center justify-between gap-2 border-t border-dashed pt-2.5">
                  <span className="text-[12px] text-muted-foreground">
                    {bn ? "মাসিক ব্যয়" : "Monthly cost"}:{" "}
                    <span className="font-semibold text-foreground">{formatTaka(student.monthlyCost, lang)}</span>
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                      isSelected
                        ? "bg-gold text-gold-foreground"
                        : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
                    )}
                  >
                    {isSelected ? (
                      <>
                        <Check aria-hidden className="h-3 w-3" />
                        {bn ? "নির্বাচিত" : "Selected"}
                      </>
                    ) : (
                      bn ? "স্পন্সর করুন" : "Sponsor"
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 space-y-1.5">
        <Label htmlFor="student-ref" className="flex items-center gap-1.5 text-[13px]">
          <PenLine aria-hidden className="h-3.5 w-3.5 text-gold" />
          {bn ? "শিক্ষার্থীর কোড নিজে লিখুন" : "Enter a student code manually"}
          <span className="text-[11px] font-normal text-muted-foreground">({bn ? "ঐচ্ছিক" : "optional"})</span>
        </Label>
        <Input
          id="student-ref"
          dir="ltr"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={bn ? "যেমন: AS-101" : "e.g. AS-101"}
          maxLength={40}
          className="max-w-56 font-mono uppercase"
        />
      </div>
    </div>
  );
}
