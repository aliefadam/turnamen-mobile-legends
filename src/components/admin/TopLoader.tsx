"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Breeze/Inertia-style top loading bar for App Router navigation.
 * Starts on internal <a>/Link clicks (and back/forward), and completes
 * once the pathname actually changes. No external dependency.
 */
export default function TopLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const [fading, setFading] = useState(false);

  const visibleRef = useRef(false);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAll = () => {
    if (trickle.current) {
      clearInterval(trickle.current);
      trickle.current = null;
    }
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const start = useCallback(() => {
    if (visibleRef.current) return;
    clearAll();
    visibleRef.current = true;
    setFading(false);
    setVisible(true);
    setWidth(8);
    // Trickle towards ~90% while the next page loads
    trickle.current = setInterval(() => {
      setWidth((w) => (w >= 90 ? w : Math.min(90, w + Math.max(0.6, (90 - w) * 0.06))));
    }, 200);
    // Safety net: auto-finish if navigation never resolves
    timers.current.push(setTimeout(() => done(), 10000));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const done = useCallback(() => {
    if (!visibleRef.current) return;
    clearAll();
    setWidth(100);
    timers.current.push(
      setTimeout(() => {
        setFading(true);
        timers.current.push(
          setTimeout(() => {
            setVisible(false);
            visibleRef.current = false;
            setWidth(0);
            setFading(false);
          }, 300)
        );
      }, 200)
    );
  }, []);

  // Complete when the route changes
  useEffect(() => {
    done();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Start on internal link clicks
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;

      const anchor = (e.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      )
        return;

      start();
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [start]);

  // Cover browser back / forward
  useEffect(() => {
    const onPop = () => start();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [start]);

  if (!visible) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none transition-opacity duration-300 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className="relative h-full bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600 rounded-r-full transition-[width] duration-200 ease-out"
        style={{
          width: `${width}%`,
          boxShadow:
            "0 0 8px rgba(249,115,22,0.6), 0 0 4px rgba(245,158,11,0.5)",
        }}
      >
        {/* Glowing leading peg (NProgress style) */}
        <div
          className="absolute right-0 top-0 h-full w-20"
          style={{
            transform: "rotate(3deg) translate(0, -2px)",
            boxShadow:
              "0 0 8px rgba(249,115,22,0.9), 0 0 4px rgba(249,115,22,0.9)",
          }}
        />
      </div>
    </div>
  );
}
