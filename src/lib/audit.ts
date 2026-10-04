import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";

/**
 * Admin accountability — every privileged write is recorded to AdminAction.
 * Auditing must never break the primary operation, so failures are swallowed
 * (the admin UI surfaces nothing; the log is best-effort append-only).
 */

export const ADMIN_ACTION_TYPES = [
  "notice.create",
  "notice.update",
  "notice.delete",
  "notice.pin",
  "notice.unpin",
  "fatwa.answer",
  "fatwa.publish",
  "fatwa.delete",
  "message.status",
  "message.delete",
  "subscriber.delete",
  "campaign.create",
  "campaign.update",
  "campaign.status",
  "campaign.delete",
  "donation.status",
] as const;

export type AdminActionType = (typeof ADMIN_ACTION_TYPES)[number];

export type AdminActionGroup = "notice" | "fatwa" | "message" | "subscriber" | "campaign" | "donation";

export function adminActionGroup(action: AdminActionType): AdminActionGroup {
  return action.split(".")[0] as AdminActionGroup;
}

/** Best-effort audit append — call after the primary mutation succeeds. */
export async function logAdminAction(params: {
  actor: SessionUser;
  action: AdminActionType;
  entityRef: string;
  summaryBn: string;
}): Promise<void> {
  try {
    await db.adminAction.create({
      data: {
        actorId: params.actor.id,
        actorName: params.actor.name,
        actorEmail: params.actor.email,
        action: params.action,
        entityRef: params.entityRef.slice(0, 300),
        summaryBn: params.summaryBn.slice(0, 500),
      },
      select: { id: true },
    });
  } catch {
    // Never surface audit failures to the admin flow.
  }
}
