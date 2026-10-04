import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/security";

export const dynamic = "force-dynamic";

/** GET /api/auth/me — the signed-in user (null when anonymous). */
export async function GET(): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError("লগইন করা নেই", "UNAUTHORIZED", 401);
  }
  return jsonOk({ user });
}
