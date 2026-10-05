import { notFound } from "next/navigation";

/**
 * Admin catch-all — any /admin/* path no concrete module claims lands here,
 * so we delegate to the admin group's branded not-found boundary instead of
 * Next's default error page. (Concrete admin routes always win over the
 * catch-all; /admin/login is redirected to /login before routing.)
 */
export default function AdminCatchAllPage() {
  notFound();
}
