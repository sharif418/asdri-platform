import { redirect } from "next/navigation";

/**
 * Section root for ফতোয়া ব্যবস্থাপনা — no index view of its own; jump
 * straight to the first management page (question inbox).
 */
export default function AdminFatwaIndexPage() {
  redirect("/admin/fatwa/questions");
}
