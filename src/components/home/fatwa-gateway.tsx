"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, BookMarked, Loader2, MessageCircleQuestion, Search, Send } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/components/providers/language-provider";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/format";
import { langPath } from "@/lib/locale";
import { pick } from "@/types";
import type { FatwaCategory, FatwaEntry, Language } from "@/types";

interface FatwaDto {
  id: string;
  slug: string;
  category: FatwaCategory;
  question: { bn: string; en: string };
  answer: { bn: string; en: string };
  answeredBy: string;
  publishedAt: string;
}

const categoryOptions: { value: FatwaCategory; labelBn: string; labelEn: string }[] = [
  { value: "ibadat", labelBn: "ইবাদত", labelEn: "Worship" },
  { value: "muamalat", labelBn: "লেনদেন", labelEn: "Transactions" },
  { value: "aqidah", labelBn: "আকীদা", labelEn: "Creed" },
  { value: "family", labelBn: "পারিবারিক", labelEn: "Family" },
  { value: "contemporary", labelBn: "সমকালীন", labelEn: "Contemporary" },
];

/** Fatwa & online query gateway — quick ask form + live-searchable fatwa bank. */
export function FatwaGateway({ lang }: { lang: Language }) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState<FatwaDto[]>([]);
  const [loadingBank, setLoadingBank] = useState(true);

  // Ask form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState<FatwaCategory>("ibadat");
  const [question, setQuestion] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingBank(true);
    fetch("/api/fatwa?pageSize=4")
      .then(async (res) => {
        if (!res.ok) throw new Error("failed");
        const payload: { data: { items: FatwaDto[] } } = await res.json();
        if (!cancelled) setEntries(payload.data.items);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoadingBank(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter(
      (entry) =>
        entry.question.bn.toLowerCase().includes(query) ||
        entry.question.en.toLowerCase().includes(query) ||
        entry.answer.bn.toLowerCase().includes(query),
    );
  }, [entries, search]);

  async function onAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/fatwa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, category, question, isPrivate }),
      });
      const payload: { data?: { message: string }; error?: string; fields?: Record<string, string> } =
        await res.json();
      if (!res.ok) {
        if (payload.fields) {
          const first = Object.values(payload.fields)[0];
          toast({ title: first ?? t("toast.error"), variant: "destructive" });
        } else {
          toast({ title: payload.error ?? t("toast.error"), variant: "destructive" });
        }
        return;
      }
      toast({ title: t("toast.success"), description: payload.data?.message });
      setQuestion("");
      setPhone("");
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="py-16 sm:py-24">
      <div className="container-site">
        <Reveal>
          <SectionHeading
            eyebrow={lang === "bn" ? "ফতোয়া ও জিজ্ঞাসা" : "Fatwa & Queries"}
            title={lang === "bn" ? "একাডেমিক অনলাইন জিজ্ঞাসা" : "Online Query Gateway"}
            description={
              lang === "bn"
                ? "দৈনন্দিন ফিকহ ও সমকালীন বিষয়ে প্রশ্ন করুন — ইনস্টিটিউটের ফিকহ ও গবেষণা বোর্ড থেকে পান প্রামাণ্য লিখিত উত্তর।"
                : "Ask everyday fiqh and contemporary questions — receive authentic written answers from the institute's fiqh & research board."
            }
            lang={lang}
          />
        </Reveal>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {/* Quick ask form */}
          <Reveal>
            <form
              onSubmit={onAsk}
              className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm sm:p-8"
              aria-label={lang === "bn" ? "প্রশ্ন জমা দিন" : "Ask a question"}
            >
              <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gold-gradient" />
              <h3 className="font-heading flex items-center gap-2.5 text-lg font-semibold">
                <MessageCircleQuestion aria-hidden className="h-5 w-5 text-gold" />
                {lang === "bn" ? "প্রশ্ন জমা দিন" : "Submit a Question"}
              </h3>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fatwa-name">{t("label.name")} *</Label>
                  <Input
                    id="fatwa-name"
                    required
                    minLength={2}
                    maxLength={120}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fatwa-email">{t("label.email")} *</Label>
                  <Input
                    id="fatwa-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fatwa-phone">
                    {t("label.phone")} <span className="text-[11px] text-muted-foreground">({t("label.optional")})</span>
                  </Label>
                  <Input
                    id="fatwa-phone"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+8801XXXXXXXXX"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fatwa-category-select">{t("label.category")} *</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as FatwaCategory)}>
                    <SelectTrigger id="fatwa-category-select" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {lang === "bn" ? option.labelBn : option.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                <Label htmlFor="fatwa-question">
                  {lang === "bn" ? "আপনার প্রশ্ন" : "Your Question"} *
                </Label>
                <Textarea
                  id="fatwa-question"
                  required
                  minLength={15}
                  maxLength={4000}
                  rows={4}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={
                    lang === "bn"
                      ? "বিস্তারিতভাবে প্রশ্নটি লিখুন — প্রাসঙ্গিক তথ্য দিলে উত্তর আরও স্পষ্ট হবে ইনশাআল্লাহ…"
                      : "Write your question in detail — context helps produce a clearer answer, in shaa Allah…"
                  }
                />
              </div>

              <div className="mt-4 flex items-start gap-2.5">
                <Checkbox
                  id="fatwa-private"
                  checked={isPrivate}
                  onCheckedChange={(checked) => setIsPrivate(checked === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="fatwa-private" className="text-[13px] font-normal leading-snug text-muted-foreground">
                  {lang === "bn"
                    ? "আমার প্রশ্নটি ওয়েবসাইটে প্রকাশ্যে না দেখিয়ে শুধু ইমেইলে উত্তর দিন"
                    : "Answer by email only — do not publish my question on the website"}
                </Label>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full bg-primary text-[15px] font-semibold hover:bg-primary/90"
              >
                {submitting ? (
                  <>
                    <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                    {t("action.sending")}
                  </>
                ) : (
                  <>
                    <Send aria-hidden className="h-4 w-4" />
                    {t("action.submit")}
                  </>
                )}
              </Button>
            </form>
          </Reveal>

          {/* Searchable fatwa bank preview */}
          <Reveal delay={0.12}>
            <div className="flex h-full flex-col rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
              <h3 className="font-heading flex items-center gap-2.5 text-lg font-semibold">
                <BookMarked aria-hidden className="h-5 w-5 text-gold" />
                {lang === "bn" ? "সার্চেবল ফতোয়া ব্যাংক" : "Searchable Fatwa Bank"}
              </h3>

              <div className="relative mt-5">
                <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={lang === "bn" ? "কী-ওয়ার্ড দিয়ে খুঁজুন (যেমন: যাকাত, কিবলা)…" : "Search by keyword (e.g. zakat, qiblah)…"}
                  className="pl-9"
                  aria-label={t("action.search")}
                />
              </div>

              <div className="mt-5 flex-1 space-y-4">
                {loadingBank ? (
                  <p className="py-8 text-center text-sm text-muted-foreground" aria-busy="true">
                    {t("action.sending")}
                  </p>
                ) : filteredEntries.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">{t("label.noResults")}</p>
                ) : (
                  <ul className="scrollbar-thin max-h-[420px] space-y-4 overflow-y-auto pr-1">
                    {filteredEntries.map((entry) => {
                      const cat = categoryOptions.find((c) => c.value === entry.category);
                      return (
                        <li key={entry.id} className="rounded-xl border bg-background/60 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="outline" className="border-gold/40 bg-gold/10 text-[10px] font-semibold text-gold">
                              {cat ? (lang === "bn" ? cat.labelBn : cat.labelEn) : entry.category}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              {formatDate(entry.publishedAt, lang)}
                            </span>
                          </div>
                          <h4 className="mt-2.5 text-[14px] font-semibold leading-snug">
                            {pick(entry.question, lang)}
                          </h4>
                          <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
                            {pick(entry.answer, lang)}
                          </p>
                          <p className="mt-2.5 text-[11px] font-medium text-primary">— {entry.answeredBy}</p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <Link
                href={langPath(lang, "/research/fatwa")}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full border px-6 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                {lang === "bn" ? "সম্পূর্ণ ফতোয়া ব্যাংক" : "Full Fatwa Bank"}
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
