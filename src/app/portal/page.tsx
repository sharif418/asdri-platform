import { getSession } from "@/lib/auth";
import { ROLE_LABELS_BN } from "@/lib/permissions";
import { redirect } from "next/navigation";
import {
  getGuardianChildren,
  getTeacherCourses,
  getStudentSelf,
  getDonorSelf,
} from "@/lib/portals/access";
import { StudentHome } from "@/components/portal/student-home";
import { GuardianHome } from "@/components/portal/guardian-home";
import { TeacherHome } from "@/components/portal/teacher-home";
import { DonorHome } from "@/components/portal/donor-home";
import { AlumniHome } from "@/components/portal/alumni-home";

/**
 * /portal — one door, one responsibility each. The page renders exactly the
 * view the signed-in role covers and nothing else; every query behind these
 * views is scoped by the portal's relations (src/lib/portals/access.ts).
 */
export default async function PortalHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = session.user;
  const greeting = `আসসালামু আলাইকুম, ${user.name}`;

  const heading = (
    <div className="mb-8">
      <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-gold">
        {ROLE_LABELS_BN[user.role]} পোর্টাল
      </p>
      <h1 className="font-heading mt-1 text-2xl font-bold sm:text-3xl">{greeting}</h1>
    </div>
  );

  switch (user.role) {
    case "STUDENT": {
      const self = await getStudentSelf(user);
      return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {heading}
          <StudentHome self={self} />
        </div>
      );
    }
    case "GUARDIAN": {
      const children = await getGuardianChildren(user);
      return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {heading}
          <GuardianHome children_={children} />
        </div>
      );
    }
    case "TEACHER": {
      const courses = await getTeacherCourses(user);
      return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {heading}
          <TeacherHome courses={courses} />
        </div>
      );
    }
    case "DONOR": {
      const self = await getDonorSelf(user);
      return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {heading}
          <DonorHome self={self} />
        </div>
      );
    }
    case "ALUMNI":
      return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {heading}
          <AlumniHome />
        </div>
      );
    default:
      redirect("/account");
  }
}
