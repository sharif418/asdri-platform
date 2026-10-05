-- OutboxEmail: delivery attempt counter for the queue-time send and every
-- admin-initiated retry (see deliverOutboxEmail in src/lib/mail.ts).
ALTER TABLE "OutboxEmail" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
