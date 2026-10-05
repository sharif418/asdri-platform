import { redirect } from "next/navigation";
import { ScrollText } from "lucide-react";
import { getSession, roleCan } from "@/lib/auth";
import { readSetting } from "@/lib/settings";
import { AdmissionCopyForm } from "@/components/admin/admission-copy-form";

export const metadata = { title: "ভর্তি প্রক্রিয়া ও ঘোষণাপত্র" };

const FALLBACK = {
  declarationBn:
    "আমি ঘোষণা করছি যে, আমি প্রদত্ত সকল তথ্য সঠিক ও নির্ভুল। কোনো তথ্য মিথ্যা প্রমাণিত হলে আমার আবেদন বাতিল বলে গণ্য হবে।",
  declarationEn:
    "I declare that all information provided is true and correct. If any information proves false, my application will be considered cancelled.",
  applyIntroBn: "",
  applyIntroEn: "",
};

/** Admission copy editor — the apply-form declaration + intro, from the `admissions.settings` blob. */
export default async function AdminAdmissionCopyPage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "content")) redirect("/admin");

  const setting = await readSetting("admissions.settings", FALLBACK);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <a href="/admin/content" className="hover:text-primary hover:underline">
          পেজ কনটেন্ট
        </a>
        <span aria-hidden>›</span>
        <span>ভর্তি প্রক্রিয়া</span>
      </div>
      <h1 className="font-heading mt-1 flex items-center gap-2 text-2xl font-bold">
        <ScrollText aria-hidden className="h-6 w-6 text-primary" />
        ভর্তি প্রক্রিয়া ও ঘোষণাপত্র
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        আবেদন ফর্মের ঘোষণাপত্র (আইনি কপি) ও ভর্তি পেজের ভূমিকা — সেভ করলে সাথে সাথে প্রকাশ্য পেজে দেখায়।
      </p>

      <div className="mt-6">
        <AdmissionCopyForm
          initial={{
            declarationBn: setting.declarationBn ?? FALLBACK.declarationBn,
            declarationEn: setting.declarationEn ?? FALLBACK.declarationEn,
            applyIntroBn: setting.applyIntroBn ?? "",
            applyIntroEn: setting.applyIntroEn ?? "",
          }}
        />
      </div>
    </div>
  );
}
