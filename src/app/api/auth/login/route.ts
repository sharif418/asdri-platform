import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
  verifyPassword,
  type SessionRole,
} from "@/lib/auth";
import { getClientIp, isSameOrigin, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { loginSchema, zodFields } from "@/lib/validators";

export const dynamic = "force-dynamic";

/** POST /api/auth/login — verify credentials and set the session cookie. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid origin", "UNAUTHORIZED", 403);
  }

  const ip = getClientIp(request);
  const limiter = rateLimit({ key: "auth-login", identifier: ip, limit: 8, windowMs: 10 * 60_000 });
  if (!limiter.ok) {
    return jsonError("অনেকবার চেষ্টা করেছেন, কিছুক্ষণ পর আবার করুন", "RATE_LIMIT", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", "VALIDATION", 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ইমেইল বা পাসওয়ার্ড সঠিক নয়", code: "VALIDATION", fields: zodFields(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const user = await db.user.findUnique({ where: { email: parsed.data.email } });

    // Generic failure message — never reveal whether the email exists.
    if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
      return jsonError("ইমেইল বা পাসওয়ার্ড সঠিক নয়", "UNAUTHORIZED", 401);
    }

    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = createSessionToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as SessionRole,
    });

    const response = jsonOk({
      user: { name: user.name, email: user.email, role: user.role },
      message: "সফলভাবে লগইন হয়েছে",
    });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return response;
  } catch {
    return jsonError("সার্ভারে সমস্যা হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন", "SERVER", 500);
  }
}
