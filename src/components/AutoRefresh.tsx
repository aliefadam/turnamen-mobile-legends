"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Periodically soft-refreshes the current route's server components so the
 * page reflects the latest data (near-realtime). Only polls while the tab is
 * visible, and refreshes immediately when the tab is refocused.
 */
export default function AutoRefresh({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router, intervalMs]);

  return null;
}
