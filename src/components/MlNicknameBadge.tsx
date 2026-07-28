"use client";

import { useEffect, useState } from "react";

type LookupState =
  | { status: "idle" }
  | { status: "loading"; key: string }
  | {
      status: "success";
      key: string;
      nickname: string;
      country: string | null;
    }
  | { status: "error"; key: string; message: string };

export default function MlNicknameBadge({
  mlId,
  server,
  compact = false,
}: {
  mlId?: string | null;
  server?: string | null;
  compact?: boolean;
}) {
  const [state, setState] = useState<LookupState>({ status: "idle" });
  const cleanId = mlId?.trim() ?? "";
  const cleanServer = server?.trim() ?? "";
  const ready = /^\d+$/.test(cleanId) && /^\d+$/.test(cleanServer);
  const lookupKey = `${cleanId}:${cleanServer}`;

  useEffect(() => {
    if (!ready) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setState({ status: "loading", key: lookupKey });
      try {
        const params = new URLSearchParams({
          id: cleanId,
          server: cleanServer,
        });
        const response = await fetch(`/api/mlbb/nickname?${params}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (response.ok && data.success && data.nickname) {
          setState({
            status: "success",
            key: lookupKey,
            nickname: data.nickname,
            country: data.country ?? null,
          });
        } else {
          setState({
            status: "error",
            key: lookupKey,
            message: data.message || "Nickname tidak ditemukan.",
          });
        }
      } catch {
        if (!controller.signal.aborted) {
          setState({
            status: "error",
            key: lookupKey,
            message: "Gagal mengecek nickname.",
          });
        }
      }
    }, 600);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [cleanId, cleanServer, lookupKey, ready]);

  if (!ready) return null;

  if (
    state.status === "idle" ||
    state.key !== lookupKey ||
    state.status === "loading"
  ) {
    return (
      <span
        className={`mt-1.5 inline-flex items-center gap-1.5 text-gray-400 ${
          compact ? "text-[11px]" : "text-xs"
        }`}
      >
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-orange-200 border-t-orange-500" />
        Mengecek nickname...
      </span>
    );
  }

  if (state.status === "error") {
    return (
      <span
        className={`mt-1.5 inline-flex items-center gap-1 text-red-500 ${
          compact ? "text-[11px]" : "text-xs"
        }`}
      >
        <i className="fi fi-rr-cross-circle" />
        {state.message}
      </span>
    );
  }

  if (state.status !== "success") return null;

  return (
    <span
      className={`mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 font-bold text-emerald-700 ${
        compact ? "text-[11px]" : "text-xs"
      }`}
      title={`Nickname Mobile Legends${state.country ? ` · ${state.country}` : ""}`}
    >
      <i className="fi fi-rr-badge-check shrink-0" />
      <span className="truncate">{state.nickname}</span>
      {state.country && (
        <span className="font-medium text-emerald-500">· {state.country}</span>
      )}
    </span>
  );
}
