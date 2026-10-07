import { describe, test, expect, beforeAll } from "bun:test";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { canAccessModule } from "@/lib/auth";
import {
  getGuardianChildren,
  getTeacherCourses,
  linkGuardianToApplication,
} from "@/lib/portals/access";
import { createInvitation, acceptInvitation } from "@/lib/invitations";
import { installCookieMock, forgeCookie, newToken, tokenHash } from "../helpers/auth-forge";
import { NextRequest } from "next/server";

/**
 * Round 4 — the portals authorization proofs the brief names:
 *
 *   1. a GUARDIAN cannot see another family's child (relation-scoped reads)
 *   2. an accountant (FINANCE) cannot edit a curriculum (module guard 403)
 *   3. teacher scoping: a TEACHER sees only their assigned courses
 *   4. invitations: single-use, expiry-refused, role applied, teacher scope
 *      assignment created — the whole onboarding path
 */

async function createRoleUser(role: "GUARDIAN" | "TEACHER" | "FINANCE" | "STUDENT", email: string) {
  return db.user.create({
    data: {
      email,
      name: `Portal ${role} Test`,
      passwordHash: hashPassword("password-12345"),
      role,
    },
  });
}

/** The test DB is migrated but not seeded — these tests own their data. */
async function ensureCourseIntake(suffix: string): Promise<{ courseId: string; intakeId: string }> {
  const stamp = Date.now() % 10000000;
  const course = await db.course.create({
    data: {
      code: `T${suffix}${stamp}`,
      slug: `test-course-${suffix}-${stamp}`,
      titleBn: `পরীক্ষা কোর্স ${suffix}`,
      titleEn: `Test Course ${suffix}`,
      isPublished: true,
    },
  });
  const intake = await db.intake.create({
    data: { courseId: course.id, year: 2026, sessionBn: "২০২৬", sessionEn: "2026" },
  });
  return { courseId: course.id, intakeId: intake.id };
}

