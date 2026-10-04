import { ClipboardCheck, Hourglass } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { studentDevelopmentPrograms } from "@/content/courses";
import { toBnDigits } from "@/lib/format";
import { pick } from "@/types";
import type { Language } from "@/types";

/** Student Development Programs — mandatory, non-credit activities table. */
export function SdpTable({ lang }: { lang: Language }) {
  const totalHours = studentDevelopmentPrograms.reduce((sum, program) => sum + program.hours, 0);

  return (
    <Reveal>
      <div className="overflow-hidden rounded-xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-emerald-deep hover:bg-emerald-deep">
              <TableHead className="text-ivory">{lang === "bn" ? "কর্মসূচি" : "Program"}</TableHead>
              <TableHead className="text-ivory">{lang === "bn" ? "উদ্দেশ্য" : "Objective"}</TableHead>
              <TableHead className="text-ivory">{lang === "bn" ? "কার্যক্রম" : "Activities"}</TableHead>
              <TableHead className="text-ivory">{lang === "bn" ? "প্রত্যাশিত ফলাফল" : "Outcome"}</TableHead>
              <TableHead className="w-[100px] text-right text-ivory">{lang === "bn" ? "ঘণ্টা" : "Hours"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studentDevelopmentPrograms.map((program) => (
              <TableRow key={program.id}>
                <TableCell className="font-medium">{pick(program.title, lang)}</TableCell>
                <TableCell className="text-muted-foreground">{pick(program.objective, lang)}</TableCell>
                <TableCell className="text-muted-foreground">{pick(program.activities, lang)}</TableCell>
                <TableCell className="text-muted-foreground">{pick(program.outcome, lang)}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums text-gold">
                  {lang === "bn" ? toBnDigits(program.hours) : program.hours}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs">
            <ClipboardCheck aria-hidden className="h-3.5 w-3.5 text-gold" />
            {lang === "bn" ? "সব শিক্ষার্থীর জন্য বাধ্যতামূলক" : "Mandatory for all students"}
          </Badge>
          <Badge variant="outline" className="border-gold/40 bg-gold/10 text-xs font-semibold text-gold">
            {lang === "bn" ? "অ-ক্রেডিট কার্যক্রম" : "Non-credit activities"}
          </Badge>
        </div>
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Hourglass aria-hidden className="h-4 w-4 text-gold" />
          {lang === "bn" ? "মোট ঘণ্টা:" : "Total hours:"}{" "}
          <span className="tabular-nums text-gold">{lang === "bn" ? toBnDigits(totalHours) : totalHours}</span>
        </p>
      </div>
    </Reveal>
  );
}
