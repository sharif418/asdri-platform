import { db } from "@/lib/db";
import type { User } from "@prisma/client";

/**
 * Portal data access — every query a portal page runs goes through here, and
 * every query is scoped by the RELATION, never by client input: a guardian
 * sees exactly the children linked to their account, a teacher exactly their
 * assigned courses. The pages cannot express "another family's child".
 */

export interface GuardianChildView {
  linkId: string;
  studentNameBn: string;
  relation: string;
  application: {
    trackingNo: string;
    status: string;
    submittedAt: Date;
    courseTitleBn: string | null;
    courseCode: string | null;
  } | null;
}

/** The children THIS guardian may see — by their GuardianLinks, nothing else. */
export async function getGuardianChildren(guardian: User): Promise<GuardianChildView[]> {
  const links = await db.guardianLink.findMany({
    where: { guardianUserId: guardian.id },
    orderBy: { createdAt: "asc" },
    include: {
      application: {
        include: {
          intake: { include: { course: { select: { titleBn: true, code: true } } } },
        },
      },
    },
  });
  return links.map((link) => ({
    linkId: link.id,
    studentNameBn: link.studentNameBn,
    relation: link.relation,
    application: link.application
      ? {
          trackingNo: link.application.trackingNo,
          status: link.application.status,
          submittedAt: link.application.submittedAt,
          courseTitleBn: link.application.intake.course.titleBn,
          courseCode: link.application.intake.course.code,
        }
      : null,
  }));
}

/** Link a guardian to a child's application (officer action, admissions module). */
export async function linkGuardianToApplication(input: {
  guardianUserId: string;
  applicationId: string;
  studentNameBn: string;
  relation?: string;
}): Promise<{ ok: true } | { ok: false; error: "duplicate" }> {
  const existing = await db.guardianLink.findUnique({ where: { applicationId: input.applicationId } });
  if (existing) return { ok: false, error: "duplicate" };
  await db.guardianLink.create({
    data: {
      guardianUserId: input.guardianUserId,
      applicationId: input.applicationId,
      studentNameBn: input.studentNameBn,
      relation: input.relation ?? "অভিভাবক",
    },
  });
  return { ok: true };
}

export interface TeacherCourseView {
  assignmentId: string;
  courseId: string;
  code: string;
  slug: string;
  titleBn: string;
  titleEn: string;
  semesterCount: number;
  subjectCount: number;
}

/** The courses THIS teacher may see — by their TeacherAssignments, nothing else. */
export async function getTeacherCourses(teacher: User): Promise<TeacherCourseView[]> {
  const assignments = await db.teacherAssignment.findMany({
    where: { teacherUserId: teacher.id },
    orderBy: { createdAt: "asc" },
    include: {
      course: {
        select: {
          id: true,
          code: true,
          slug: true,
          titleBn: true,
          titleEn: true,
          isPublished: true,
          semesters: { select: { id: true, subjects: { select: { id: true } } } },
        },
      },
    },
  });
  return assignments
    .filter((a) => a.course.isPublished)
    .map((a) => ({
      assignmentId: a.id,
      courseId: a.course.id,
      code: a.course.code,
      slug: a.course.slug,
      titleBn: a.course.titleBn,
      titleEn: a.course.titleEn,
      semesterCount: a.course.semesters.length,
      subjectCount: a.course.semesters.reduce((sum, semester) => sum + semester.subjects.length, 0),
    }));
}

export interface StudentSelfView {
  applications: {
    trackingNo: string;
    status: string;
    submittedAt: Date;
    courseTitleBn: string | null;
    courseCode: string | null;
    semesterCount: number;
    courseSlug: string | null;
  }[];
}

/** A student's own applications (matched by account) + the admitted course's curriculum shape. */
export async function getStudentSelf(user: User): Promise<StudentSelfView> {
  const applications = await db.application.findMany({
    where: {
      OR: [{ userId: user.id }, { email: user.email }],
    },
    orderBy: { submittedAt: "desc" },
    include: {
      intake: {
        include: {
          course: { select: { titleBn: true, code: true, slug: true, isPublished: true, semesters: { select: { id: true } } } },
        },
      },
    },
  });
  return {
    applications: applications.map((application) => ({
      trackingNo: application.trackingNo,
      status: application.status,
      submittedAt: application.submittedAt,
      courseTitleBn: application.intake.course.titleBn,
      courseCode: application.intake.course.code,
      courseSlug: application.intake.course.isPublished ? application.intake.course.slug : null,
      semesterCount: application.intake.course.semesters.length,
    })),
  };
}

export interface DonorSelfView {
  emailVerified: boolean;
  donations: {
    receiptNo: string | null;
    trackingCode: string;
    fundNameBn: string;
    amount: number;
    status: string;
    createdAt: Date;
    completedAt: Date | null;
  }[];
}

/** A donor's own donations — email-linked and, as on /account, verification-gated. */
export async function getDonorSelf(user: User): Promise<DonorSelfView> {
  const donations = user.emailVerifiedAt
    ? await db.donation.findMany({
        where: { donorEmail: user.email },
        orderBy: { createdAt: "desc" },
        include: { fund: { select: { nameBn: true } } },
      })
    : [];
  return {
    emailVerified: !!user.emailVerifiedAt,
    donations: donations.map((donation) => ({
      receiptNo: donation.receiptNo ?? "—",
      trackingCode: donation.trackingCode,
      fundNameBn: donation.fund.nameBn,
      amount: donation.amount,
      status: donation.status,
      createdAt: donation.createdAt,
      completedAt: donation.paidAt,
    })),
  };
}
