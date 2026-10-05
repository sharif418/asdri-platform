/**
 * Next.js instrumentation hook — runs once when the server (dev or the
 * standalone production server) boots. This is where eager environment
 * validation happens: a misconfigured production deploy fails at STARTUP with
 * a precise message, not on the first request.
 *
 * The build phase is exempt inside validateEnv (NEXT_PHASE), so `next build`
 * never needs a live database or real secrets.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("@/lib/env");
    const problems = validateEnv();
    if (problems.length) {
      // Dev/test only (validateEnv throws in production): surface, don't die.
      console.warn(`[env] non-fatal environment notes: ${problems.join(" ")}`);
    }
  }
}
