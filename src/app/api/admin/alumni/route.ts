import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, getSession, roleCan, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { alumniProfileCreateSchema, alumniListQuerySchema } from "@/lib/validators/alumni";
import { nextAlumniRegistryNo } from "@/lib/alumni";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/alumni — the office registry list for the manager table.
 * Read-only: session + role guard (no CSRF header — safe for plain GETs).
 */
export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!roleCan(session.user.role, "alumni.manage")) return forbidden();

  const url = new URL(request.url);
  const parsed = alumniListQuerySchema.safeParse({
    q: url.searchParams.get("q") ?? undefined,
    courseKey: url.searchParams.get("courseKey") ?? undefined,
    published: url.searchParams.get("published") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "কোয়েরি সঠিক নয়।" }, { status: 400 });
  }

  const where = {
    ...(parsed.data.courseKey ? { courseKey: parsed.data.courseKey } : {}),
    ...(parsed.data.published === "yes" ? { isPublished: true } : {}),
    ...(parsed.data.published === "no" ? { isPublished: false } : {}),
    ...(parsed.data.q
      ? {
          OR: [
            { nameBn: { contains: parsed.data.q } },
            { nameEn: { contains: parsed.data.q, mode: "insensitive" as const } },
            { registryNo: { contains: parsed.data.q } },
            { phone: { contains: parsed.data.q } },
            { email: { contains: parsed.data.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    db.alumniProfile.count({ where }),
    db.alumniProfile.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: 200,
      select: {
        id: true,
        registryNo: true,
        userId: true,
        nameBn: true,
        nameEn: true,
        courseKey: true,
        batchYear: true,
        batchNoBn: true,
        occupationBn: true,
        organizationBn: true,
        districtBn: true,
        phone: true,
        email: true,
        addressBn: true,
        isPublished: true,
        updatedAt: true,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, data: { items, total } });
}

/**
 * POST /api/admin/alumni — add a graduate to the registry (ADMIN, ADMISSIONS).
 * The registry number is office-generated (AL-YYYY-NNNN); the form never
 * supplies one.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "alumni");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = alumniProfileCreateSchema.safeParse(body);
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

  const data = parsed.data;
  const registryNo = await nextAlumniRegistryNo();

  const profile = await db.alumniProfile.create({
    data: {
      registryNo,
      nameBn: data.nameBn,
      nameEn: data.nameEn,
      courseKey: data.courseKey,
      batchYear: data.batchYear,
      batchNoBn: data.batchNoBn,
      occupationBn: data.occupationBn,
      occupationEn: data.occupationEn,
      organizationBn: data.organizationBn,
      organizationEn: data.organizationEn,
      districtBn: data.districtBn,
      districtEn: data.districtEn,
      phone: data.phone,
      email: data.email,
      addressBn: data.addressBn,
      isPublished: data.isPublished,
    },
  });

  await audit(
    guard.session.user.id,
    "alumni.profile.create",
    "AlumniProfile",
    profile.id,
    { after: { registryNo, nameBn: profile.nameBn, courseKey: profile.courseKey, isPublished: profile.isPublished } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { id: profile.id, registryNo } }, { status: 201 });
}
