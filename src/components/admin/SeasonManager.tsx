"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { Season } from "@/db/schema";

export default function SeasonManager({
  seasons,
}: {
  seasons: Season[];
}) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [maxSlots, setMaxSlots] = useState("100");
  const [makeActive, setMakeActive] = useState(true);

  const call = async (body: unknown, method: "POST" | "PATCH", busy: string, ok: string) => {
    setBusyKey(busy);
    try {
      const res = await fetch("/api/admin/seasons", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(ok);
        router.refresh();
      } else {
        toast.error(json.message || "Gagal memproses season");
      }
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setBusyKey(null);
    }
  };

  const submitCreate = async () => {
    await call(
      {
        name,
        slug,
        maxSlots: Number(maxSlots),
        makeActive,
        registrationOpen: true,
      },
      "POST",
      "create",
      "Season berhasil dibuat"
    );
    setName("");
    setSlug("");
    setMaxSlots("100");
    setMakeActive(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-lg font-black text-gray-900 mb-4">Buat Season Baru</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama season, contoh: Season 2"
            className="input-field w-full px-4 py-3 rounded-xl bg-gray-50 text-sm"
          />
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Slug opsional, contoh: season-2"
            className="input-field w-full px-4 py-3 rounded-xl bg-gray-50 text-sm"
          />
          <input
            value={maxSlots}
            onChange={(e) => setMaxSlots(e.target.value)}
            placeholder="Maks slot"
            className="input-field w-full px-4 py-3 rounded-xl bg-gray-50 text-sm"
          />
        </div>
        <label className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600">
          <input
            type="checkbox"
            checked={makeActive}
            onChange={(e) => setMakeActive(e.target.checked)}
            className="rounded border-gray-300"
          />
          Jadikan season aktif setelah dibuat
        </label>
        <div className="mt-4">
          <button
            onClick={submitCreate}
            disabled={busyKey === "create" || name.trim().length < 2}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-sm disabled:opacity-60 btn-press"
          >
            {busyKey === "create" ? <Spinner /> : <i className="fi fi-rr-plus" />}
            Buat Season
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {seasons.map((season) => (
          <div key={season.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-black text-gray-900">{season.name}</h3>
                  {season.isActive && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[11px] font-bold uppercase tracking-wide">
                      <i className="fi fi-rr-badge-check" />
                      Aktif
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1">Slug: {season.slug}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Maks slot: <span className="font-bold text-gray-800">{season.maxSlots}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Pendaftaran:{" "}
                  <span className={season.registrationOpen ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
                    {season.registrationOpen ? "Dibuka" : "Ditutup"}
                  </span>
                </p>
              </div>
              {!season.isActive && (
                <button
                  onClick={() =>
                    call(
                      { action: "activate", seasonId: season.id },
                      "PATCH",
                      `activate:${season.id}`,
                      "Season aktif diperbarui"
                    )
                  }
                  disabled={busyKey === `activate:${season.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
                >
                  {busyKey === `activate:${season.id}` ? <Spinner /> : <i className="fi fi-rr-power" />}
                  Aktifkan
                </button>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() =>
                  call(
                    {
                      action: "settings",
                      seasonId: season.id,
                      registrationOpen: !season.registrationOpen,
                      maxSlots: season.maxSlots,
                    },
                    "PATCH",
                    `open:${season.id}`,
                    season.registrationOpen
                      ? "Pendaftaran season ditutup"
                      : "Pendaftaran season dibuka"
                  )
                }
                disabled={busyKey === `open:${season.id}`}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-60 ${
                  season.registrationOpen
                    ? "bg-red-50 text-red-500 hover:bg-red-100"
                    : "bg-green-50 text-green-600 hover:bg-green-100"
                }`}
              >
                {busyKey === `open:${season.id}` ? <Spinner /> : <i className={`fi ${season.registrationOpen ? "fi-rr-lock" : "fi-rr-lock-open-alt"}`} />}
                {season.registrationOpen ? "Tutup Pendaftaran" : "Buka Pendaftaran"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
