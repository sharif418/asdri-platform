"use client";

import { useState } from "react";
import { CircleHelp } from "lucide-react";
import type { FaqGroup } from "@/types";
import { pick } from "@/types";
import type { Language } from "@/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FaqExplorerProps {
  groups: FaqGroup[];
  lang: Language;
}

/**
 * FAQ browser — one tab per group (admission / courses / donations)
 * with smooth Radix accordion animation inside each panel.
 */
export function FaqExplorer({ groups, lang }: FaqExplorerProps) {
  const [active, setActive] = useState(groups[0]?.id ?? "");

  return (
    <Tabs value={active} onValueChange={setActive} className="gap-6">
      <div className="flex justify-center">
        <TabsList
          aria-label={lang === "bn" ? "প্রশ্নের ক্যাটাগরি" : "Question categories"}
          className="h-auto w-full max-w-2xl flex-wrap justify-center gap-1 rounded-2xl p-1.5"
        >
          {groups.map((group) => (
            <TabsTrigger
              key={group.id}
              value={group.id}
              className="rounded-xl px-4 py-2 text-[13px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {pick(group.title, lang)}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {groups.map((group) => (
        <TabsContent key={group.id} value={group.id} className="mt-0">
          <div className="rounded-2xl border bg-card px-5 py-1 shadow-sm sm:px-7">
            <Accordion
              type="single"
              collapsible
              className="divide-y divide-border"
            >
              {group.items.map((item, index) => (
                <AccordionItem key={`${group.id}-${index}`} value={`${group.id}-${index}`} className="border-b-0">
                  <AccordionTrigger className="gap-4 py-5 text-left text-[15px] font-semibold hover:text-primary hover:no-underline [&>svg]:text-gold">
                    <span className="flex items-start gap-3">
                      <CircleHelp aria-hidden className="mt-1 hidden h-4 w-4 shrink-0 text-gold sm:block" />
                      {pick(item.question, lang)}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                    <p className="sm:pl-7">{pick(item.answer, lang)}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground" aria-live="polite">
            {lang === "bn"
              ? `${group.items.length} টি প্রশ্ন — ${pick(group.title, lang)}`
              : `${group.items.length} questions — ${pick(group.title, lang)}`}
          </p>
        </TabsContent>
      ))}
    </Tabs>
  );
}
