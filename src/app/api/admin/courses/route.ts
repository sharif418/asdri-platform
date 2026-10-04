import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { sanitizeRichText } from "@/lib/sanitize";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

const courseCreateSchema = z.object({
  code: z.string().trim().min(2, "কোর্স কোড দিন (যেমন PYS)").max(12),
  titleBn: z.string().trim().min(3, "বাংলা শিরোনাম আবশ্যক").max(300),
  titleEn: z.string().trim().max(300).default(""),
  titleAr: z.string().trim().max(300).nullable().default(null),
  taglineBn: z.string().trim().max(500).default(""),
  taglineEn: z.string().trim().max(500).default(""),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).min(3).max(120).optional(),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(100),
});

/** POST /api/admin/courses — create a course shell (ADMIN, EDITOR). */
export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "academics");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধ পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = courseCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "ফর্ম যাচাই করুন।", fields: Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])) },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const slug = d.slug || slugify(d.titleEn || d.titleBn);
  if (await db.course.findUnique({ where: { slug } })) {
    return NextResponse.json({ ok: false, error: "স্লাগ ডুপ্লিকেট — অন্যটি দিন।", fields: { slug: "ডুপ্লিকেট" } }, { status: 409 });
  }
  if (await db.course.findUnique({ where: { code: d.code } })) {
    return NextResponse.json({ ok: false, error: "এই কোড ইতিমধ্যে আছে।", fields: { code: "ডুপ্লিকেট কোড" } }, { status: 409 });
  }

  const course = await db.course.create({ data: { ...d, slug } });
  await audit(guard.session.user.id, "course.create", "Course", course.id, { after: { code: course.code, titleBn: course.titleBn } }, request.headers.get("x-real-ip"));
  return NextResponse.json({ ok: true, data: { slug: course.slug, id: course.id } }, { status: 201 });
}
