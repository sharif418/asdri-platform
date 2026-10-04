import { GraduationCap, HeartHandshake, MicVocal, Network, PenLine, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { StatCounter } from "@/components/shared/stat-counter";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { alumniEngagement } from "@/content/about";
import { alumniBatches } from "@/content/media";
import { toBnDigits } from "@/lib/format";
import { pick } from "@/types";
import type { Language } from "@/types";

const engagementIcons: Record<string, LucideIcon> = {
  "pen-line": PenLine,
  "mic-vocal": MicVocal,
  network: Network,
  "heart-handshake": HeartHandshake,
};

/** Headline counters for the alumni page. */
export function AlumniSummary({ lang, totalAlumni }: { lang: Language; totalAlumni: number }) {
  const totalBatchStudents = alumniBatches.reduce(
    (sum, program) => sum + program.batches.reduce((s, b) => s + b.count, 0),
    0,
  );
  const completedBatches = alumniBatches.reduce((sum, program) => sum + program.batches.length, 0);

  const figures = [
    { value: totalAlumni, suffix: "+" as const, label: { bn: "সফল অ্যালামনাই (সব কার্যক্রম)", en: "Successful alumni (all programs)" }, icon: GraduationCap },
    { value: totalBatchStudents, suffix: "" as const, label: { bn: "তালিকাভুক্ত ব্যাচ শিক্ষার্থী", en: "Listed batch graduates" }, icon: Users },
    { value: completedBatches, suffix: "" as const, label: { bn: "সম্পন্ন ব্যাচ", en: "Completed batches" }, icon: GraduationCap },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {figures.map((figure, index) => (
        <Reveal key={figure.label.en} delay={index * 0.1}>
          <article className="flex items-center gap-4 rounded-xl border bg-card p-6 shadow-sm">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-700 to-emerald-900 text-gold shadow-md">
              <figure.icon aria-hidden className="h-6 w-6" />
            </span>
            <div>
              <p className="font-heading text-3xl font-semibold text-foreground">
                <StatCounter value={figure.value} suffix={figure.suffix} lang={lang} />
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{pick(figure.label, lang)}</p>
            </div>
          </article>
        </Reveal>
      ))}
    </div>
  );
}

/** Program-wise batch statistics table. */
export function AlumniBatchTable({ lang }: { lang: Language }) {
  const total = alumniBatches.reduce((sum, program) => sum + program.batches.reduce((s, b) => s + b.count, 0), 0);

  return (
    <Reveal>
      <div className="overflow-hidden rounded-xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-emerald-deep hover:bg-emerald-deep">
              <TableHead className="text-ivory">{lang === "bn" ? "কর্মসূচি" : "Program"}</TableHead>
              <TableHead className="text-ivory">{lang === "bn" ? "ব্যাচ" : "Batch"}</TableHead>
              <TableHead className="text-right text-ivory">{lang === "bn" ? "শিক্ষার্থী" : "Graduates"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alumniBatches.map((program) =>
              program.batches.map((batch, batchIndex) => (
                <TableRow key={`${program.program.en}-${batch.batch.en}`}>
                  <TableCell className={batchIndex === 0 ? "font-medium" : "text-muted-foreground"}>
                    {batchIndex === 0 ? pick(program.program, lang) : <span className="sr-only">{pick(program.program, lang)}</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{pick(batch.batch, lang)}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {lang === "bn" ? toBnDigits(batch.count) : batch.count}
                  </TableCell>
                </TableRow>
              )),
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2} className="font-semibold">
                {lang === "bn" ? "তালিকাভুক্ত ব্যাচের মোট শিক্ষার্থী" : "Total graduates of listed batches"}
              </TableCell>
              <TableCell className="text-right font-bold tabular-nums text-gold">
                {lang === "bn" ? toBnDigits(total) : total}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </Reveal>
  );
}

/** Alumni engagement highlight cards. */
export function AlumniEngagement({ lang }: { lang: Language }) {
  return (
    <section className="bg-parchment py-16 sm:py-24 dark:bg-secondary/30">
      <div className="container-site">
        <Reveal>
          <SectionHeading
            eyebrow={lang === "bn" ? "অ্যালামনাই সক্রিয়তা" : "Alumni Engagement"}
            title={{ bn: "প্রাক্তনরা যেভাবে কাজ করছেন", en: "How Our Alumni Serve" }}
            description={{
              bn: "সার্টিফিকেট ছাড়াও অ্যালামনাইরা উম্মাহর জন্য নিরলসভাবে কাজ করে যাচ্ছেন — লেখনী, বক্তৃতা ও নেটওয়ার্কিংয়ের মাধ্যমে।",
              en: "Beyond certificates, our alumni serve the Ummah tirelessly — through writing, speaking, and networking.",
            }}
            lang={lang}
          />
        </Reveal>

        <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {alumniEngagement.map((item) => {
            const Icon = engagementIcons[item.icon] ?? Network;
            return (
              <RevealItem key={item.id}>
                <article className="h-full rounded-xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-950/10">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-gold/15 text-gold">
                    <Icon aria-hidden className="h-5 w-5" />
                  </span>
                  <h3 className="font-heading mt-4 text-base font-semibold leading-snug">{pick(item.title, lang)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pick(item.description, lang)}</p>
                </article>
              </RevealItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
