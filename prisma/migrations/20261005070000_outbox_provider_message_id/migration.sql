-- OutboxEmail.providerMessageId — the SMTP server's message id for
-- actually-delivered mail (MAIL_DRIVER=smtp). Nullable: log-driver rows and
-- failed sends stay null. Hand-written (not generated) so the Prisma-
-- invisible tsvector columns on FatwaEntry/Notice are left untouched.

ALTER TABLE "OutboxEmail" ADD COLUMN "providerMessageId" TEXT;
