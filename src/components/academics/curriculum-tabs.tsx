"use client";

import { BookOpen, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toBnDigits } from "@/lib/format";
import { pick } from "@/types";
import type { CurriculumSemester, Language } from "@/types";
import { cn } from "@/lib/utils";

interface CurriculumTabsProps {
  semesters: CurriculumSemester[];
  lang: Language;
}

function fmtNum(value: number, lang: Language): string {
  return lang === "bn" ? toBnDigits(value) : String(value);
}

/**
 * Curriculum explorer — one tab per semester/section, each rendering a
 * shadcn Table of course code → title (+ modules) → credits → marks.
 */
export function CurriculumTabs({ semesters, lang }: CurriculumTabsProps) {
  return (
    <Tabs defaultValue={semesters[0]?.label.en} className="w-full">
      <TabsList
        aria-label={lang === "bn" ? "সেমিস্টার নির্বাচন" : "Select semester"}
        className="scrollbar-thin h-auto max-w-full flex-wrap justify-start gap-1 overflow-x-auto py-1"
      >
        {semesters.map((semester) => (
          <TabsTrigger key={semester.label.en} value={semester.label.en} className="gap-1.5 px-4 py-1.5">
            {pick(semester.label, lang)}
            <span className="rounded-full bg-secondary px-1.5 py-px text-[10px] font-semibold tabular-nums text-secondary-foreground">
              {lang === "bn" ? toBnDigits(semester.courses.length) : semester.courses.length}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {semesters.map((semester) => (
        <TabsContent key={semester.label.en} value={semester.label.en} className="mt-4">
          {semester.note ? (
            <p className="mb-4 flex items-start gap-2.5 rounded-lg border border-gold/30 bg-gold/10 p-4 text-sm leading-relaxed text-foreground/85">
              <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <span>{pick(semester.note, lang)}</span>
            </p>
          ) : null}

          <div className="overflow-hidden rounded-xl border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-emerald-deep hover:bg-emerald-deep">
                  <TableHead className="w-[130px] text-ivory">{lang === "bn" ? "কোর্স কোড" : "Code"}</TableHead>
                  <TableHead className="text-ivory">{lang === "bn" ? "কোর্সের শিরোনাম ও মডিউল" : "Course Title & Modules"}</TableHead>
                  <TableHead className="w-[90px] text-right text-ivory">{lang === "bn" ? "ক্রেডিট" : "Credits"}</TableHead>
                  <TableHead className="w-[90px] text-right text-ivory">{lang === "bn" ? "মার্কস" : "Marks"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {semester.courses.map((course) => (
                  <TableRow key={course.code}>
                    <TableCell className="whitespace-nowrap font-mono text-xs font-semibold text-primary">
                      {course.code}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{pick(course.title, lang)}</span>
                      {course.modules.length > 0 ? (
                        <ul className="mt-1.5 space-y-0.5">
                          {course.modules.map((module, moduleIndex) => (
                            <li key={`${course.code}-m${moduleIndex}`} className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
                              <BookOpen aria-hidden className="mt-0.5 h-3 w-3 shrink-0 text-gold/80" />
                              {pick(module.name, lang)}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {course.credits > 0 ? fmtNum(course.credits, lang) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {course.marks > 0 ? fmtNum(course.marks, lang) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
            {semester.totalCredits > 0 ? (
              <Badge variant="secondary" className={cn("gap-1.5 px-3 py-1.5 text-xs")}>
                {lang === "bn" ? "মোট ক্রেডিট" : "Total Credits"}:
                <span className="font-bold tabular-nums">{fmtNum(semester.totalCredits, lang)}</span>
              </Badge>
            ) : null}
            {semester.totalMarks > 0 ? (
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs">
                {lang === "bn" ? "মোট মার্কস" : "Total Marks"}:
                <span className="font-bold tabular-nums">{fmtNum(semester.totalMarks, lang)}</span>
              </Badge>
            ) : null}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
