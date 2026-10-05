/**
 * Test-runner preload (registered via `bun test --preload tests/preload.ts`).
 *
 * Guarantees integration tests NEVER touch the dev database: before any test
 * module (and therefore before @/lib/db is imported) it
 *   1. resolves the dev DATABASE_URL (explicit postgres env var, else the
 *      .env file — a stale shell export must never leak the sandbox default),
 *   2. derives the admin connection (same host/port/user, database `postgres`),
 *   3. drops + recreates `asdri_test` for a clean slate,
 *   4. applies the committed migrations to it (prisma migrate deploy),
 *   5. points process.env.DATABASE_URL at the test DB.
 *
 * Idempotent by design: if DATABASE_URL already names the test DB, the same
 * admin/test URLs are derived, so re-running the preload is harmless.
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const TEST_DB = "asdri_test";

function isPostgresUrl(value: string | undefined): value is string {
  return !!value && (value.startsWith("postgresql://") || value.startsWith("postgres://"));
}

/** Resolve the dev database URL: env var first (CI), then the .env file (dev). */
function devDatabaseUrl(): string {
  if (isPostgresUrl(process.env.DATABASE_URL)) return process.env.DATABASE_URL;
  // A shell-level DATABASE_URL (e.g. the sandbox's sqlite default) must not
  // shadow the project's real connection — read .env directly instead.
  for (const line of readFileSync(resolve(process.cwd(), ".env"), "utf8").split("\n")) {
    const match = /^DATABASE_URL\s*=\s*"?([^"\n]+)"?\s*$/.exec(line);
    if (match && isPostgresUrl(match[1])) return match[1];
  }
  throw new Error(
    "tests/preload.ts: no postgres DATABASE_URL found (checked process.env and .env).",
  );
}

function deriveUrls(original: string): { admin: string; test: string } {
  const admin = new URL(original);
  admin.pathname = "/postgres";
  admin.search = "";
  const test = new URL(original);
  test.pathname = `/${TEST_DB}`;
  test.search = "";
  return { admin: admin.toString(), test: test.toString() };
}

const original = devDatabaseUrl();
const { admin: adminUrl, test: testUrl } = deriveUrls(original);
console.log(`[test-db] provisioning ${TEST_DB} (dev DB untouched: ${original})`);

const admin = new PrismaClient({ datasourceUrl: adminUrl });
try {
  await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${TEST_DB}" WITH (FORCE)`);
  await admin.$executeRawUnsafe(`CREATE DATABASE "${TEST_DB}"`);
} finally {
  await admin.$disconnect();
}

try {
  execSync("bunx prisma migrate deploy", {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: "pipe",
  });
} catch (error) {
  const stderr = error instanceof Error && "stderr" in error ? String((error as { stderr?: Buffer }).stderr) : "";
  throw new Error(`tests/preload.ts: prisma migrate deploy failed for ${testUrl}\n${stderr}`);
}

process.env.DATABASE_URL = testUrl;
console.log(`[test-db] ready → ${testUrl}`);
