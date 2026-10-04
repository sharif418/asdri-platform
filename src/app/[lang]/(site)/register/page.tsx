import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { Lang } from "@/lib/locale";
import { getSession } from "@/lib/auth";
import { PageHero } from "@/components/shared/page-hero";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "রেজিস্ট্রেশন",
  description:
    "শিক্ষার্থী, ডোনার বা অ্যালামনাই অ্যাকাউন্ট খুলুন — অনুদান ট্র্যাকিং, রিসিপ্ট ও আপডেটের জন্য।",
};

export default async function RegisterPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const session = await getSession();
  if (session) redirect("/account");

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "অ্যাকাউন্ট" : "Account"}
        title={lang === "bn" ? "রেজিস্ট্রেশন" : "Create Account"}
        description={
          lang === "bn"
            ? "একটি অ্যাকাউন্টেই অনুদানের ইতিহাস, রিসিপ্ট ও স্পন্সর রিপোর্ট — শিক্ষার্থী, ডোনার ও অ্যালামনাই সবার জন্য।"
            : "One account for donation history, receipts, and sponsor reports — for students, donors, and alumni."
        }
        lang={lang}
        breadcrumb={[{ label: { bn: "রেজিস্ট্রেশন", en: "Register" } }]}
        className="py-10 sm:py-14"
      />

      <section className="flex-1 bg-parchment py-12 sm:py-16" aria-label={lang === "bn" ? "রেজিস্ট্রেশন ফর্ম" : "Registration form"}>
        <div className="container-site">
          <RegisterForm lang={lang} />
        </div>
      </section>
    </>
  );
}
