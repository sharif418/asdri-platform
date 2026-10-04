import { notFound } from "next/navigation";

/**
 * Catch-all 404 handler — matching this route means no real page exists,
 * so we delegate to the nearest not-found boundary (site group).
 */
export default function CatchAllPage() {
  notFound();
}
