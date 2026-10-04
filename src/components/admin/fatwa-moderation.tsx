"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookMarked, CheckCircle2, ChevronDown, ExternalLink, Loader2, Lock, Mail, MessageSquareText, Pencil, Phone, Trash2 } from "lucide-react";
import { adminFatwaStatusBadgeClass, adminFatwaStatusLabel } from "@/components/admin/admin-types";
import type { AdminFatwaQuestionData } from "@/components/admin/admin-types";
import { FatwaAnswerDialog } from "@/components/admin/fatwa-answer-dialog";
import { FatwaPublishDialog } from "@/components/admin/fatwa-publish-dialog";
import { fatwaCategoryLabel } from "@/components/research/fatwa-shared";
import { daysAgoLabel, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { FatwaCategory, Language } from "@/types";

type Question = AdminFatwaQuestionData;

type FilterKey = "all" | "pending" | "answered" | "published";

interface FatwaModerationProps {
  questions: AdminFatwaQuestionData[];
  lang: Language;
}

/** Question card: asker (admin-only view), category, privacy, body, answer + actions. */
function QuestionCard({
  question,
  lang,
  onAnswer,
  onPublishRequest,
  onDeleteRequest,
  deleteBusy,
}: {
  question: Question;
  lang: Language;
  onAnswer: (question: Question) => void;
  onPublishRequest: (question: Question) => void;
  onDeleteRequest: (question: Question) => void;
  deleteBusy: boolean;
}) {
  const bn = lang === "bn";
  const answered = question.status === "answered";
  const published = question.status === "published";
  const paragraphs = (question.answer ?? "")
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <article className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-colors hover:border-gold/40">
      <div aria-hidden className={cn("h-1", published ? "bg-primary/60" : answered ? "bg-emerald-600/60" : "bg-gold-gradient")} />
      <div className="p-4 sm:p-5">
        {/* Badges + age */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-[10.5px] font-semibold text-primary dark:text-gold">
            <MessageSquareText aria-hidden className="mr-1 h-3 w-3" />
            {fatwaCategoryLabel(question.category as FatwaCategory, lang)}
          </Badge>
          <Badge variant="outline" className={cn("text-[10.5px] font-semibold", adminFatwaStatusBadgeClass(question.status))}>
            {adminFatwaStatusLabel(question.status, lang)}
          </Badge>
          {question.isPrivate ? (
            <Badge variant="outline" className="gap-1 border-rose-300 bg-rose-50 text-[10.5px] font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
              <Lock aria-hidden className="h-3 w-3" />
              {bn ? "প্রাইভেট" : "Private"}
            </Badge>
          ) : null}
          <span className="ml-auto text-[11px] text-muted-foreground">
            {formatDate(question.createdAt, lang)} · {daysAgoLabel(question.createdAt, lang)}
          </span>
        </div>

        {/* Asker (admin-only view) */}
        <div className="mt-3 rounded-xl bg-muted/50 px-3.5 py-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            {bn ? "প্রশ্নকারী (শুধু অ্যাডমিন দৃশ্যমান)" : "Asker (admin-only view)"}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
            <span className="font-semibold">{question.name}</span>
            <span dir="ltr" className="inline-flex items-center gap-1 text-muted-foreground">
              <Mail aria-hidden className="h-3 w-3" />
              {question.email}
            </span>
            {question.phone ? (
              <span dir="ltr" className="inline-flex items-center gap-1 text-muted-foreground">
                <Phone aria-hidden className="h-3 w-3" />
                {question.phone}
              </span>
            ) : null}
          </div>
        </div>

        {/* Question */}
        <p className="mt-3.5 whitespace-pre-line text-[13.5px] leading-relaxed">{question.question}</p>

        {/* Answered/published state: expandable answer */}
        {(answered || published) && question.answer ? (
          <Collapsible className="mt-4">
            <CollapsibleTrigger className="group flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-emerald-600/30 bg-emerald-500/5 px-4 text-left text-[12.5px] font-bold text-emerald-800 transition-colors hover:bg-emerald-500/10 dark:text-emerald-300">
              <span>
                {published
                  ? bn
                    ? "বোর্ডের চূড়ান্ত উত্তর (প্রকাশিত)"
                    : "Board's final answer (published)"
                  : bn
                    ? "বোর্ডের উত্তর দেখুন"
                    : "View board answer"}
                {question.answeredAt ? ` · ${formatDate(question.answeredAt, lang)}` : ""}
              </span>
              <ChevronDown aria-hidden className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-2 rounded-xl bg-parchment/60 p-4 text-[13px] leading-relaxed text-foreground/90 dark:bg-muted/40">
                {paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
              {question.isPrivate ? (
                <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-rose-300/60 bg-rose-50/60 px-3 py-2 text-[11.5px] leading-relaxed text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
                  <Lock aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {bn
                    ? "প্রাইভেট চিহ্নিত প্রশ্ন — এই উত্তর প্রশ্নকারীর ইমেইলে পাঠানো হবে, প্রকাশ্য ফতোয়া ব্যাংকে প্রকাশ করা হবে না।"
                    : "Marked private — this answer is emailed to the asker and is not published to the public fatwa bank."}
                </p>
              ) : null}
            </CollapsibleContent>
          </Collapsible>
        ) : null}

        {/* Actions */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-dashed pt-3.5">
          <p className="text-[11.5px] text-muted-foreground">
            {published
              ? bn
                ? "প্রকাশ্য ফতোয়া ব্যাংকে প্রকাশিত।"
                : "Published to the public fatwa bank."
              : answered
                ? question.isPrivate
                  ? bn
                    ? "প্রাইভেট চিহ্নিত — উত্তর ইমেইলে পাঠানো হবে।"
                    : "Private — answer emailed to the asker."
                  : bn
                    ? "উত্তর প্রকাশের জন্য প্রস্তুত।"
                    : "Answer ready for publishing."
                : bn
                  ? "গবেষণা বোর্ডের উত্তরের অপেক্ষায়।"
                  : "Awaiting the research board's answer."}
          </p>
          <div className="flex items-center gap-2">
            {published && question.publishedSlug ? (
              <Link
                href={`/research/fatwa?focus=${question.publishedSlug}`}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 text-[12.5px] font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground dark:text-gold"
              >
                <ExternalLink aria-hidden className="h-3.5 w-3.5" />
                {bn ? "ব্যাংকে দেখুন" : "View in bank"}
              </Link>
            ) : null}
            {(answered || published) && !question.isPrivate ? (
              <Button
                onClick={() => onPublishRequest(question)}
                variant={published ? "outline" : "default"}
                className={cn(
                  "min-h-11 gap-2 px-4 text-[12.5px] font-bold",
                  published
                    ? "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 dark:text-gold"
                    : "border border-gold/50 bg-gold/10 text-gold hover:bg-gold/20",
                )}
              >
                {published ? (
                  <>
                    <CheckCircle2 aria-hidden className="h-3.5 w-3.5" />
                    {bn ? "এন্ট্রি হালনাগাদ" : "Sync Entry"}
                  </>
                ) : (
                  <>
                    <BookMarked aria-hidden className="h-3.5 w-3.5" />
                    {bn ? "ব্যাংকে প্রকাশ" : "Publish"}
                  </>
                )}
              </Button>
            ) : null}
            <Button
              onClick={() => onAnswer(question)}
              className="min-h-11 gap-2 bg-gold-gradient px-4 text-[12.5px] font-bold text-gold-foreground hover:opacity-90"
            >
              {answered || published ? (
                <>
                  <Pencil aria-hidden className="h-3.5 w-3.5" />
                  {bn ? "উত্তর সম্পাদনা" : "Edit Answer"}
                </>
              ) : (
                <>
                  <MessageSquareText aria-hidden className="h-3.5 w-3.5" />
                  {bn ? "উত্তর দিন" : "Answer"}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => onDeleteRequest(question)}
              disabled={deleteBusy}
              aria-label={bn ? "প্রশ্ন মুছে ফেলুন" : "Delete question"}
              className="min-h-11 gap-2 border-destructive/40 px-4 text-[12.5px] font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              {deleteBusy ? (
                <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 aria-hidden className="h-3.5 w-3.5" />
              )}
              {bn ? "মুছে ফেলুন" : "Delete"}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Moderation queue with status filter chips, answer/publish flows, and delete confirmations. */
export function FatwaModeration({ questions, lang }: FatwaModerationProps) {
  const bn = lang === "bn";
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [answerFor, setAnswerFor] = useState<Question | null>(null);
  const [publishFor, setPublishFor] = useState<Question | null>(null);
  const [deleteFor, setDeleteFor] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState(false);
  /** Optimistic patches (answered/published state) + removals — survive Router Cache staleness. */
  const [answeredPatches, setAnsweredPatches] = useState<Map<string, { answer: string; answeredAt: string }>>(
    () => new Map(),
  );
  const [publishedPatches, setPublishedPatches] = useState<Map<string, { slug: string; answer: string; answeredAt: string }>>(
    () => new Map(),
  );
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => new Set());

  const effective = useMemo(() => {
    if (answeredPatches.size === 0 && publishedPatches.size === 0 && deletedIds.size === 0) return questions;
    return questions
      .filter((question) => !deletedIds.has(question.id))
      .map((question) => {
        const publishedPatch = publishedPatches.get(question.id);
        if (publishedPatch) {
          return {
            ...question,
            status: "published" as const,
            publishedSlug: publishedPatch.slug,
            answer: publishedPatch.answer,
            answeredAt: publishedPatch.answeredAt,
          };
        }
        const patch = answeredPatches.get(question.id);
        return patch ? { ...question, status: "answered" as const, answer: patch.answer, answeredAt: patch.answeredAt } : question;
      });
  }, [questions, answeredPatches, publishedPatches, deletedIds]);

  const counts = useMemo(
    () => ({
      all: effective.length,
      pending: effective.filter((question) => question.status === "pending").length,
      answered: effective.filter((question) => question.status === "answered").length,
      published: effective.filter((question) => question.status === "published").length,
    }),
    [effective],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return effective;
    return effective.filter((question) => question.status === filter);
  }, [effective, filter]);

  const chips: { key: FilterKey; labelBn: string; labelEn: string }[] = [
    { key: "all", labelBn: "সব", labelEn: "All" },
    { key: "pending", labelBn: "অপেক্ষমাণ", labelEn: "Pending" },
    { key: "answered", labelBn: "উত্তরপ্রাপ্ত", labelEn: "Answered" },
    { key: "published", labelBn: "প্রকাশিত", labelEn: "Published" },
  ];

  async function onDelete(): Promise<void> {
    if (!deleteFor || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/fatwa-questions/${deleteFor.id}`, { method: "DELETE" });
      const payload: { data?: { message?: string }; error?: string } = await res.json();
      if (!res.ok) {
        toast({ title: payload.error ?? (bn ? "মুছে ফেলা যায়নি" : "Delete failed"), variant: "destructive" });
        return;
      }
      toast({ title: payload.data?.message ?? (bn ? "প্রশ্নটি মুছে ফেলা হয়েছে" : "Question deleted") });
      const removedId = deleteFor.id;
      setDeleteFor(null);
      setAnswerFor(null);
      setPublishFor(null);
      setDeletedIds((prev) => {
        const next = new Set(prev);
        next.add(removedId);
        return next;
      });
      router.refresh();
    } catch {
      toast({ title: bn ? "নেটওয়ার্ক সমস্যা হয়েছে" : "Network error", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  let emptyMessage: ReactNode;
  if (filtered.length === 0) {
    emptyMessage = (
      <div className="flex flex-col items-center justify-center rounded-2xl border bg-card px-6 py-16 text-center shadow-sm">
        <span aria-hidden className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MessageSquareText className="h-6 w-6" />
        </span>
        <p className="mt-4 text-[15px] font-semibold">
          {questions.length === 0
            ? bn
              ? "এখনো কোনো প্রশ্ন জমা হয়নি"
              : "No questions submitted yet"
            : filter === "pending"
              ? bn
                ? "আলহামদুলিল্লাহ — কোনো অপেক্ষমাণ প্রশ্ন নেই"
                : "Alhamdulillah — no pending questions"
              : bn
                ? "এই ফিল্টারে কোনো প্রশ্ন নেই"
                : "No questions under this filter"}
        </p>
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          {bn
            ? "ওয়েবসাইটের “ফতোয়া জিজ্ঞাসা” ফর্ম থেকে প্রশ্ন এলে সেগুলো এখানে দেখাবে।"
            : "Questions submitted via the public ask-a-fatwa form will appear here."}
        </p>
      </div>
    );
  }

  return (
    <section aria-label={bn ? "ফতোয়া মডারেশন তালিকা" : "Fatwa moderation list"} className="space-y-4">
      {/* Filter chips */}
      <div role="group" aria-label={bn ? "স্ট্যাটাস ফিল্টার" : "Status filter"} className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => {
          const active = filter === chip.key;
          const count = counts[chip.key];
          return (
            <button
              key={chip.key}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(chip.key)}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[12.5px] font-semibold transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-gold/50 hover:text-primary",
              )}
            >
              {bn ? chip.labelBn : chip.labelEn}
              <span className={cn("rounded-full px-1.5 py-0.5 text-[10.5px] font-bold", active ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        emptyMessage
      ) : (
        <div className="grid gap-4">
          {filtered.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              lang={lang}
              onAnswer={setAnswerFor}
              onPublishRequest={setPublishFor}
              onDeleteRequest={setDeleteFor}
              deleteBusy={deleting && deleteFor?.id === question.id}
            />
          ))}
        </div>
      )}

      {/* Answer dialog */}
      {answerFor ? (
        <FatwaAnswerDialog
          question={answerFor}
          lang={lang}
          open={Boolean(answerFor)}
          onOpenChange={(open) => !open && setAnswerFor(null)}
          onAnswered={(answer) => {
            const patchedId = answerFor.id;
            setAnsweredPatches((prev) => {
              const next = new Map(prev);
              next.set(patchedId, { answer, answeredAt: new Date().toISOString() });
              return next;
            });
            setAnswerFor(null);
            router.refresh();
          }}
        />
      ) : null}

      {/* Publish dialog */}
      {publishFor ? (
        <FatwaPublishDialog
          question={publishFor}
          lang={lang}
          open={Boolean(publishFor)}
          onOpenChange={(open) => !open && setPublishFor(null)}
          onPublished={(slug) => {
            const patchedId = publishFor.id;
            setPublishedPatches((prev) => {
              const next = new Map(prev);
              next.set(patchedId, {
                slug,
                answer: publishFor.answer ?? "",
                answeredAt: publishFor.answeredAt ?? new Date().toISOString(),
              });
              return next;
            });
            setPublishFor(null);
            router.refresh();
          }}
        />
      ) : null}

      {/* Delete confirmation */}
      <AlertDialog open={Boolean(deleteFor)} onOpenChange={(open) => !open && setDeleteFor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">
              {bn ? "প্রশ্নটি মুছে ফেলবেন?" : "Delete this question?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              {bn
                ? `${deleteFor?.name ?? ""}-এর প্রশ্নটি স্থায়ভাবে মুছে যাবে (উত্তরসহ)। এই কাজটি ফিরিয়ে আনা যাবে না।`
                : `${deleteFor?.name ?? ""}'s question (and any answer) will be permanently removed. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11" disabled={deleting}>
              {bn ? "বাতিল" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void onDelete();
              }}
              disabled={deleting}
              className="min-h-11 gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Trash2 aria-hidden className="h-4 w-4" />}
              {bn ? "মুছে ফেলুন" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
