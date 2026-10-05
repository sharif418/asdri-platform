-- Full-text search upgrade: weighted tsvector columns + GIN indexes.
-- Bengali text is analysed with the 'simple' config (whitespace tokenisation —
-- Bengali needs no dictionary stemming) and English with 'english' (stemming:
-- donate/donation/donor collapse to one lexeme). Weights favour question/title
-- hits (A) over answer/body hits (B) so ranked search surfaces the most
-- relevant entries first. Answers/bodies are stored as sanitised rich HTML, so
-- tags are stripped before tokenising (immutable regexp_replace — required for
-- GENERATED ALWAYS columns).

ALTER TABLE "FatwaEntry" ADD COLUMN "searchTsv" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', regexp_replace(coalesce("questionBn", ''), '<[^>]*>', ' ', 'g')), 'A')
    || setweight(to_tsvector('simple', regexp_replace(coalesce("answerBn", ''), '<[^>]*>', ' ', 'g')), 'B')
    || setweight(to_tsvector('english', regexp_replace(coalesce("questionEn", ''), '<[^>]*>', ' ', 'g')), 'A')
    || setweight(to_tsvector('english', regexp_replace(coalesce("answerEn", ''), '<[^>]*>', ' ', 'g')), 'B')
  ) STORED;

CREATE INDEX "FatwaEntry_searchTsv_idx" ON "FatwaEntry" USING GIN ("searchTsv");

ALTER TABLE "Notice" ADD COLUMN "searchTsv" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', regexp_replace(coalesce("titleBn", '') || ' ' || coalesce("excerptBn", ''), '<[^>]*>', ' ', 'g')), 'A')
    || setweight(to_tsvector('simple', regexp_replace(coalesce("bodyBn", ''), '<[^>]*>', ' ', 'g')), 'B')
    || setweight(to_tsvector('english', regexp_replace(coalesce("titleEn", '') || ' ' || coalesce("excerptEn", ''), '<[^>]*>', ' ', 'g')), 'A')
    || setweight(to_tsvector('english', regexp_replace(coalesce("bodyEn", ''), '<[^>]*>', ' ', 'g')), 'B')
  ) STORED;

CREATE INDEX "Notice_searchTsv_idx" ON "Notice" USING GIN ("searchTsv");
