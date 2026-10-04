"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Language } from "@/types";
import { NoticeDialogView, type NoticeDetailData } from "@/components/notices/notice-dialog";

interface NoticeDeepLinkProps {
  notice: NoticeDetailData;
  lang: Language;
  /** URL to restore in the address bar once the dialog closes. */
  returnPath: string;
}

/**
 * Client island for `?notice=slug` deep links: opens that notice's
 * detail dialog on mount and strips the param on close.
 */
export function NoticeDeepLink({ notice, lang, returnPath }: NoticeDeepLinkProps) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  function handleOpenChange(next: boolean): void {
    setOpen(next);
    if (!next) {
      router.replace(returnPath, { scroll: false });
    }
  }

  return <NoticeDialogView notice={notice} lang={lang} open={open} onOpenChange={handleOpenChange} />;
}
