import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isSameOrigin, rateLimit } from "@/lib/security";
import { acceptInvitation, homeForRole } from "@/lib/invitations";
import { SESSION_COOKIE, CSRF_COOKIE } from "@/lib/auth";

const schema = z.object({
  token: z.string().min(20, "আমন্ত্রণ টোকেন পাওয়া যায়নি।"),
  password: z.string().min(10, "পাসওয়ার্ড কমপক্ষে ১০ অক্ষরের হতে হবে।").max(200),
});

/**
 * POST /api/accept-invite — consume a single-use invitation: sets the
 * password, creates the account (email pre-verified), starts the session,
 * and answers with where to land (portal vs admin by role).
 *
 * Same-origin + rate limited; every token failure answers identically.
 */
export async function POST(request: NextRequest): Promise<Response> {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "অননুমোদিত অনুরোধ।" }, { status: 403 });
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const limiter = rateLimit({ key: "accept-invite", identifier: ip, limit: 8, windowMs: 15 * 60 * 1000 });
  if (!limiter.ok) {
    return NextResponse.json(
      { ok: false, error: "অনেকবার চেষ্টা করা হয়েছে — কিছুক্ষণ পরে আবার করুন।" },
      { status: 429, headers: { "retry-after": String(limiter.retryAfterSec) } },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "ফর্মের তথ্য যাচাই করুন।" },
      { status: 400 },
    );
  }

  const result = await acceptInvitation(parsed.data.token, parsed.data.password, {
    ip,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });
  if (!result.ok) {
    const message =
      result.error === "email-taken"
        ? "এই ইমেইলে ইতিমধ্যেই একটি অ্যাকাউন্ট আছে — লগইন করুন বা অফিসে জানান।"
        : "লিংকটি আর বৈধ নয়।";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true, home: homeForRole(result.role) });
  response.cookies.set(SESSION_COOKIE, result.cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: result.maxAge,
  });
  // the CSRF cookie mirrors the session token (double-submit pattern)
  response.cookies.set(CSRF_COOKIE, result.csrfToken, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: result.maxAge,
  });
  return response;
}
