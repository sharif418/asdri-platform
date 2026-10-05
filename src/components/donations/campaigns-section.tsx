"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HandCoins, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { formatCompactTaka, formatTaka } from "@/lib/format";
import { langPath } from "@/lib/locale";
import { pick } from "@/types";
import type { FundingCampaign, Language } from "@/types";

/** Live fundraising campaigns with progress bars, fetched from GET /api/campaigns. */
export function CampaignsSection({ lang }: { lang: Language }) {
  const bn = lang === "bn";
  const [campaigns, setCampaigns] = useState<FundingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/campaigns")
      .then(async (res) => {
        if (!res.ok) throw new Error("failed");
        const payload: { data: FundingCampaign[] } = await res.json();
        if (!cancelled) setCampaigns(payload.data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="bg-parchment py-16 sm:py-20" aria-label={bn ? "চলমান ক্যাম্পেইন" : "Live campaigns"}>
      <div className="container-site">
        <Reveal>
          <SectionHeading
            eyebrow={bn ? "লাইভ আপডেট" : "Live Updates"}
            title={bn ? "চলমান ফান্ডরাইজিং ক্যাম্পেইন" : "Ongoing Funding Campaigns"}
            description={
              bn
                ? "প্রতিটি ক্যাম্পেইনের অগ্রগতি রিয়েল-টাইমে হালনাগাদ হয় — আপনার অনুদান সরাসরি নির্দিষ্ট খাতে ব্যয় হয়।"
                : "Each campaign's progress updates in real time — your donation goes directly to the designated cause."
            }
            lang={lang}
          />
        </Reveal>

        <div className="mt-10">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-36 w-full rounded-2xl" />
              <Skeleton className="h-36 w-full rounded-2xl" />
            </div>
          ) : failed || campaigns.length === 0 ? (
            <p className="rounded-2xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
              {bn
                ? "এই মুহূর্তে কোনো সক্রিয় ক্যাম্পেইন নেই — আপনার নিয়মিত অনুদান শিক্ষার্থীদের জন্য সদকায়ে জারিয়া হিসেবে ব্যয় হচ্ছে।"
                : "No active campaigns right now — regular donations continue as ongoing charity for our students."}
            </p>
          ) : (
            <Stagger className="grid gap-4 md:grid-cols-2">
              {campaigns.map((campaign) => {
                const percent = Math.min(
                  100,
                  Math.round((campaign.raisedAmount / campaign.targetAmount) * 100),
                );
                return (
                  <RevealItem key={campaign.id}>
                    <article className="h-full rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-heading flex items-center gap-2 text-[15px] font-semibold leading-snug sm:text-base">
                          <Target aria-hidden className="h-4.5 w-4.5 shrink-0 text-gold" />
                          {pick(campaign.title, lang)}
                        </h3>
                        <span className="shrink-0 rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-bold text-gold">
                          {percent}%
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                        {pick(campaign.description, lang)}
                      </p>
                      <Progress value={percent} className="mt-4 h-2.5 [&>div]:bg-gold-gradient" aria-label={`${percent}%`} />
                      <div className="mt-2.5 flex items-center justify-between text-[12.5px]">
                        <span className="font-semibold text-primary">
                          {formatCompactTaka(campaign.raisedAmount, lang)}{" "}
                          <span className="font-normal text-muted-foreground">
                            {bn ? "সংগৃহীত" : "raised"}
                          </span>
                        </span>
                        <span className="text-muted-foreground">
                          {bn ? "লক্ষ্য:" : "Target:"} {formatTaka(campaign.targetAmount, lang)}
                        </span>
                      </div>
                      <div className="mt-4 border-t pt-3.5">
                        <Link
                          href={`${langPath(lang, "/support")}?campaign=${encodeURIComponent(campaign.slug)}#donation-form`}
                          className="group/cta inline-flex min-h-11 w-full items-center justify-between rounded-xl border border-gold/40 bg-gold/[0.06] px-4 py-2.5 text-[13px] font-bold text-gold transition-all hover:border-gold/60 hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                          aria-label={`${bn ? "এই ক্যাম্পেইনে অনুদান দিন" : "Donate to this campaign"}: ${pick(campaign.title, lang)}`}
                        >
                          <span className="flex items-center gap-2">
                            <HandCoins aria-hidden className="h-4 w-4" />
                            {bn ? "এই ক্যাম্পেইনে অনুদান দিন" : "Donate to this campaign"}
                          </span>
                          <span className="transition-transform group-hover/cta:translate-x-0.5" aria-hidden>→</span>
                        </Link>
                      </div>
                    </article>
                  </RevealItem>
                );
              })}
            </Stagger>
          )}
        </div>
      </div>
    </section>
  );
}
