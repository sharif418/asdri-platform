import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { isSameOrigin } from "@/lib/security";
import { audit } from "@/lib/audit";
import { createInvitation, invitationEmailHtml } from "@/lib/invitations";
import { queueOutboxEmail } from "@/lib/mail";
import { env } from "@/lib/env";
import { ROLE_LABELS_BN } from "@/lib/permissions";
import type { UserRole } from "@prisma/client";

const INVITABLE_ROLES: UserRole[] = [
  "EDITOR",
  "ADMISSIONS",
  "FINANCE",
  "FATWA",
  "LIBRARIAN",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "DONOR",
  "ALUMNI",
];

const createSchema = z.object({
  email: z.string().email("একটি বৈধ ইমেইল দিন।"),
  name: z.string().min(3, "নাম কমপক্ষে ৩ অক্ষরের হতে হবে।"),
  role: z.enum(INVITABLE_ROLES as [UserRole, ...UserRole[]]),
  courseId: z.string().optional().nullable(),
  note: z.string().max(300).optional(),
});

/** GET /api/admin/invitations — the office's invitation list. */
export async function GET(): Promise<Response> {
  const guard = await requireModule(new Request("http://local"), "invitations");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();
  const invitations = await db.invitation.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { course: { select: { titleBn: true, code: true } } },
  });
  return NextResponse.json({
    ok: true,
    invitations: invitations.map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      name: invitation.name,
      role: invitation.role,
      roleLabel: ROLE_LABELS_BN[invitation.role],
      courseLabel: invitation.course ? `${invitation.course.titleBn} (${invitation.course.code})` : null,
      note: invitation.note,
      status: invitation.revokedAt
        ? "revoked"
        : invitation.acceptedAt
          ? "accepted"
          : invitation.expiresAt < new Date()
            ? "expired"
            : "pending",
      expiresAt: invitation.expiresAt.toISOString(),
      acceptedAt: invitation.acceptedAt?.toISOString() ?? null,
      createdAt: invitation.createdAt.toISOString(),
    })),
  });
}

/** POST /api/admin/invitations — create + queue the invite e-mail. */
export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return forbidden();
  const guard = await requireModule(request, "invitations");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();
  const { session } = guard;

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "ফর্মের তথ্য যাচাই করুন।",
        fields: Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0] ?? "form", issue.message])),
      },
      { status: 400 },
    );
  }
  const { email, name, role, courseId, note } = parsed.data;

  if (role === "TEACHER" && !courseId) {
    return NextResponse.json(
      { ok: false, error: "শিক্ষকের আমন্ত্রণের জন্য একটি কোর্স বাছাই করুন।", fields: { courseId: "কোর্স বাছাই করুন।" } },
      { status: 400 },
    );
  }
  if (courseId) {
    const course = await db.course.findUnique({ where: { id: courseId }, select: { id: true } });
    if (!course) {
      return NextResponse.json(
        { ok: false, error: "কোর্সটি পাওয়া যায়নি।", fields: { courseId: "কোর্সটি পাওয়া যায়নি।" } },
        { status: 400 },
      );
    }
  }
  const existingUser = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existingUser) {
    return NextResponse.json(
      { ok: false, error: "এই ইমেইলে ইতিমধ্যেই একটি অ্যাকাউন্ট আছে।", fields: { email: "এই ইমেইলে অ্যাকাউন্ট আছে।" } },
      { status: 409 },
    );
  }

  const invitation = await createInvitation({
    email,
    name,
    role,
    courseId: courseId ?? null,
    note,
    createdById: session.user.id,
  });

  const mail = invitationEmailHtml({
    linkUrl: `${env.siteUrl}${invitation.linkPath}`,
    role,
    inviterName: session.user.name,
  });
  await queueOutboxEmail({
    to: email.toLowerCase(),
    subject: mail.subject,
    body: mail.body,
    html: mail.html,
    kind: "invitation",
  });

  await audit(
    session.user.id,
    "invitation.create",
    "Invitation",
    invitation.id,
    { after: { email, role } },
    request.headers.get("x-forwarded-for"),
  );

  return NextResponse.json({
    ok: true,
    invitation: {
      id: invitation.id,
      expiresAt: invitation.expiresAt.toISOString(),
      linkPath: invitation.linkPath,
    },
  });
}
