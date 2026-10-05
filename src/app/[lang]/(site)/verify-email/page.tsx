import type { Metadata } from "next";
import { isLang, type Lang, alternatesFor } from "@/lib/locale";
import { env } from "@/lib/env";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/shared/page-hero";
import { VerifyEmailClient } from "@/components/auth/verify-email-client";

export const dynamic = "force-dynamic";

interface VerifyEmailPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const isBn = lang === "bn";
  const { canonical, languages } = alternatesFor("/verify-email", env.siteUrl);
  return {
    title: isBn ? "ইমেইল নিশ্চিতকরণ" : "Verify Email",
    description: isBn
      ? "আস-সুন্নাহ ইনস্টিটিউট অ্যাকাউন্টের ইমেইল ঠিকানা নিশ্চিত করুন।"
      : "Confirm the email address of your As-Sunnah Institute account.",
    robots: { index: false, follow: false },
    alternates: { canonical, languages },
  };
}

/**
 * Public verify-email landing (linked from the emailed token). The client
 * island POSTs the token to /api/auth/verify-email and reports the outcome.
 */
export default async function VerifyEmailPage({ params, searchParams }: VerifyEmailPageProps) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;
  const { token } = await searchParams;

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "অ্যাকাউন্ট" : "Account"}
        title={lang === "bn" ? "ইমেইল নিশ্চিতকরণ" : "Verify Email"}
        description={
          lang === "bn"
            ? "আপনার ইমেইল ঠিকানা নিশ্চিত করার শেষ ধাপ।"
            : "The final step to confirm your email address."
        }
        lang={lang}
        breadcrumb={[{ label: { bn: "ইমেইল নিশ্চিতকরণ", en: "Verify Email" } }]}
        className="py-10 sm:py-14"
      />

      <section className="flex-1 bg-parchment py-12 sm:py-16" aria-label={lang === "bn" ? "ইমেইল নিশ্চিতকরণ" : "Email verification"}>
        <div className="container-site">
          <VerifyEmailClient lang={lang} token={token ?? ""} />
        </div>
      </section>
    </>
  );
}
