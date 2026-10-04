import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  SESSION_COOKIE,
  createSessionToken,
  hashPassword,
  sessionCookieOptions,
  type SessionRole,
} from "@/lib/auth";
import { getClientIp, isSameOrigin, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { registerSchema, zodFields } from "@/lib/validators";

export const dynamic = "force-dynamic";

/** POST /api/auth/register — create an account and sign the user in immediately. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid origin", "UNAUTHORIZED", 403);
  }

  const ip = getClientIp(request);
  const limiter = rateLimit({ key: "auth-register", identifier: ip, limit: 5, windowMs: 10 * 60_000 });
  if (!limiter.ok) {
    return jsonError("অনেকবার চেষ্টা করেছেন, কিছুক্ষণ পর আবার করুন", "RATE_LIMIT", 429);
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
          role: parsed.data.role,
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

    const token = createSessionToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as SessionRole,
    });

    const response = jsonOk(
      { user: { name: user.name, email: user.email, role: user.role }, message: "অ্যাকাউন্ট তৈরি হয়েছে — স্বাগতম!" },
      201,
    );
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return response;
  } catch {
    return jsonError("সার্ভারে সমস্যা হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন", "SERVER", 500);
  }
}
