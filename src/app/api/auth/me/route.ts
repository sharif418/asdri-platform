import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/security";

export const dynamic = "force-dynamic";

/** GET /api/auth/me — return the signed-in user from the session cookie. */
export async function GET(): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return jsonError("লগইন করা নেই", "UNAUTHORIZED", 401);
  }
  return jsonOk({ user: session });
}
