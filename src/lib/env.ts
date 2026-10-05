/**
 * Environment access with production enforcement.
 *
 * In production the app refuses to boot when a required secret is missing or
 * obviously a dev placeholder — failing fast is safer than running with a
 * guessable session key.
 */

const DEV_PLACEHOLDER = /^dev-only/i;

export function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    if (isProd()) {
      throw new Error(`Missing required environment variable: ${name}. Refusing to start.`);
    }
    return "";
  }
  return value;
}

function secret(name: string, devDefault: string): string {
  const value = process.env[name];
  if (!value || DEV_PLACEHOLDER.test(value)) {
    if (isProd()) {
      throw new Error(
        `${name} must be set to a real secret in production (dev placeholders are rejected).`,
      );
    }
    return devDefault;
  }
  return value;
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
  get paymentProvider(): string {
    return process.env.PAYMENT_PROVIDER ?? "sandbox";
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
