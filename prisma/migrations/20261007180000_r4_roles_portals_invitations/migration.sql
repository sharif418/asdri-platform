-- Round 4: roles & portals — new UserRole values, Invitation, GuardianLink, TeacherAssignment

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'TEACHER';
ALTER TYPE "UserRole" ADD VALUE 'STUDENT';
ALTER TYPE "UserRole" ADD VALUE 'GUARDIAN';
ALTER TYPE "UserRole" ADD VALUE 'LIBRARIAN';
ALTER TYPE "UserRole" ADD VALUE 'DONOR';
ALTER TYPE "UserRole" ADD VALUE 'ALUMNI';

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "courseId" TEXT,
    "note" TEXT DEFAULT '',
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "acceptedUserId" TEXT,
    "createdById" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianLink" (
    "id" TEXT NOT NULL,
    "guardianUserId" TEXT NOT NULL,
    "applicationId" TEXT,
    "studentUserId" TEXT,
    "studentNameBn" TEXT NOT NULL,
    "relation" TEXT NOT NULL DEFAULT 'অভিভাবক',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardianLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherAssignment" (
    "id" TEXT NOT NULL,
    "teacherUserId" TEXT,
    "personId" TEXT,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");
CREATE INDEX "Invitation_email_idx" ON "Invitation"("email");
CREATE INDEX "Invitation_role_createdAt_idx" ON "Invitation"("role", "createdAt" DESC);
CREATE INDEX "GuardianLink_guardianUserId_idx" ON "GuardianLink"("guardianUserId");
CREATE UNIQUE INDEX "GuardianLink_applicationId_key" ON "GuardianLink"("applicationId");
CREATE INDEX "TeacherAssignment_teacherUserId_idx" ON "TeacherAssignment"("teacherUserId");
CREATE INDEX "TeacherAssignment_courseId_idx" ON "TeacherAssignment"("courseId");

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuardianLink" ADD CONSTRAINT "GuardianLink_guardianUserId_fkey" FOREIGN KEY ("guardianUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuardianLink" ADD CONSTRAINT "GuardianLink_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuardianLink" ADD CONSTRAINT "GuardianLink_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_teacherUserId_fkey" FOREIGN KEY ("teacherUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
