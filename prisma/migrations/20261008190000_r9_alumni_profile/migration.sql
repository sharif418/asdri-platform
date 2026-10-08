-- Round-9 alumni registry (restored round-6 module): one row per graduated
-- student, office-curated. Contact fields are office/portal-only — the public
-- directory layer selects them out structurally (privacy-by-default).

-- CreateTable
CREATE TABLE "AlumniProfile" (
    "id" TEXT NOT NULL,
    "registryNo" TEXT NOT NULL,
    "userId" TEXT,
    "nameBn" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL DEFAULT '',
    "courseKey" TEXT NOT NULL,
    "batchYear" INTEGER NOT NULL,
    "batchNoBn" TEXT NOT NULL DEFAULT '',
    "occupationBn" TEXT NOT NULL DEFAULT '',
    "occupationEn" TEXT NOT NULL DEFAULT '',
    "organizationBn" TEXT NOT NULL DEFAULT '',
    "organizationEn" TEXT NOT NULL DEFAULT '',
    "districtBn" TEXT NOT NULL DEFAULT '',
    "districtEn" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "addressBn" TEXT NOT NULL DEFAULT '',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlumniProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE UNIQUE INDEX "AlumniProfile_registryNo_key" ON "AlumniProfile"("registryNo");
CREATE UNIQUE INDEX "AlumniProfile_userId_key" ON "AlumniProfile"("userId");

-- CreateTable
CREATE INDEX "AlumniProfile_courseKey_batchYear_idx" ON "AlumniProfile"("courseKey", "batchYear");
CREATE INDEX "AlumniProfile_isPublished_idx" ON "AlumniProfile"("isPublished");

-- AddForeignKey
ALTER TABLE "AlumniProfile" ADD CONSTRAINT "AlumniProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
