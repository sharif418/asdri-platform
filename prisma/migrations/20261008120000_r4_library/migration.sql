-- Round 4 workstream 4: the online library — categories, items, creators,
-- publishers, item↔creator links, physical checkouts and read counters.

-- CreateEnum
CREATE TYPE "LibraryItemType" AS ENUM ('BOOK', 'JOURNAL_ISSUE', 'PAPER', 'DIGITAL_FILE');
CREATE TYPE "LibraryVisibility" AS ENUM ('PUBLIC', 'MEMBERS');
CREATE TYPE "LibraryCreatorRole" AS ENUM ('AUTHOR', 'EDITOR', 'TRANSLATOR');

-- CreateTable
CREATE TABLE "LibraryCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameBn" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryCreator" (
    "id" TEXT NOT NULL,
    "nameBn" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,

    CONSTRAINT "LibraryCreator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryPublisher" (
    "id" TEXT NOT NULL,
    "nameBn" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,

    CONSTRAINT "LibraryPublisher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryItem" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "LibraryItemType" NOT NULL,
    "titleBn" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL DEFAULT '',
    "subtitleBn" TEXT NOT NULL DEFAULT '',
    "subtitleEn" TEXT NOT NULL DEFAULT '',
    "descriptionBn" TEXT NOT NULL DEFAULT '',
    "descriptionEn" TEXT NOT NULL DEFAULT '',
    "language" TEXT NOT NULL DEFAULT 'bn',
    "categoryId" TEXT,
    "publisherId" TEXT,
    "publishYear" INTEGER,
    "publishPlaceBn" TEXT NOT NULL DEFAULT '',
    "isbn" TEXT,
    "issn" TEXT,
    "doi" TEXT,
    "editionBn" TEXT NOT NULL DEFAULT '',
    "volume" TEXT NOT NULL DEFAULT '',
    "issueLabel" TEXT NOT NULL DEFAULT '',
    "journalKey" TEXT NOT NULL DEFAULT '',
    "journalNameBn" TEXT NOT NULL DEFAULT '',
    "journalNameEn" TEXT NOT NULL DEFAULT '',
    "mediaId" TEXT,
    "filePages" INTEGER,
    "coverMediaId" TEXT,
    "externalUrl" TEXT,
    "visibility" "LibraryVisibility" NOT NULL DEFAULT 'PUBLIC',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryItemCreator" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "role" "LibraryCreatorRole" NOT NULL DEFAULT 'AUTHOR',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LibraryItemCreator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryCheckout" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "borrowerName" TEXT NOT NULL,
    "borrowerPhone" TEXT NOT NULL DEFAULT '',
    "borrowerUserId" TEXT,
    "borrowedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "note" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "LibraryCheckout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryReading" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryReading_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LibraryCategory_slug_key" ON "LibraryCategory"("slug");
CREATE INDEX "LibraryCategory_parentId_sortOrder_idx" ON "LibraryCategory"("parentId", "sortOrder");
CREATE INDEX "LibraryCreator_nameBn_idx" ON "LibraryCreator"("nameBn");
CREATE UNIQUE INDEX "LibraryItem_slug_key" ON "LibraryItem"("slug");
CREATE INDEX "LibraryItem_type_isPublished_createdAt_idx" ON "LibraryItem"("type", "isPublished", "createdAt" DESC);
CREATE INDEX "LibraryItem_categoryId_idx" ON "LibraryItem"("categoryId");
CREATE INDEX "LibraryItem_journalKey_publishYear_idx" ON "LibraryItem"("journalKey", "publishYear" DESC);
CREATE UNIQUE INDEX "LibraryItemCreator_itemId_creatorId_key" ON "LibraryItemCreator"("itemId", "creatorId");
CREATE INDEX "LibraryItemCreator_itemId_sortOrder_idx" ON "LibraryItemCreator"("itemId", "sortOrder");
CREATE INDEX "LibraryCheckout_itemId_returnedAt_idx" ON "LibraryCheckout"("itemId", "returnedAt");
CREATE INDEX "LibraryCheckout_borrowerName_idx" ON "LibraryCheckout"("borrowerName");
CREATE INDEX "LibraryReading_itemId_readAt_idx" ON "LibraryReading"("itemId", "readAt" DESC);

-- AddForeignKey
ALTER TABLE "LibraryCategory" ADD CONSTRAINT "LibraryCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "LibraryCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LibraryItem" ADD CONSTRAINT "LibraryItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LibraryCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LibraryItem" ADD CONSTRAINT "LibraryItem_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "LibraryPublisher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LibraryItem" ADD CONSTRAINT "LibraryItem_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LibraryItem" ADD CONSTRAINT "LibraryItem_coverMediaId_fkey" FOREIGN KEY ("coverMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LibraryItemCreator" ADD CONSTRAINT "LibraryItemCreator_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "LibraryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LibraryItemCreator" ADD CONSTRAINT "LibraryItemCreator_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "LibraryCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LibraryCheckout" ADD CONSTRAINT "LibraryCheckout_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "LibraryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LibraryReading" ADD CONSTRAINT "LibraryReading_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "LibraryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
