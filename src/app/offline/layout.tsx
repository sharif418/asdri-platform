import type { ReactNode } from "react";

/** Self-contained root layout for the SW offline shell (no providers). */
export default function OfflineLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn" data-lang="bn">
      <body className="antialiased bg-background text-foreground">{children}</body>
    </html>
  );
}
