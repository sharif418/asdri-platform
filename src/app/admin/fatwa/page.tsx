import { redirect } from "next/navigation";

/** Section root — the fatwa desk lives in its first tab. */
export default function AdminFatwaPage() {
  redirect("/admin/fatwa/questions");
}
