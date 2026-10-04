"use client";

import { useCallback, useState } from "react";
import { FundCards } from "./fund-cards";
import { DonationForm } from "./donation-form";
import { ReceiptDialog } from "./receipt-dialog";
import type { ReceiptData } from "./donation-types";
import type { FundType, Language } from "@/types";

interface DonationPortalProps {
  initialFund: FundType;
  initialAmount: number | null;
  lang: Language;
}

/**
 * The interactive donation portal: selectable fund cards drive the form
 * below; a successful submission opens the payment-instructions receipt dialog.
 */
export function DonationPortal({ initialFund, initialAmount, lang }: DonationPortalProps) {
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
        <FundCards selected={fund} onSelect={selectFund} lang={lang} />
        <DonationForm
          fundType={fund}
          initialAmount={initialAmount}
          lang={lang}
          onSuccess={setReceipt}
        />
        <ReceiptDialog receipt={receipt} lang={lang} onClose={() => setReceipt(null)} />
      </div>
    </section>
  );
}
