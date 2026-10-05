import { redirect } from "next/navigation";

/**
 * Section root for গবেষণা ও প্রকাশনা — no index view of its own; jump
 * straight to the first management page (publications).
 */
export default function AdminResearchIndexPage() {
  redirect("/admin/research/publications");
}
