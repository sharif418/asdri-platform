/**
 * Admin account seeder — creates (or re-syncs) the institute content-admin.
 * Password hashing mirrors src/lib/auth.ts (scrypt:salt:hash) inline so the
 * script runs standalone with bun (no next/headers import at module scope).
 *
 * Run with: bun run scripts/seed-admin.ts
 */
import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const ADMIN_EMAIL = "admin@assunnah-institute.org";
const ADMIN_NAME = "আস-সুন্নাহ ইনস্টিটিউট অ্যাডমিন";
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? "AsSunnah#Admin2026!Dawah";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

async function main(): Promise<void> {
  console.log("🌱 Seeding admin account…");

  const passwordHash = hashPassword(ADMIN_PASSWORD);

  const user = await db.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "admin", name: ADMIN_NAME, passwordHash },
    create: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      role: "admin",
      phone: "+8801700000000",
      passwordHash,
    },
  });

  console.log(`  ✓ admin ready: ${user.email} (id ${user.id})`);
  if (!process.env.ADMIN_SEED_PASSWORD) {
    console.log(`  ⚠ sandbox default password in effect — set ADMIN_SEED_PASSWORD for production`);
  }
  console.log("✅ Admin seed complete.");
}

main()
  .catch((error) => {
    console.error("❌ Admin seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    void db.$disconnect();
  });
