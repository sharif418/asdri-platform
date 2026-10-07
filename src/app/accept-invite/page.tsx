import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { ROLE_LABELS_BN } from "@/lib/permissions";
import { AcceptInviteForm } from "@/components/portal/accept-invite-form";

/**
 * /accept-invite?token=… — the single-use link the office sends. The page
 * shows what the invitation is for (name + role) ONLY while the token is
 * pending; used/expired/revoked/wrong tokens all render the same quiet
 * "link is no longer valid" state so invite links cannot be probed.
 */
export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const tokenHash = token ? createHash("sha256").update(token).digest("hex") : null;

  const invitation = tokenHash
    ? await db.invitation.findUnique({
        where: { tokenHash },
        include: { course: { select: { titleBn: true, code: true } } },
      })
    : null;

  const usable =
    invitation &&
    !invitation.acceptedAt &&
    !invitation.revokedAt &&
    invitation.expiresAt > new Date() &&
    !(await db.user.findUnique({ where: { email: invitation.email }, select: { id: true } }));

  if (!invitation || !usable) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-gold/20 bg-card p-8 text-center shadow-xl">
        <h1 className="font-heading text-xl font-bold">লিংকটি আর বৈধ নয়</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          এই আমন্ত্রণ লিংকটি হয় ইতিমধ্যেই ব্যবহৃত, নয়তো মেয়াদ শেষ বা বাতিল।
          অনুগ্রহ করে অফিসের সঙ্গে যোগাযোগ করে নতুন আমন্ত্রণ নিন।
        </p>
      </div>
    );
  }

  return (
    <AcceptInviteForm
      token={token ?? ""}
      name={invitation.name}
      roleLabel={ROLE_LABELS_BN[invitation.role]}
      courseLabel={invitation.course ? `${invitation.course.titleBn} (${invitation.course.code})` : null}
    />
  );
}
