import { Skeleton } from "@/components/ui/skeleton";

/**
 * Route-level transition skeleton for the public (site) group — an emerald
 * hero band and a card grid that echo the page-hero + section layout most
 * pages share, so soft navigations feel continuous instead of blank.
 * Purely presentational; it never blocks the streamed page content.
 */
export default function SiteLoading() {
  return (
    <div aria-hidden role="presentation" aria-busy="true">
      {/* hero band */}
      <section className="bg-gradient-to-b from-primary/10 to-transparent py-16 sm:py-24">
        <div className="container-site">
          <Skeleton className="h-3.5 w-28 rounded-full" />
          <Skeleton className="mt-5 h-8 w-4/5 max-w-xl sm:h-11" />
          <Skeleton className="mt-3 h-8 w-3/5 max-w-md sm:h-11" />
          <div className="mt-5 flex items-center gap-3">
            <Skeleton className="h-px w-16 bg-gold/40" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Skeleton className="h-11 w-40 rounded-lg" />
            <Skeleton className="h-11 w-32 rounded-lg" />
          </div>
        </div>
      </section>

      {/* section cards */}
      <section className="py-14">
        <div className="container-site">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-56" />
            <span className="h-px flex-1 bg-gradient-to-r from-gold/30 to-transparent" />
          </div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2.5">
                    <Skeleton className="h-4.5 w-4/5" />
                    <Skeleton className="h-3.5 w-3/5" />
                    <Skeleton className="h-3.5 w-2/3" />
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
