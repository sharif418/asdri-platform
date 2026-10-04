import { UserCog } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UsersManager, type UserRow } from "@/components/admin/users-manager";

export const metadata = { title: "ইউজার ও রোল" };

/** User & role management (ADMIN only). */
export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "users")) redirect("/admin");

  const users = await db.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true },
  });

  const rows: UserRow[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    isSelf: user.id === session.user.id,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
        <UserCog aria-hidden className="h-6 w-6 text-primary" />
        ইউজার ও রোল
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        স্টাফ অ্যাকাউন্ট ও পারমিশন — পাসওয়ার্ড কখনো সংরক্ষিত থাকে না, তৈরির সময় একবারই দেখানো হয়।
      </p>
      <UsersManager key={rows.map((row) => `${row.id}:${row.role}:${row.isActive}`).join("|")} users={rows} />
    </div>
  );
}
