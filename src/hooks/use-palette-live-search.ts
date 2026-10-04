"use client";

import { useEffect, useState } from "react";

/** Minimum characters before the palette queries the live database. */
const MIN_QUERY_LENGTH = 2;
/** Debounce window (ms) between keystrokes and the API requests. */
const DEBOUNCE_MS = 250;
/** Live items requested per source (notices / fatwa). */
const LIVE_PAGE_SIZE = 3;

/** A notice row returned by GET /api/notices (trimmed to the fields we render). */
export interface LiveNoticeItem {
  slug: string;
  titleBn: string;
  titleEn: string;
  excerptBn: string;
  excerptEn: string;
}

/** A fatwa row returned by GET /api/fatwa (trimmed to the fields we render). */
export interface LiveFatwaItem {
  slug: string;
  questionBn: string;
  questionEn: string;
  answeredBy: string;
}

export interface PaletteLiveResults {
  notices: LiveNoticeItem[];
  fatwas: LiveFatwaItem[];
  loading: boolean;
}

interface LiveSearchState {
  /** The query the stored results belong to ("" = nothing fetched yet). */
  forQuery: string;
  notices: LiveNoticeItem[];
  fatwas: LiveFatwaItem[];
  loading: boolean;
}

const IDLE_STATE: LiveSearchState = { forQuery: "", notices: [], fatwas: [], loading: false };

/** Wire shape of GET /api/notices (see src/app/api/notices/route.ts). */
interface NoticesApiEnvelope {
  data: {
    items: {
      slug: string;
      title: { bn: string; en: string };
      excerpt: { bn: string; en: string };
    }[];
  };
}

/** Wire shape of GET /api/fatwa (see src/app/api/fatwa/route.ts). */
interface FatwaApiEnvelope {
  data: {
    items: {
      slug: string;
      question: { bn: string; en: string };
      answeredBy: string;
    }[];
  };
}

/**
 * Live database search for the ⌘K command palette.
 *
 * Debounces the typed query (~250ms), then fires GET /api/notices and
 * GET /api/fatwa in parallel (Promise.all) with an AbortController that
 * cancels stale requests whenever the query changes. Failures are silent
 * — live results are progressive enhancement and must never break the
 * palette — and state is only updated from async callbacks, never
 * synchronously inside the effect body.
 */
export function usePaletteLiveSearch(query: string): PaletteLiveResults {
  const trimmed = query.trim();
  const [state, setState] = useState<LiveSearchState>(IDLE_STATE);

  useEffect(() => {
    if (trimmed.length < MIN_QUERY_LENGTH) return;

    const controller = new AbortController();
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        setState({ forQuery: trimmed, notices: [], fatwas: [], loading: true });
        try {
          const [noticesRes, fatwaRes] = await Promise.all([
            fetch(`/api/notices?q=${encodeURIComponent(trimmed)}&pageSize=${LIVE_PAGE_SIZE}`, {
              signal: controller.signal,
            }),
            fetch(`/api/fatwa?q=${encodeURIComponent(trimmed)}&pageSize=${LIVE_PAGE_SIZE}`, {
              signal: controller.signal,
            }),
          ]);
          if (!noticesRes.ok || !fatwaRes.ok) throw new Error("palette live search failed");

          const noticesPayload = (await noticesRes.json()) as NoticesApiEnvelope;
          const fatwaPayload = (await fatwaRes.json()) as FatwaApiEnvelope;

          const notices: LiveNoticeItem[] = noticesPayload.data.items.map((item) => ({
            slug: item.slug,
            titleBn: item.title.bn,
            titleEn: item.title.en,
            excerptBn: item.excerpt.bn,
            excerptEn: item.excerpt.en,
          }));
          const fatwas: LiveFatwaItem[] = fatwaPayload.data.items.map((item) => ({
            slug: item.slug,
            questionBn: item.question.bn,
            questionEn: item.question.en,
            answeredBy: item.answeredBy,
          }));

          if (cancelled) return;
          setState({ forQuery: trimmed, notices, fatwas, loading: false });
        } catch {
          // Aborted (stale query) or network/API error — silent skip.
          if (cancelled) return;
          setState({ forQuery: trimmed, notices: [], fatwas: [], loading: false });
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [trimmed]);

  // Derived view: results are only visible when they belong to the exact
  // query currently typed; the spinner also covers the debounce window.
  const active = trimmed.length >= MIN_QUERY_LENGTH && state.forQuery === trimmed;
  return {
    notices: active ? state.notices : [],
    fatwas: active ? state.fatwas : [],
    loading: (trimmed.length >= MIN_QUERY_LENGTH && state.forQuery !== trimmed) || (active && state.loading),
  };
}
