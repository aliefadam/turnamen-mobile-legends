"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Season } from "@/db/schema";

export default function SeasonSwitcher({
  seasons,
  activeSlug,
}: {
  seasons: Season[];
  activeSlug: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  const selectedSlug = searchParams.get("season") || activeSlug || "";
  const current =
    seasons.find((s) => s.slug === selectedSlug) ??
    seasons.find((s) => s.slug === activeSlug) ??
    seasons[0] ??
    null;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const select = (slug: string) => {
    setOpen(false);
    if (slug === selectedSlug) return;
    const params = new URLSearchParams(searchParams.toString());
    // Keep the URL clean when picking the active season.
    if (slug && slug !== activeSlug) params.set("season", slug);
    else params.delete("season");
    const qs = params.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname));
  };

  if (!current) return null;

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className="inline-flex items-center gap-2 max-w-[180px] sm:max-w-[220px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-70 transition-colors"
      >
        {pending ? (
          <svg className="animate-spin h-4 w-4 text-orange-500 flex-shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <i className="fi fi-rr-layers text-orange-500 flex-shrink-0" />
        )}
        <span className="truncate">{current.name}</span>
        {current.slug === activeSlug && (
          <span className="hidden sm:inline text-[10px] font-bold uppercase text-green-600 flex-shrink-0">
            Aktif
          </span>
        )}
        <i
          className={`fi fi-rr-angle-small-down text-gray-400 flex-shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-60 max-w-[80vw] bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden py-1">
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Pilih Season
          </p>
          <div className="max-h-72 overflow-y-auto">
            {seasons.map((s) => {
              const isSelected = s.slug === selectedSlug;
              const isActive = s.slug === activeSlug;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => select(s.slug)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors ${
                    isSelected ? "bg-orange-50" : "hover:bg-gray-50"
                  }`}
                >
                  <i
                    className={`fi ${isActive ? "fi-rr-badge-check" : "fi-rr-layers"} text-sm flex-shrink-0 ${
                      isActive ? "text-green-500" : "text-gray-400"
                    }`}
                  />
                  <span
                    className={`flex-1 min-w-0 truncate text-sm font-semibold ${
                      isSelected ? "text-orange-700" : "text-gray-700"
                    }`}
                  >
                    {s.name}
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-bold uppercase text-green-600 flex-shrink-0">
                      Aktif
                    </span>
                  )}
                  {isSelected && (
                    <i className="fi fi-rr-check text-orange-500 text-xs flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
