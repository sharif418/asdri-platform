import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { researchProjectUpdateSchema, sanitizeResearchPayload } from "@/lib/validators/admin-research";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/admin/research-projects/[id] — update a project (ADMIN, EDITOR). */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.researchProject.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "গবেষণা প্রকল্পটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = researchProjectUpdateSchema.safeParse(body);
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
  const { deadline, ...rest } = data;

  const project = await db.researchProject.update({
    where: { id },
    data: {
      ...rest,
      ...(deadline !== undefined ? { deadline: deadline ? new Date(`${deadline}T00:00:00Z`) : null } : {}),
    },
  });

  await audit(
    guard.session.user.id,
    "researchProject.update",
    "ResearchProject",
    project.id,
    {
      before: { slug: existing.slug, progress: existing.progress, isCallForPapers: existing.isCallForPapers },
      after: { slug: project.slug, progress: project.progress, isCallForPapers: project.isCallForPapers },
    },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { slug: project.slug } });
}

/** DELETE /api/admin/research-projects/[id] — remove a project (ADMIN, EDITOR). */
export async function DELETE(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.researchProject.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "গবেষণা প্রকল্পটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  await db.researchProject.delete({ where: { id } });
  await audit(
    guard.session.user.id,
    "researchProject.delete",
    "ResearchProject",
    id,
    { before: { slug: existing.slug, titleBn: existing.titleBn } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true });
}
