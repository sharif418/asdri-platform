import type { PickedMedia } from "@/components/admin/ui/media-picker";
import { LIBRARY_LANGUAGES } from "@/lib/validators/admin-library";
import type { LibraryCreatorRole, LibraryItemType, LibraryVisibility } from "@prisma/client";

/**
 * Shared vocabulary for the library admin UI — Bangla labels for the enums
 * and the dialog's draft types. Every shelf string field is a string in the
 * draft (number inputs included) so the controls stay fully controlled;
 * the dialog converts on save.
 */

/** Bangla labels shared by the dialog and the manager table. */
export const LIBRARY_TYPE_LABELS_BN: Record<LibraryItemType, string> = {
  BOOK: "বই",
  JOURNAL_ISSUE: "জার্নাল সংখ্যা",
  PAPER: "রিসার্চ পেপার",
  DIGITAL_FILE: "ডিজিটাল ফাইল",
};

export const LIBRARY_ROLE_LABELS_BN: Record<LibraryCreatorRole, string> = {
  AUTHOR: "লেখক",
  EDITOR: "সম্পাদক",
  TRANSLATOR: "অনুবাদক",
};

export const LIBRARY_LANGUAGE_LABELS_BN: Record<(typeof LIBRARY_LANGUAGES)[number], string> = {
  bn: "বাংলা",
  en: "ইংরেজি",
  ar: "আরবি",
  mixed: "মিশ্র",
};

export interface LibraryCreatorRow {
  nameBn: string;
  nameEn: string;
  role: LibraryCreatorRole;
}

/** The dialog's working state — strings everywhere so inputs stay controlled. */
export interface LibraryItemDraft {
  id?: string;
  type: LibraryItemType;
  titleBn: string;
  titleEn: string;
  subtitleBn: string;
  subtitleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  language: (typeof LIBRARY_LANGUAGES)[number];
  categoryId: string;
  creators: LibraryCreatorRow[];
  publisherBn: string;
  publisherEn: string;
  publishYear: string;
  publishPlaceBn: string;
  isbn: string;
  issn: string;
  doi: string;
  editionBn: string;
  volume: string;
  issueLabel: string;
  journalNameBn: string;
  journalNameEn: string;
  journalKey: string;
  externalUrl: string;
  visibility: LibraryVisibility;
  isPublished: boolean;
  filePages: string;
  media: PickedMedia | null;
  cover: PickedMedia | null;
}

export function emptyLibraryItemDraft(): LibraryItemDraft {
  return {
    type: "BOOK",
    titleBn: "",
    titleEn: "",
    subtitleBn: "",
    subtitleEn: "",
    descriptionBn: "",
    descriptionEn: "",
    language: "bn",
    categoryId: "",
    creators: [],
    publisherBn: "",
    publisherEn: "",
    publishYear: "",
    publishPlaceBn: "",
    isbn: "",
    issn: "",
    doi: "",
    editionBn: "",
    volume: "",
    issueLabel: "",
    journalNameBn: "",
    journalNameEn: "",
    journalKey: "",
    externalUrl: "",
    visibility: "PUBLIC",
    isPublished: true,
    filePages: "",
    media: null,
    cover: null,
  };
}

export interface LibraryCategoryOption {
  id: string;
  nameBn: string;
  nameEn: string;
  parentId: string | null;
}
