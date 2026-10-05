import { NextRequest, NextResponse } from "next/server";
import { Prisma, type FatwaQuestion } from "@prisma/client";
import { db } from "@/lib/db";
import { orderByIds, searchFatwaEntries } from "@/lib/db-search";
import { richTextToPlain } from "@/lib/sanitize";
import { getClientIp, isSameOrigin, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { isFeatureEnabled } from "@/lib/settings";
import { fatwaQuestionSchema, zodFields } from "@/lib/validators";
import { FATWA_CATEGORIES, type FatwaCategory } from "@/types";

export const dynamic = "force-dynamic";

const FATWA_SELECT = {
  id: true,
  slug: true,
  questionBn: true,
  questionEn: true,
  answerBn: true,
  answerEn: true,
  answeredBy: true,
  publishedAt: true,
  category: { select: { key: true } },
} as const;

interface FatwaRow {
  id: string;
  slug: string;
  questionBn: string;
  questionEn: string;
  answerBn: string;
  answerEn: string;
  answeredBy: string;
  publishedAt: Date;
  category: { key: string } | null;
}

function toDto(row: FatwaRow) {
  return {
    id: row.id,
    slug: row.slug,
    category: (FATWA_CATEGORIES.includes(row.category?.key as FatwaCategory)
      ? row.category?.key
      : "contemporary") as FatwaCategory,
    // Answers are stored as sanitised rich HTML; the bank renders plain text.
    question: { bn: richTextToPlain(row.questionBn), en: richTextToPlain(row.questionEn) },
    answer: { bn: richTextToPlain(row.answerBn), en: richTextToPlain(row.answerEn) },
    answeredBy: row.answeredBy,
    publishedAt: row.publishedAt.toISOString(),
  };
}

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** GET /api/fatwa?slug=|q=&category=&page=&pageSize= — published fatwa bank.
 *
 * `slug` returns that single entry (deep links from the palette/shares);
 * otherwise a paginated, searchable list — ranked tsvector full-text over
 * question + answer text in both languages (see lib/db-search).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!(await isFeatureEnabled("fatwa"))) {
    return jsonOk({ items: [], total: 0, page: 1, pageSize: 10 });
  }

  const limiter = rateLimit({
    key: "fatwa-read",
    identifier: getClientIp(request),
    limit: 60,
    windowMs: 60_000,
  });
  if (!limiter.ok) {
    const response = jsonError("অনেকবার অনুরোধ পাঠানো হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন", "RATE_LIMIT", 429);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  const params = request.nextUrl.searchParams;
  const slug = (params.get("slug") ?? "").trim();
  const q = (params.get("q") ?? "").trim().slice(0, 120);
  const category = (params.get("category") ?? "").trim().toLowerCase();
  const page = Math.max(1, parsePositiveInt(params.get("page"), 1));
  const pageSize = Math.min(30, Math.max(1, parsePositiveInt(params.get("pageSize"), 8)));

  if (category && !FATWA_CATEGORIES.includes(category as FatwaCategory)) {
    const response = jsonError("অজানা ক্যাটাগরি", "VALIDATION", 400, {
      category: "ক্যাটাগরি ibadat, muamalat, aqidah, family বা contemporary হতে হবে",
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  try {
    if (slug) {
      const row = await db.fatwaEntry.findFirst({
        where: { slug, isPublished: true },
        select: FATWA_SELECT,
      });
      if (!row) {
        const response = jsonError("ফতোয়াটি খুঁজে পাওয়া যায়নি", "NOT_FOUND", 404);
        response.headers.set("Cache-Control", "no-store");
        return response;
      }
      const response = jsonOk({ items: [toDto(row)], total: 1, page: 1, pageSize: 1 });
      response.headers.set("Cache-Control", "no-store");
      return response;
    }

    const categoryFilter = category ? { category: { key: category } } : {};

    let total: number;
    let rows: FatwaRow[];
    if (q) {
      // Ranked full-text search (tsvector with ILIKE fallback) — ordered ids
      // first, then hydrated through the shared select and re-ordered.
      const search = await searchFatwaEntries({
        q,
        categoryKey: category || null,
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
      total = search.total;
      const hydrated = await db.fatwaEntry.findMany({
        where: { id: { in: search.ids.length > 0 ? search.ids : ["__none__"] } },
        select: FATWA_SELECT,
      });
      rows = orderByIds(hydrated, search.ids) as FatwaRow[];
    } else {
      const where: Prisma.FatwaEntryWhereInput = { isPublished: true, ...categoryFilter };
      [total, rows] = await Promise.all([
        db.fatwaEntry.count({ where }),
        db.fatwaEntry.findMany({
          where,
          orderBy: { publishedAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: FATWA_SELECT,
        }),
      ]);
    }

    const response = jsonOk({ items: rows.map(toDto), total, page, pageSize });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    const response = jsonError("ফতোয়া ব্যাংক লোড করা যায়নি", "SERVER", 500);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}

/** Create a pending FatwaQuestion with the next FAT-YYYY-NNNN reference. */
async function createQuestion(
  data: Omit<Prisma.FatwaQuestionCreateInput, "reference">,
): Promise<FatwaQuestion> {
  const year = new Date().getFullYear();
  let lastError: unknown = new Error("রেফারেন্স তৈরি করা যায়নি");
  for (let attempt = 0; attempt < 5; attempt++) {
    const seq = (await db.fatwaQuestion.count()) + 1 + attempt;
    try {
      return await db.fatwaQuestion.create({
        data: { ...data, reference: `FAT-${year}-${String(seq).padStart(4, "0")}` },
      });
    } catch (error) {
      lastError = error;
      const collision = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (!collision) throw error;
    }
  }
  throw lastError;
}

/** POST /api/fatwa — submit a question to the fiqh & research board. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!(await isFeatureEnabled("fatwa"))) {
    return jsonError("ফতোয়া বিভাগটি বর্তমানে বন্ধ আছে।", "FORBIDDEN", 403);
  }
  if (!isSameOrigin(request)) {
    return jsonError("অননুমোদিত উৎস", "UNAUTHORIZED", 403);
  }

  const ip = getClientIp(request);
  const limiter = rateLimit({ key: "fatwa-ask", identifier: ip, limit: 3, windowMs: 60_000 });
  if (!limiter.ok) {
    return jsonError("অনেকবার প্রশ্ন পাঠানো হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন", "RATE_LIMIT", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("অনুরোধের বডি পার্স করা যায়নি", "VALIDATION", 400);
  }

  const parsed = fatwaQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("ফর্মের তথ্যগুলো যাচাই করুন", "VALIDATION", 400, zodFields(parsed.error));
  }

  try {
    await createQuestion({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      categoryKey: parsed.data.category,
      question: parsed.data.question,
      isPrivate: parsed.data.isPrivate,
      status: "PENDING",
    });

    return jsonOk(
      {
        message: parsed.data.isPrivate
          ? "আপনার প্রশ্ন গৃহীত হয়েছে — ইনশাআল্লাহ উত্তর শুধু আপনার ইমেইলে পাঠানো হবে।"
          : "আপনার প্রশ্ন গৃহীত হয়েছে — উত্তর প্রস্তুত হলে ইমেইলে জানানো হবে ও ফতোয়া ব্যাংকে প্রকাশিত হতে পারে।",
      },
      201,
    );
  } catch {
    return jsonError("সার্ভারে সমস্যা হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন", "SERVER", 500);
  }
}
