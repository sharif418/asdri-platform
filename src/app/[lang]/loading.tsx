import { BrandMonoMark } from "@/components/shared/logo";

/**
 * Branded segment loader for the language-prefixed site — the mono-emerald
 * mark with three softly pulsing gold dots. Deliberately wordless so it is
 * correct in both languages while a page is streaming in.
 *
 * ⚠️ REVIEW NOTE (r4-2b): this Suspense boundary flushes the shell before a
 * page's notFound() resolves, so while it exists every 404 in the [lang]
 * tree streams the not-found content with HTTP 200 instead of 404 — the same
 * failure mode the (site)/loading.tsx removal documented in not-found.tsx.
 * Verified: `curl -o /dev/null -w "%{http_code}" localhost:3000/no-such-page`
 * → 200 with this file, 404 without it. Keep only if that trade-off is
 * accepted; deleting this one file restores strict 404 statuses.
 */
export default function LangLoading() {
  return (
    <div role="status" aria-label="লোড হচ্ছে… / Loading…" className="flex min-h-[60vh] flex-col items-center justify-center gap-5 bg-background">
      <BrandMonoMark tone="emerald" className="h-12" />
      <span aria-hidden className="flex items-center gap-1.5">
        {[0, 1, 2].map((dot) => (
          <span key={dot} className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" style={{ animationDelay: `${dot * 200}ms` }} />
        ))}
      </span>
    </div>
  );
}
