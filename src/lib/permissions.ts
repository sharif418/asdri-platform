import type { UserRole } from "@prisma/client";

/**
 * Round 4 — the permission model.
 *
 * Access is decided by PERMISSIONS, not role names: every role maps to a set
 * of permission strings, and the guard layer (`src/lib/auth.ts`) checks the
 * permission, never the role. A new role is a data change; a module that
 * needs finer access asks for a finer permission.
 *
 * Two kinds of access live side by side, on purpose:
 *   - MODULE permissions (what an admin screen may do) — role-based, the
 *     matrix below.
 *   - DATA scoping (whose rows a portal may read) — relation-based
 *     (GuardianLink / TeacherAssignment); a guardian's permissions say
 *     "guardian view", the relation decides WHICH children. Enforced in
 *     src/lib/portals/*, so a portal can never query outside its scope.
 */

export type Permission =
  // site & configuration
  | "settings.manage"
  | "users.manage"
  | "invitations.manage"
  | "audit.view"
  | "menus.manage"
  | "flags.manage"
  // content
  | "media.upload"
  | "media.manage"
  | "content.manage" // notices, blog, page content, FAQs, admission copy
  | "academics.manage" // courses & curricula, people
  | "research.manage" // projects, publications, downloads
  // operations
  | "admissions.manage"
  | "finance.read"
  | "finance.manage"
  | "fatwa.read"
  | "fatwa.answer"
  | "fatwa.publish"
  | "messages.read"
  // library (module ships in the round-4 library workstream)
  | "library.manage"
  // portals (data scope comes from the relations, not the permission)
  | "portal.student"
  | "portal.guardian"
  | "portal.teacher"
  | "portal.donor"
  | "portal.alumni";

/** The permission set each role carries. ADMIN is checked first in roleCan. */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [], // everything — roleCan short-circuits; the list documents intent
  EDITOR: ["media.upload", "media.manage", "content.manage", "academics.manage", "research.manage", "fatwa.read", "messages.read"],
  ADMISSIONS: ["media.upload", "admissions.manage", "messages.read"],
  FINANCE: ["media.upload", "finance.read", "finance.manage"],
  FATWA: ["media.upload", "fatwa.read", "fatwa.answer", "fatwa.publish"],
  LIBRARIAN: ["media.upload", "library.manage"],
  APPLICANT: [],
  STUDENT: ["portal.student"],
  GUARDIAN: ["portal.guardian"],
  TEACHER: ["portal.teacher"],
  DONOR: ["portal.donor"],
  ALUMNI: ["portal.alumni"],
};

/** Staff roles land in the Bangla admin; everyone else has their portal. */
export const STAFF_ROLES: UserRole[] = ["ADMIN", "EDITOR", "ADMISSIONS", "FINANCE", "FATWA", "LIBRARIAN"];

/** Portal roles (the door at /portal). APPLICANT keeps the public /account. */
export const PORTAL_ROLES: UserRole[] = ["STUDENT", "GUARDIAN", "TEACHER", "DONOR", "ALUMNI"];

export function roleCan(role: UserRole, permission: Permission): boolean {
  if (role === "ADMIN") return true;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function isStaff(role: UserRole): boolean {
  return STAFF_ROLES.includes(role);
}

export function isPortalRole(role: UserRole): boolean {
  return PORTAL_ROLES.includes(role);
}

/**
 * The admin-module guard the existing admin APIs speak (requireModule).
 * Modules map to permissions once, here — no route changes needed.
 */
export const MODULE_PERMISSIONS: Record<string, Permission> = {
  settings: "settings.manage",
  users: "users.manage",
  invitations: "invitations.manage",
  audit: "audit.view",
  menus: "menus.manage",
  flags: "flags.manage",
  media: "media.upload",
  content: "content.manage",
  academics: "academics.manage",
  research: "research.manage",
  admissions: "admissions.manage",
  finance: "finance.manage",
  fatwa: "fatwa.read",
  messages: "messages.read",
  library: "library.manage",
};

export function modulePermission(module: string): Permission | null {
  return MODULE_PERMISSIONS[module] ?? null;
}

/** The admin-module check: unknown modules fail closed to ADMIN-only. */
export function canAccessModule(role: UserRole, module: string): boolean {
  const permission = modulePermission(module);
  if (!permission) return role === "ADMIN";
  return roleCan(role, permission);
}

/** Bangla labels for the roles, for the admin UI and invitations. */
export const ROLE_LABELS_BN: Record<UserRole, string> = {
  ADMIN: "অ্যাডমিন",
  EDITOR: "সম্পাদক",
  ADMISSIONS: "ভর্তি কর্মকর্তা",
  FINANCE: "আর্থিক কর্মকর্তা",
  FATWA: "ফতোয়া বিভাগ",
  LIBRARIAN: "গ্রন্থাগারিক",
  APPLICANT: "আবেদনকারী",
  STUDENT: "শিক্ষার্থী",
  GUARDIAN: "অভিভাবক",
  TEACHER: "শিক্ষক",
  DONOR: "দাতা",
  ALUMNI: "প্রাক্তন",
};

/** One-line role explanations for officers creating accounts/invitations. */
export const ROLE_HINTS_BN: Record<UserRole, string> = {
  ADMIN: "সব মডিউল, ইউজার ও সেটিংস নিয়ন্ত্রণ করেন",
  EDITOR: "কনটেন্ট, নোটিশ, ব্লগ, কোর্স, মিডিয়া সম্পাদনা",
  ADMISSIONS: "ইনটেক, আবেদন ও ভর্তি প্রক্রিয়া",
  FINANCE: "ফান্ড, ক্যাম্পেইন, অনুদান ও লেজার",
  FATWA: "ফতোয়া প্রশ্নের উত্তর ও প্রকাশ",
  LIBRARIAN: "লাইব্রেরি ক্যাটালগ, ফাইল ও সদস্য ব্যবস্থাপনা",
  APPLICANT: "ভর্তি আবেদন ট্র্যাক করেন (নিজের আবেদন)",
  STUDENT: "নিজের কোর্স, কারিকুলাম ও নোটিশ দেখেন",
  GUARDIAN: "নিজের সন্তানদের অগ্রগতি দেখেন",
  TEACHER: "নিজের কোর্সের সিলেবাস ও শিক্ষার্থী দেখেন",
  DONOR: "নিজের অনুদানের ইতিহাস ও রিসিপ্ট দেখেন",
  ALUMNI: "প্রাক্তনদের খবর ও তথ্য",
};
