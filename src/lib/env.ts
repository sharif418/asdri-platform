/**
 * Environment access with production enforcement.
 *
 * Round 3: validation is EAGER. `validateEnv()` runs once at server boot from
 * src/instrumentation.ts (and is safe to call again): a misconfigured
 * production deployment dies at startup with a precise message instead of
 * booting and failing on the first request. The getters remain lazy-safe for
 * dev and test ergonomics.
 *
 * Production rules (build phase exempt — `next build` runs with NODE_ENV=
 * production but must never need a live database or real secrets):
 *   • DATABASE_URL must be a postgres URL
 *   • SESSION_SECRET / PAYMENT_CALLBACK_SECRET must be set and not dev placeholders
 *   • PAYMENT_PROVIDER may NOT be `sandbox` (the self-completing checkout is
 *     dev/demo only). Unset means `manual` — manual channels, no gateway links.
 *   • S3 storage must be configured (uploads on the container's disk vanish on
 *     redeploy) unless STORAGE_LOCAL_OK=1 explicitly acknowledges local disk.
 */

const DEV_PLACEHOLDER = /^dev-only/i;
const HEX64 = /^[0-9a-fA-F]{64,128}$/;

export function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

/** True while `next build` runs (NODE_ENV is already "production" there). */
function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    if (isProd() && !isBuildPhase()) {
      throw new Error(`Missing required environment variable: ${name}. Refusing to start.`);
    }
    return "";
  }
  return value;
}

function secret(name: string, devDefault: string): string {
  const value = process.env[name];
  if (!value || DEV_PLACEHOLDER.test(value)) {
    if (isProd() && !isBuildPhase()) {
      throw new Error(
        `${name} must be set to a real secret in production (dev placeholders are rejected).`,
      );
    }
    return devDefault;
  }
  return value;
}

/**
 * Eager production validation — called from instrumentation.ts at boot and by
 * the tests. Throws with an actionable message; returns the list of problems
 * in dev mode instead (never throws while NODE_ENV != production).
 */
export function validateEnv(): string[] {
  const problems: string[] = [];
  const prod = isProd() && !isBuildPhase();

  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
    problems.push("DATABASE_URL must be a PostgreSQL connection URL.");
  }

  for (const name of ["SESSION_SECRET", "PAYMENT_CALLBACK_SECRET"]) {
    const value = process.env[name] ?? "";
    if (!value) problems.push(`${name} is required.`);
    else if (DEV_PLACEHOLDER.test(value)) problems.push(`${name} is a dev placeholder.`);
    else if (prod && !HEX64.test(value)) problems.push(`${name} should be 64+ hex chars (openssl rand -hex 32).`);
  }

  const provider = process.env.PAYMENT_PROVIDER;
  if (provider === "sandbox") {
    problems.push(
      "PAYMENT_PROVIDER=sandbox is forbidden outside development: the sandbox checkout completes payments without a gateway. Use `manual` (or a real provider) in production.",
    );
  }

  if (prod && provider !== undefined && provider !== "manual" && !["bkash", "nagad", "rocket", "sslcommerz", "stripe"].includes(provider)) {
    problems.push(`PAYMENT_PROVIDER=${provider} is not a recognised provider (manual | bkash | nagad | rocket | sslcommerz | stripe).`);
  }

  const hasS3 = !!(process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY && process.env.S3_BUCKET);
  if (prod && !hasS3 && process.env.STORAGE_LOCAL_OK !== "1") {
    problems.push(
      "S3 credentials are required in production — without them uploads silently land on the container's disk and vanish on redeploy. Set S3_* (or STORAGE_LOCAL_OK=1 with a mounted volume to accept local disk explicitly).",
    );
  }

  if (prod) {
    for (const problem of problems) console.error(`[env] ${problem}`);
    if (problems.length) {
      throw new Error(
        `Refusing to start: ${problems.length} environment problem(s) (see [env] lines above).`,
      );
    }
  }
  return problems;
}

export const env = {
  get databaseUrl(): string {
    return required("DATABASE_URL");
  },
  get sessionSecret(): string {
    return secret("SESSION_SECRET", "dev-only-session-secret-not-for-production");
  },
  get paymentCallbackSecret(): string {
    return secret("PAYMENT_CALLBACK_SECRET", "dev-only-pay-callback-secret");
  },
  get s3(): { endpoint: string; region: string; bucket: string; accessKey: string; secretKey: string; forcePathStyle: boolean } | null {
    const accessKey = process.env.S3_ACCESS_KEY;
    const secretKey = process.env.S3_SECRET_KEY;
    const bucket = process.env.S3_BUCKET;
    if (!accessKey || !secretKey || !bucket) return null; // fall back to local disk driver
    return {
      endpoint: process.env.S3_ENDPOINT ?? "",
      region: process.env.S3_REGION ?? "us-east-1",
      bucket,
      accessKey,
      secretKey,
      forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? "true") === "true",
    };
  },
  get mailDriver(): "log" | "smtp" {
    return process.env.MAIL_DRIVER === "smtp" ? "smtp" : "log";
  },
  get smtpUrl(): string {
    return required("SMTP_URL");
  },
  get mailFrom(): string {
    // Verified sender configured at the provider (HUMAN_STEPS item).
    return process.env.MAIL_FROM ?? "As-Sunnah Institute <no-reply@assunnah-institute.org>";
  },
  /**
   * Payment provider selection. Defaults to `sandbox` ONLY outside production
   * (and outside the build phase, which must not care); production must pick
   * explicitly and may never pick `sandbox` (validateEnv enforces boot refusal).
   */
  get paymentProvider(): string {
    const value = process.env.PAYMENT_PROVIDER;
    if (value) {
      if (value === "sandbox" && isProd() && !isBuildPhase()) {
        throw new Error("PAYMENT_PROVIDER=sandbox is forbidden in production — refusing to serve.");
      }
      return value;
    }
    return isProd() && !isBuildPhase() ? "manual" : "sandbox";
  },
  get siteUrl(): string {
    return process.env.NEXT_PUBLIC_SITE_URL ?? "https://assunnahinstitute.org";
  },
  get seedAdminEmail(): string {
    return process.env.SEED_ADMIN_EMAIL ?? "";
  },
  get seedAdminPassword(): string {
    return process.env.SEED_ADMIN_PASSWORD ?? "";
  },
};
