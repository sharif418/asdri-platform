"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { langPath } from "@/lib/locale";
import { cn } from "@/lib/utils";

export interface NavSectionView {
  label: string;
  href: string;
  children: { label: string; href: string }[];
}

/**
 * One top-level nav item, with the semantics the round-4 brief asked for:
 *
 *   - a click on the parent's name NAVIGATES to the section landing page —
 *     the same thing happens on desktop, on touch, and in the drawer
 *   - the panel opens on hover / keyboard focus (pointer users get the
 *     classic dropdown), and through the chevron button — a visible,
 *     focusable affordance that says "there is more here"
 *   - Escape closes the panel; the chevron announces state via aria-expanded
 *
 * The panel itself is positioned under its own trigger (absolute inside the
 * item) — never in a shared viewport at the list's start.
 */
export function NavDisclosure({
  section,
  active,
  align = "left",
  condensed = false,
}: {
  section: NavSectionView;
  active: boolean;
  align?: "left" | "right";
  condensed?: boolean;
}) {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const hasChildren = section.children.length > 0;

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && open) {
      setOpen(false);
      const chevron = itemRef.current?.querySelector<HTMLButtonElement>("[data-nav-chevron]");
      chevron?.focus();
    }
  }

  return (
    <div
      ref={itemRef}
      className="group relative"
      data-open={open}
      onKeyDown={onKeyDown}
      onBlur={(event) => {
        // close the click-opened panel when focus leaves the item entirely
        if (open && !event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
      }}
    >
      <span className="relative flex items-center">
        <Link
          href={langPath(lang, section.href)}
          aria-current={active ? "page" : undefined}
          className={cn(
            "link-sweep whitespace-nowrap rounded-md px-2 py-2 text-[12.5px] font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring 2xl:px-3 2xl:text-[14px]",
            condensed && "px-2",
            active && "text-primary font-semibold",
          )}
        >
          {section.label}
        </Link>
        {hasChildren ? (
          <button
            type="button"
            data-nav-chevron
            aria-expanded={open}
            aria-label={`${section.label} — ${lang === "bn" ? "সাব-মেনু" : "submenu"}`}
            onClick={() => setOpen((value) => !value)}
            className={cn(
              "-ml-1.5 rounded-md p-1 text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "group-hover:text-primary",
            )}
          >
            <ChevronDown
              aria-hidden
              className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")}
            />
          </button>
        ) : null}
        {active ? (
          <span
            aria-hidden
            className="bg-gold-gradient pointer-events-none absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full"
          />
        ) : null}
      </span>

      {hasChildren ? (
        <div
          className={cn(
            "absolute left-0 top-full z-50 pt-2.5",
            align === "right" && "left-auto right-0",
            // hover / focus-within open the panel for pointer + keyboard users
            "invisible opacity-0 transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100",
            // when opened by the chevron it stays open regardless of hover
            open && "visible opacity-100",
          )}
        >
          <div className="min-w-[270px] overflow-hidden rounded-xl border border-border/80 bg-popover shadow-lg shadow-emerald-950/10">
            <p className="border-b bg-secondary/50 px-4 py-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {lang === "bn" ? "এই সেকশনে" : "In this section"}
            </p>
            <ul className="max-h-[70vh] overflow-y-auto p-1.5">
              {section.children.map((child) => (
                <li key={child.href}>
                  <Link
                    href={langPath(lang, child.href)}
                    className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-[13.5px] transition-colors hover:bg-secondary hover:text-primary"
                  >
                    <span className="whitespace-nowrap">{child.label}</span>
                    <span aria-hidden className="text-[10px] text-gold">
                      ◆
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href={langPath(lang, section.href)}
              className="flex items-center justify-between border-t bg-gold-soft/40 px-4 py-2.5 text-[12.5px] font-semibold text-primary transition-colors hover:bg-gold-soft/70"
            >
              {lang === "bn" ? "সম্পূর্ণ সেকশন দেখুন" : "View the full section"}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
