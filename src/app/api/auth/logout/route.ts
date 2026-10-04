import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, CSRF_COOKIE, getSession, destroySession } from "@/lib/auth";
import { isSameOrigin, jsonError, jsonOk } from "@/lib/security";

export const dynamic = "force-dynamic";

/** POST /api/auth/logout — destroy the DB session and clear cookies. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid origin", "UNAUTHORIZED", 403);
  }

  const session = await getSession();
  if (session) {
    await destroySession(session.session.id);
  }

  const response = jsonOk({ message: "সফলভাবে লগআউট হয়েছে" });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(CSRF_COOKIE, "", {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
