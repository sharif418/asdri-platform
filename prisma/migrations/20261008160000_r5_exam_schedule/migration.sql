-- Round 5: exam-schedule persistence per intake — the officer used to
-- re-type তারিখ/সময়/স্থান into every exam-call letter print; now the
-- time and venue live beside the structured examDate and prefill every
-- letter + the public status card.

ALTER TABLE "Intake" ADD COLUMN "examTimeBn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Intake" ADD COLUMN "examVenueBn" TEXT NOT NULL DEFAULT '';
