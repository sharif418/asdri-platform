import { BrandMonoMark } from "@/components/shared/logo";

/**
 * Print-only official masthead — the institute's one-colour emerald mark
 * beside its name, above the document's own title line. Shared by every
 * "official pad" print flow (notices, donation receipts, the exam-call
 * letter) so the documents that leave the building all carry the same
 * head. Hidden on screen (`print:` only); the mark prints as a single
 * emerald ink, the type prints black.
 */
export function PrintMasthead({ name, title }: { name: string; title: string }) {
  return (
    <header className="hidden print:mb-5 print:block print:border-b-2 print:border-black print:pb-3">
      <div className="print:flex print:items-center print:justify-center print:gap-4">
        <BrandMonoMark tone="emerald" className="h-12 w-auto" />
        <div className="print:text-left">
          <p className="font-heading text-lg font-bold print:text-black">{name}</p>
          <p className="mt-1 text-sm print:text-black">{title}</p>
        </div>
      </div>
    </header>
  );
}