describe("portals access scoping", () => {
  test("a guardian sees exactly their linked children — never another family's", async () => {
    const guardianA = await createRoleUser("GUARDIAN", `guardian-a-${Date.now()}@test.local`);
    const guardianB = await createRoleUser("GUARDIAN", `guardian-b-${Date.now()}@test.local`);

    const { intakeId } = await ensureCourseIntake("g");
    const base = {
      intakeId,
      fullNameBn: "সন্তান এক",
      fullNameEn: "Child One",
      fatherName: "পিতা",
      motherName: "মাতা",
      phone: "01700000001",
    };
    const appA = await db.application.create({
      data: { ...base, trackingNo: `ASDRI-2026-A${Date.now() % 100000}`, status: "SHORTLISTED" },
    });
    const appB = await db.application.create({
      data: { ...base, trackingNo: `ASDRI-2026-B${Date.now() % 100000}`, status: "SUBMITTED" },
    });

    await linkGuardianToApplication({
      guardianUserId: guardianA.id,
      applicationId: appA.id,
      studentNameBn: "সন্তান এক",
      relation: "পিতা",
    });
    await linkGuardianToApplication({
      guardianUserId: guardianB.id,
      applicationId: appB.id,
      studentNameBn: "সন্তান দুই",
      relation: "মাতা",
    });

    const forA = await getGuardianChildren(guardianA);
    const forB = await getGuardianChildren(guardianB);

    expect(forA.map((child) => child.studentNameBn)).toEqual(["সন্তান এক"]);
    expect(forB.map((child) => child.studentNameBn)).toEqual(["সন্তান দুই"]);
    // the relation IS the authorisation: A's view cannot contain B's child
    expect(forA.some((child) => child.studentNameBn === "সন্তান দুই")).toBe(false);
    expect(forB.some((child) => child.studentNameBn === "সন্তান এক")).toBe(false);
    expect(forA[0].application?.trackingNo).toBe(appA.trackingNo);

    await db.guardianLink.deleteMany({ where: { guardianUserId: { in: [guardianA.id, guardianB.id] } } });
    await db.application.deleteMany({ where: { id: { in: [appA.id, appB.id] } } });
    await db.user.deleteMany({ where: { id: { in: [guardianA.id, guardianB.id] } } });
    await db.intake.delete({ where: { id: intakeId } });
    const guardianCourse = await db.course.findFirst({ where: { intakes: { some: { id: intakeId } } } });
    void guardianCourse;
  });

  test("a teacher sees exactly their assigned courses", async () => {
    const teacher = await createRoleUser("TEACHER", `teacher-${Date.now()}@test.local`);
    const mine = await ensureCourseIntake("t1");
    const other = await ensureCourseIntake("t2");

    await db.teacherAssignment.create({ data: { teacherUserId: teacher.id, courseId: mine.courseId } });

    const view = await getTeacherCourses(teacher);
    expect(view.length).toBe(1);
    expect(view[0].courseId).toBe(mine.courseId);
    expect(view.some((course) => course.courseId === other.courseId)).toBe(false);

    await db.teacherAssignment.deleteMany({ where: { teacherUserId: teacher.id } });
    await db.intake.deleteMany({ where: { id: { in: [mine.intakeId, other.intakeId] } } });
    await db.course.deleteMany({ where: { id: { in: [mine.courseId, other.courseId] } } });
    await db.user.delete({ where: { id: teacher.id } });
  });

  test("an accountant cannot edit a curriculum — the module guard refuses", async () => {
    expect(canAccessModule("FINANCE", "academics")).toBe(false);
    expect(canAccessModule("FINANCE", "courses")).toBe(false);

    // and through the real HTTP handler: FINANCE session → curriculum PUT → 403
    const setCookie = installCookieMock();
    const accountant = await createRoleUser("FINANCE", `finance-${Date.now()}@test.local`);
    const fixture = await ensureCourseIntake("f");
    const token = newToken();
    const session = await db.session.create({
      data: {
        userId: accountant.id,
        tokenHash: tokenHash(token),
        csrfToken: "csrf-tok-123",
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    setCookie(forgeCookie(session.id, token));

    const { PUT } = await import("@/app/api/admin/courses/[id]/curriculum/route");
    const request = new NextRequest(`http://local/api/admin/courses/${fixture.courseId}/curriculum`, {
      method: "PUT",
      headers: { "content-type": "application/json", "x-csrf-token": "csrf-tok-123" },
      body: JSON.stringify({ semesters: [] }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: fixture.courseId }) });
    expect(response.status).toBe(403);

    await db.session.deleteMany({ where: { userId: accountant.id } });
    await db.user.delete({ where: { id: accountant.id } });
    await db.intake.delete({ where: { id: fixture.intakeId } });
    await db.course.delete({ where: { id: fixture.courseId } });
  });
});

describe("invitations", () => {
  test("create → accept applies the role; the token is single-use", async () => {
    const admin = await createRoleUser("FINANCE", `inviter-${Date.now()}@test.local`);
    await db.user.update({ where: { id: admin.id }, data: { role: "ADMIN" } });
    const email = `invited-${Date.now()}@test.local`;

    const invitation = await createInvitation({
      email,
      name: "আমন্ত্রিত সদস্য",
      role: "STUDENT",
      createdById: admin!.id,
    });
    expect(invitation.token.length).toBeGreaterThan(20);
    expect(invitation.linkPath.startsWith("/accept-invite?token=")).toBe(true);

    // wrong password length is refused by the page/API schema, not here — acceptInvitation trusts its caller
    const accepted = await acceptInvitation(invitation.token, "password-12345");
    expect(accepted.ok).toBe(true);
    if (accepted.ok) {
      expect(accepted.role).toBe("STUDENT");
      const user = await db.user.findUnique({ where: { email } });
      expect(user?.role).toBe("STUDENT");
      expect(user?.emailVerifiedAt).not.toBeNull(); // office-vouched email
      await db.session.deleteMany({ where: { userId: user!.id } });
      await db.user.delete({ where: { id: user!.id } });
    }

    // single-use: the same token can never be consumed again
    const again = await acceptInvitation(invitation.token, "password-12345");
    expect(again.ok).toBe(false);
    await db.invitation.delete({ where: { id: invitation.id } });
    await db.user.delete({ where: { id: admin.id } });
  });

  test("expired and unknown tokens answer the same refusal", async () => {
    const admin = await createRoleUser("FINANCE", `inviter2-${Date.now()}@test.local`);
    await db.user.update({ where: { id: admin.id }, data: { role: "ADMIN" } });
    const email = `expired-${Date.now()}@test.local`;
    const invitation = await createInvitation({
      email,
      name: "মেয়াদোত্তীর্ণ",
      role: "GUARDIAN",
      createdById: admin!.id,
    });
    await db.invitation.update({
      where: { id: invitation.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const expired = await acceptInvitation(invitation.token, "password-12345");
    const unknown = await acceptInvitation("no-such-token-at-all-xxxxxxxx", "password-12345");
    expect(expired).toEqual(unknown); // indistinguishable
    expect(expired.ok).toBe(false);
    await db.invitation.delete({ where: { id: invitation.id } });
    await db.user.delete({ where: { id: admin.id } });
  });

  test("teacher invitations carry the course scope (assignment created on accept)", async () => {
    const admin = await createRoleUser("FINANCE", `inviter3-${Date.now()}@test.local`);
    await db.user.update({ where: { id: admin.id }, data: { role: "ADMIN" } });
    const fixture = await ensureCourseIntake("ti");
    const email = `teacher-invite-${Date.now()}@test.local`;
    const invitation = await createInvitation({
      email,
      name: "নতুন শিক্ষক",
      role: "TEACHER",
      courseId: fixture.courseId,
      createdById: admin!.id,
    });
    const accepted = await acceptInvitation(invitation.token, "password-12345");
    expect(accepted.ok).toBe(true);

    if (accepted.ok) {
      const assignments = await db.teacherAssignment.findMany({
        where: { teacherUserId: accepted.userId },
        include: { course: { select: { code: true } } },
      });
      expect(assignments.map((assignment) => assignment.courseId)).toEqual([fixture.courseId]);
      await db.teacherAssignment.deleteMany({ where: { teacherUserId: accepted.userId } });
      await db.session.deleteMany({ where: { userId: accepted.userId } });
      await db.user.delete({ where: { id: accepted.userId } });
    }
    await db.invitation.delete({ where: { id: invitation.id } });
    await db.intake.delete({ where: { id: fixture.intakeId } });
    await db.course.delete({ where: { id: fixture.courseId } });
    await db.user.delete({ where: { id: admin.id } });
  });
});
