import { cookies } from "next/headers";
import { LANG_COOKIE } from "@/lib/i18n";
import type { Language } from "@/types";

/** Server-side language resolution from the `asr-lang` cookie. Server-only. */
export async function getLang(): Promise<Language> {
  const store = await cookies();
  const value = store.get(LANG_COOKIE)?.value;
  return value === "en" ? "en" : "bn";
}
