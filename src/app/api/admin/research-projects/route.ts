import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { slugify } from "@/lib/slug";
import { researchProjectCreateSchema, sanitizeResearchPayload } from "@/lib/validators/admin-research";

export const dynamic = "force-dynamic";

/** POST /api/admin/research-projects — create a project (ADMIN, EDITOR). */
export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = researchProjectCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "ফর্মের তথ্য যাচাই করুন।",
        fields: Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])),
      },
      { status: 400 },
    );
  }

  const data = sanitizeResearchPayload(parsed.data);

  const slug = await uniqueSlug(data.titleEn || data.titleBn);
  const project = await db.researchProject.create({
    data: {
      slug,
      titleBn: data.titleBn,
      titleEn: data.titleEn,
      summaryBn: data.summaryBn,
      summaryEn: data.summaryEn,
      progress: data.progress,
      statusBn: data.statusBn,
      statusEn: data.statusEn,
      isCallForPapers: data.isCallForPapers,
      deadline: data.deadline ? new Date(`${data.deadline}T00:00:00Z`) : null,
      isPublished: data.isPublished,
      sortOrder: data.sortOrder,
    },
  });

  await audit(
    guard.session.user.id,
    "researchProject.create",
    "ResearchProject",
    project.id,
    { after: { slug: project.slug, titleBn: project.titleBn, progress: project.progress } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { slug: project.slug, id: project.id } }, { status: 201 });
}

/** Ensure a unique research project slug (-2, -3… suffixes). */
async function uniqueSlug(source: string): Promise<string> {
  const base = slugify(source) || "research-project";
  let candidate = base;
  for (let attempt = 2; attempt <= 25; attempt++) {
    const existing = await db.researchProject.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing) return candidate;
    candidate = `${base}-${attempt}`;
  }
  return `${base}-${Date.now()}`;
}
