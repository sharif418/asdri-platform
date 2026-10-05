"use client";

import { useCallback, useState } from "react";
import { FundCards } from "./fund-cards";
import { DonationForm } from "./donation-form";
import { ReceiptDialog } from "./receipt-dialog";
import type { PaymentChannelInfo } from "./payment-channels";
import type { ReceiptData } from "./donation-types";
import type { FundView } from "@/lib/content/funds";
import type { FundType, Language } from "@/types";

interface DonationPortalProps {
  initialFund: FundType;
  initialAmount: number | null;
  lang: Language;
  /** DB-driven fund rows (key/title/description). */
  funds: FundView[];
  /** DB-driven label lookup merged with static fallbacks. */
  fundLabels: Record<FundType, { bn: string; en: string }>;
  /** DB-driven payment channel numbers (donation form summary panel). */
  payment: PaymentChannelInfo;
}

/**
 * The interactive donation portal: selectable fund cards drive the form
 * below; a successful submission opens the payment-instructions receipt dialog.
 */
export function DonationPortal({ initialFund, initialAmount, lang, funds, fundLabels, payment }: DonationPortalProps) {
  const [fund, setFund] = useState<FundType>(initialFund);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const selectFund = useCallback((next: FundType) => {
    setFund(next);
    if (typeof document !== "undefined") {
      document.getElementById("donation-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <section className="py-14 sm:py-20" aria-label={lang === "bn" ? "অনুদান পোর্টাল" : "Donation portal"}>
      <div className="container-site">
        <FundCards selected={fund} onSelect={selectFund} lang={lang} funds={funds} />
        <DonationForm
          fundType={fund}
          initialAmount={initialAmount}
          lang={lang}
          fundLabels={fundLabels}
          payment={payment}
          onSuccess={setReceipt}
        />
        <ReceiptDialog receipt={receipt} lang={lang} fundLabels={fundLabels} onClose={() => setReceipt(null)} />
      </div>
    </section>
  );
}
