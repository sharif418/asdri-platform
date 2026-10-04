import type { ReactNode } from "react";

interface AdminPageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

/** Consistent page heading for admin screens (server-render safe). */
export function AdminPageHeader({ eyebrow, title, description, children }: AdminPageHeaderProps) {
  return (
    <header className="mb-6 sm:mb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">{eyebrow}</p>
          <h1 className="font-heading mt-1.5 text-2xl font-bold leading-tight sm:text-[28px]">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {children ? <div className="flex flex-wrap items-center gap-2.5">{children}</div> : null}
      </div>
      <div aria-hidden className="mt-4 h-px bg-gradient-to-r from-gold/60 via-gold/25 to-transparent" />
    </header>
  );
}
