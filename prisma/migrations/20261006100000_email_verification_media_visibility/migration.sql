-- Round 3: email verification (donation history is linked by email, so the
-- address must be proven before it unlocks anything), and private media
-- (applicant identity documents stop being served anonymously).

ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "EmailVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerification_tokenHash_key" ON "EmailVerification"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailVerification_userId_idx" ON "EmailVerification"("userId");

-- AddForeignKey
ALTER TABLE "EmailVerification" ADD CONSTRAINT "EmailVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex

-- AlterTable: visibility column + enum (default PUBLIC keeps every existing
-- row public; admissions uploads write PRIVATE explicitly from now on).
CREATE TYPE "MediaVisibility" AS ENUM ('PUBLIC', 'PRIVATE');
ALTER TABLE "Media" ADD COLUMN "visibility" "MediaVisibility" NOT NULL DEFAULT 'PUBLIC';
CREATE INDEX "Media_visibility_idx" ON "Media"("visibility");
