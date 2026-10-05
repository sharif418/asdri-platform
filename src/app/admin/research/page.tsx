import { redirect } from "next/navigation";

/** Section root — the research desk lives in its first tab. */
export default function AdminResearchPage() {
  redirect("/admin/research/publications");
}
