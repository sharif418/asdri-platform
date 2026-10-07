"use client";

import { useCallback, useState } from "react";

/**
 * Shared per-field validation-error surface for admin forms (round 4, H2).
 * The APIs already answer zod failures with
 * `{ ok: false, error: "…", fields: { titleBn: "বাংলা শিরোনাম …" } }` — the
 * forms used to drop `fields` and show only the generic toast. This hook
 * keeps them in state, renders an inline Bangla `<p role="alert">` under each
 * named field via `ErrorText`, and focuses the first invalid control after a
 * failed submit (give the inputs ids from {@link fieldId}).
 */

/** Per-field API validation errors: field name → Bangla message. */
export type FieldErrors = Record<string, string>;

/** The JSON body shape of a failed admin API response. */
export interface ApiErrorBody {
  ok?: boolean;
  error?: string;
  fields?: FieldErrors;
}

/** Stable DOM id for a form field — give the input the same id. */
export function fieldId(name: string): string {
  return `field-${name}`;
}

export function useFieldErrors() {
  const [errors, setErrors] = useState<FieldErrors>({});
  /** General (non-field) message, e.g. "ফর্মের তথ্য যাচাই করুন।" */
  const [general, setGeneral] = useState<string | null>(null);

  const clear = useCallback(() => {
    setErrors({});
    setGeneral(null);
  }, []);

  /**
   * Feed the parsed JSON body of a !res.ok response. Reads `json.fields` and
   * falls back to `json.error` as the general message; focuses the first
   * invalid field that is currently rendered (BilingualField swaps the bn/en
   * inputs, so a hidden tab's input is simply skipped). Returns the general
   * message for the summary toast.
   */
  const setFromResponse = useCallback((json: ApiErrorBody | null | undefined): string | undefined => {
    const fields: FieldErrors = {};
    if (json?.fields && typeof json.fields === "object") {
      for (const [key, value] of Object.entries(json.fields)) {
        if (typeof value === "string" && value) fields[key] = value;
      }
    }
    setErrors(fields);
    setGeneral(json?.error ?? null);
    for (const name of Object.keys(fields)) {
      const el = document.getElementById(fieldId(name));
      if (el) {
        el.focus();
        el.scrollIntoView({ block: "center" });
        break;
      }
    }
    return json?.error;
  }, []);

  /** Inline error paragraph rendered under the named field (nothing when clean). */
  const ErrorText = useCallback(
    ({ name }: { name: string }) => {
      const message = errors[name];
      if (!message) return null;
      return (
        <p role="alert" className="text-[12px] font-medium text-red-600 dark:text-red-400">
          {message}
        </p>
      );
    },
    [errors],
  );

  return { errors, general, setFromResponse, clear, ErrorText };
}

/**
 * General (non-field) API error — rendered once near the top of a form when
 * the response carries no field details (or in addition to them). Nothing
 * when clean. Pair with the summary toast: the toast disappears, this stays.
 */
export function GeneralError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
    >
      {message}
    </p>
  );
}
