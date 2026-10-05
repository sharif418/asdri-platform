-- OutboxEmail.attempts — running count of delivery attempts: the
-- creation-time smtp send (if MAIL_DRIVER=smtp) plus every manual
-- "retry" from the finance outbox. Non-null default 0: log-driver rows
-- are persisted without a send attempt. Hand-written (not generated) so
-- the Prisma-invisible tsvector columns on FatwaEntry/Notice are left
-- untouched (20261005070000 pattern).

ALTER TABLE "OutboxEmail" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
