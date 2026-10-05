import Link from "next/link";
import { MessageSquareQuote, Search } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FatwaQuestionRow } from "@/components/admin/fatwa-question-row";
import { AdminPager } from "@/components/admin/admin-pager";

export const metadata = { title: "জিজ্ঞাসা ইনবক্স" };

const STATUS_OPTIONS = [
  { value: "PENDING", label: "অপেক্ষমাণ" },
  { value: "ANSWERED", label: "উত্তরপ্রাপ্ত" },
  { value: "PUBLISHED", label: "প্রকাশিত" },
  { value: "REJECTED", label: "বাতিল" },
] as const;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PAGE_SIZE = 15;

function buildQuery(base: Record<string, string | undefined>, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(base)) {
    if (value) params.set(key, value);
  }
  params.set("page", String(page));
  return `/admin/fatwa/questions?${params.toString()}`;
}

/** Fatwa question inbox — answer, publish to the bank, or reject. */
export default async function AdminFatwaQuestionsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "fatwa")) redirect("/admin");

  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 120);
  const status = typeof sp.status === "string" && STATUS_OPTIONS.some((s) => s.value === sp.status) ? sp.status : undefined;
  const category = typeof sp.category === "string" ? sp.category.trim().slice(0, 60) : "";
  const page = Math.max(1, Number.parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);

  const where = {
    ...(status ? { status: status as QuestionStatus } : {}),
    ...(category ? { categoryKey: category } : {}),
    ...(q ? { OR: [{ question: { contains: q } }, { email: { contains: q } }, { name: { contains: q } }] } : {}),
  };

  const [total, questions, categories, counts] = await Promise.all([
    db.fatwaQuestion.count({ where }),
    db.fatwaQuestion.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        reference: true,
        name: true,
        email: true,
        phone: true,
        categoryKey: true,
        question: true,
        isPrivate: true,
        status: true,
        answer: true,
        note: true,
        publishedSlug: true,
        createdAt: true,
        answeredAt: true,
        answeredBy: { select: { name: true } },
      },
    }),
    db.fatwaCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, key: true, nameBn: true } }),
    db.fatwaQuestion.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const categoryMap = new Map(categories.map((c) => [c.key, c.nameBn]));
  const countFor = (value: string) => counts.find((row) => row.status === value)?._count._all ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
            <MessageSquareQuote aria-hidden className="h-6 w-6 text-primary" />
            জিজ্ঞাসা ইনবক্স
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            জনগণের ফিকহ-জিজ্ঞাসা — উত্তর লিখুন, চাইলে ফতোয়া ব্যাংকে প্রকাশ করুন। গোপনীয় প্রশ্নের উত্তর শুধু ইমেইলে যায়।
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11.5px] font-semibold">
          <StatusPill label="অপেক্ষমাণ" value={countFor("PENDING")} className="bg-gold/15 text-gold" />
          <StatusPill label="উত্তরপ্রাপ্ত" value={countFor("ANSWERED")} className="bg-primary/10 text-primary" />
          <StatusPill label="প্রকাশিত" value={countFor("PUBLISHED")} className="bg-primary text-primary-foreground" />
          <StatusPill label="বাতিল" value={countFor("REJECTED")} className="bg-muted text-muted-foreground" />
        </div>
      </div>

      <form className="mt-6 flex flex-wrap gap-2" action="/admin/fatwa/questions" method="get">
        <div className="relative min-w-52 flex-1">
          <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="প্রশ্নের লেখা বা ইমেইল দিয়ে খুঁজুন…"
            className="w-full rounded-lg border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50"
          />
        </div>
        <select name="status" defaultValue={status ?? ""} className="rounded-lg border bg-card px-3 py-2 text-sm">
          <option value="">সব অবস্থা</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select name="category" defaultValue={category} className="rounded-lg border bg-card px-3 py-2 text-sm">
          <option value="">সব ক্যাটাগরি</option>
          {categories.map((c) => (
            <option key={c.key} value={c.key}>
              {c.nameBn}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary">
          ফিল্টার
        </button>
      </form>

      <div className="mt-4 overflow-x-auto overflow-y-clip rounded-2xl border bg-card shadow-sm">
        {questions.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-heading text-lg font-bold">কোনো জিজ্ঞাসা পাওয়া যায়নি</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {q || status || category ? "ফিল্টার বদলে আবার দেখুন।" : "ওয়েবসাইটের জিজ্ঞাসা ফর্ম থেকে নতুন প্রশ্ন এলে এখানে দেখা যাবে।"}
            </p>
          </div>
        ) : (
          <div>
            {questions.map((question) => (
              <FatwaQuestionRow
                key={question.id}
                question={{
                  id: question.id,
                  reference: question.reference,
                  name: question.name,
                  email: question.email,
                  phone: question.phone,
                  categoryKey: question.categoryKey,
                  question: question.question,
                  isPrivate: question.isPrivate,
                  status: question.status,
                  answer: question.answer,
                  note: question.note,
                  publishedSlug: question.publishedSlug,
                  createdAt: question.createdAt.toISOString(),
                  answeredAt: question.answeredAt ? question.answeredAt.toISOString() : null,
                  answeredByName: question.answeredBy?.name ?? null,
                }}
                categoryLabel={categoryMap.get(question.categoryKey) ?? question.categoryKey}
                categories={categories}
              />
            ))}
          </div>
        )}
      </div>

      <p className="mt-4 text-[12px] text-muted-foreground">
        ফতোয়া ব্যাংকের প্রকাশিত সব ফতোয়া সম্পাদনা করতে{" "}
        <Link href="/admin/fatwa/entries" className="font-semibold text-primary hover:underline">
          ফতোয়া ব্যাংক
        </Link>{" "}
        পাতায় যান।
      </p>

      <AdminPager
        page={page}
        pageCount={pageCount}
        total={total}
        unit="জিজ্ঞাসা"
        buildHref={(next) => buildQuery({ q: q || undefined, status, category: category || undefined }, next)}
      />
    </div>
  );
}

type QuestionStatus = "PENDING" | "ANSWERED" | "PUBLISHED" | "REJECTED";

function StatusPill({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1", className)}>
      {label}
      <span className="font-bold">{formatNumber(value, "bn")}</span>
    </span>
  );
}
