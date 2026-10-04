import { NextRequest, NextResponse } from "next/server";
import { Prisma, UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { SESSION_COOKIE, CSRF_COOKIE, createSession, hashPassword } from "@/lib/auth";
import { getClientIp, isSameOrigin, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { registerSchema, zodFields } from "@/lib/validators";

export const dynamic = "force-dynamic";

const ALLOWED_SELF_ROLES: UserRole[] = ["APPLICANT"];

/**
 * POST /api/auth/register — public account creation. Only applicant accounts
 * can be self-registered; staff accounts are created by an administrator.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid origin", "UNAUTHORIZED", 403);
  }

  const ip = getClientIp(request);
  const limiter = rateLimit({ key: "auth-register", identifier: ip, limit: 5, windowMs: 10 * 60_000 });
  if (!limiter.ok) {
    return jsonError("অনেকবার চেষ্টা করেছেন, কিছুক্ষণ পর আবার চেষ্টা করুন", "RATE_LIMIT", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", "VALIDATION", 400);
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ফর্মের তথ্যগুলো যাচাই করুন", code: "VALIDATION", fields: zodFields(parsed.error) },
      { status: 400 },
    );
  }

  const requestedRole = (parsed.data.role ?? "APPLICANT") as UserRole;
  const role: UserRole = ALLOWED_SELF_ROLES.includes(requestedRole) ? requestedRole : "APPLICANT";

  try {
    const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return NextResponse.json(
        {
          error: "এই ইমেইল দিয়ে ইতিমধ্যেই একটি অ্যাকাউন্ট আছে — লগইন করুন বা অন্য ইমেইল দিন",
          code: "VALIDATION",
          fields: { email: "এই ইমেইলে ইতিমধ্যেই অ্যাকাউন্ট রয়েছে" },
        },
        { status: 409 },
      );
    }

    let user;
    try {
      user = await db.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone || null,
          role,
          passwordHash: hashPassword(parsed.data.password),
        },
      });
    } catch (error) {
      // Race: another registration won the unique-email check.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return NextResponse.json(
          {
            error: "এই ইমেইল দিয়ে ইতিমধ্যেই একটি অ্যাকাউন্ট আছে — লগইন করুন",
            code: "VALIDATION",
            fields: { email: "এই ইমেইলে ইতিমধ্যেই অ্যাকাউন্ট রয়েছে" },
          },
          { status: 409 },
        );
      }
      throw error;
    }

    const { csrfToken, cookieValue, maxAge } = await createSession(user.id, {
      ip,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    const response = jsonOk(
      { user: { name: user.name, email: user.email, role: user.role }, message: "অ্যাকাউন্ট তৈরি হয়েছে — স্বাগতম!" },
      201,
    );
    const cookieBase = {
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    };
    response.cookies.set(SESSION_COOKIE, cookieValue, { ...cookieBase, httpOnly: true });
    response.cookies.set(CSRF_COOKIE, csrfToken, { ...cookieBase, httpOnly: false });
    return response;
  } catch {
    return jsonError("সার্ভারে সমস্যা হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন", "SERVER", 500);
  }
}
