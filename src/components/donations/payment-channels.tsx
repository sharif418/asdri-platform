import { Landmark, Smartphone } from "lucide-react";
import type { Language } from "@/types";

/** DB-driven payment channel numbers (from the `site.payment` setting). */
export interface PaymentChannelInfo {
  bkash: string;
  nagad: string;
  rocket: string;
  bankBn: string;
}

interface PaymentChannelsProps {
  lang: Language;
  /** `on-dark` renders on the deep-emerald ground (lighter text). */
  tone?: "default" | "on-dark";
  /** Channel numbers — fetched server-side (settings are DB-backed). */
  payment: PaymentChannelInfo;
}

/**
 * Official payment channels of the institute — bKash / Nagad / Rocket
 * mobile banking plus the bank transfer details. Presentational and
 * client-safe: server callers resolve the numbers and pass them down.
 */
export function PaymentChannels({ lang, tone = "default", payment }: PaymentChannelsProps) {
  const bn = lang === "bn";
  const onDark = tone === "on-dark";

  const channels = [
    { name: "bKash", number: payment.bkash, icon: Smartphone },
    { name: "Nagad", number: payment.nagad, icon: Smartphone },
    { name: "Rocket", number: payment.rocket, icon: Smartphone },
  ];

  return (
    <div className="space-y-3">
      <ul className="grid gap-2.5 sm:grid-cols-3">
        {channels.map((channel) => (
          <li
            key={channel.name}
            className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 ${
              onDark ? "border-ivory/15 bg-white/[0.06]" : "border-border bg-card"
            }`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gold/15 text-gold">
              <channel.icon aria-hidden className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span
                className={`block text-[11px] font-semibold uppercase tracking-wide ${
                  onDark ? "text-ivory/60" : "text-muted-foreground"
                }`}
              >
                {channel.name}
              </span>
              <span
                dir="ltr"
                className={`block truncate font-mono text-[12.5px] font-semibold ${onDark ? "text-ivory" : "text-foreground"}`}
              >
                {channel.number}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <div
        className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 ${
          onDark ? "border-ivory/15 bg-white/[0.06]" : "border-border bg-card"
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gold/15 text-gold">
          <Landmark aria-hidden className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span
            className={`block text-[11px] font-semibold uppercase tracking-wide ${
              onDark ? "text-ivory/60" : "text-muted-foreground"
            }`}
          >
            {bn ? "ব্যাংক ট্রান্সফার" : "Bank Transfer"}
          </span>
          <span className={`block text-[12.5px] leading-snug ${onDark ? "text-ivory/90" : "text-foreground"}`}>
            {payment.bankBn}
          </span>
        </span>
      </div>
    </div>
  );
}
