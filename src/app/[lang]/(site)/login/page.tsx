import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { Lang } from "@/lib/locale";
import { alternatesFor } from "@/lib/locale";
import { env } from "@/lib/env";
import { getSession } from "@/lib/auth";
import { PageHero } from "@/components/shared/page-hero";
import { LoginForm } from "@/components/auth/login-form";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  const isBn = lang === "bn";
  const { canonical, languages } = alternatesFor("/login", env.siteUrl);
  return {
    title: isBn ? "লগইন" : "Sign In",
    description: isBn
      ? "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট অ্যাকাউন্টে লগইন করুন — অনুদানের রিসিপ্ট ও স্পন্সর রিপোর্ট দেখুন।"
      : "Sign in to your As-Sunnah Dawah and Research Institute account to view donation receipts and sponsor reports.",
    alternates: { canonical, languages },
  };
}

export default async function LoginPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const session = await getSession();
  if (session) redirect("/account");

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "অ্যাকাউন্ট" : "Account"}
        title={lang === "bn" ? "লগইন" : "Sign In"}
        description={
          lang === "bn"
            ? "ডোনার ড্যাশবোর্ড, অনুদানের রিসিপ্ট ও স্পন্সর রিপোর্ট দেখতে আপনার অ্যাকাউন্টে লগইন করুন।"
            : "Sign in to access your donor dashboard, donation receipts, and sponsor reports."
        }
        lang={lang}
        breadcrumb={[{ label: { bn: "লগইন", en: "Sign In" } }]}
        className="py-10 sm:py-14"
      />

      <section className="flex-1 bg-parchment py-12 sm:py-16" aria-label={lang === "bn" ? "লগইন ফর্ম" : "Login form"}>
        <div className="container-site">
          <LoginForm lang={lang} />
        </div>
      </section>
    </>
  );
}
