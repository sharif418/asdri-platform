import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getClientIp, isSameOrigin, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { fatwaQuestionSchema, zodFields } from "@/lib/validators";
import { FATWA_CATEGORIES } from "@/types";
import type { FatwaCategory } from "@/types";

export const dynamic = "force-dynamic";

/** GET /api/fatwa?q=&category=&page= — search the published fatwa bank. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const limiter = rateLimit({
    key: "fatwa-read",
    identifier: getClientIp(request),
    limit: 60,
    windowMs: 60_000,
  });
  if (!limiter.ok) return jsonError("Too many requests", "RATE_LIMIT", 429);

  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim() ?? "";
  const focusSlug = params.get("slug")?.trim() ?? "";
  const category = params.get("category");
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(30, Math.max(1, Number.parseInt(params.get("pageSize") ?? "8", 10) || 8));

  // Deep-link lookup: return a single entry by exact slug (used by ?focus= links).
  if (focusSlug) {
    try {
      const row = await db.fatwaEntry.findUnique({ where: { slug: focusSlug } });
      if (!row) return jsonError("Not found", "NOT_FOUND", 404);
      return jsonOk({
        items: [
          {
            id: row.id,
            slug: row.slug,
            category: row.category as FatwaCategory,
            question: { bn: row.questionBn, en: row.questionEn },
            answer: { bn: row.answerBn, en: row.answerEn },
            answeredBy: row.answeredBy,
            publishedAt: row.publishedAt.toISOString(),
          },
        ],
        total: 1,
        page: 1,
        pageSize: 1,
      });
    } catch {
      return jsonError("Failed to fetch fatwa", "SERVER", 500);
    }
  }

  if (category && !FATWA_CATEGORIES.includes(category as FatwaCategory)) {
    return jsonError("Invalid category", "VALIDATION", 400);
  }

  try {
    const where = {
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { questionBn: { contains: q } },
              { questionEn: { contains: q } },
              { answerBn: { contains: q } },
              { answerEn: { contains: q } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      db.fatwaEntry.count({ where }),
      db.fatwaEntry.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const items = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      category: row.category as FatwaCategory,
      question: { bn: row.questionBn, en: row.questionEn },
      answer: { bn: row.answerBn, en: row.answerEn },
      answeredBy: row.answeredBy,
      publishedAt: row.publishedAt.toISOString(),
    }));

    return jsonOk({ items, total, page, pageSize });
  } catch {
    return jsonError("Failed to search fatwa bank", "SERVER", 500);
  }
}

/** POST /api/fatwa — submit a question to the research board. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid origin", "UNAUTHORIZED", 403);
  }

  const ip = getClientIp(request);
  const limiter = rateLimit({ key: "fatwa-ask", identifier: ip, limit: 5, windowMs: 10 * 60_000 });
  if (!limiter.ok) {
    return jsonError("অনেকবার প্রশ্ন পাঠানো হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন", "RATE_LIMIT", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", "VALIDATION", 400);
  }

  const parsed = fatwaQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ফর্মের তথ্যগুলো যাচাই করুন", code: "VALIDATION", fields: zodFields(parsed.error) },
      { status: 400 },
    );
  }

  try {
    await db.fatwaQuestion.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        category: parsed.data.category,
        question: parsed.data.question,
        isPrivate: parsed.data.isPrivate,
      },
    });

    return jsonOk(
      {
        message:
          parsed.data.isPrivate
            ? "আপনার প্রশ্ন গৃহীত হয়েছে — ইনশাআল্লাহ উত্তর শুধু আপনার ইমেইলে পাঠানো হবে।"
            : "আপনার প্রশ্ন গৃহীত হয়েছে — উত্তর প্রস্তুত হলে ইমেইলে জানানো হবে ও ফতোয়া ব্যাংকে প্রকাশিত হতে পারে।",
      },
      201,
    );
  } catch {
    return jsonError("সার্ভারে সমস্যা হয়েছে", "SERVER", 500);
  }
}
