"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import type { Registration } from "@/db/schema";
import type { RegistrationWithProof } from "@/lib/registrations";

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Player = { name: string | null; mlId: string | null; server: string | null };

function mainPlayers(r: Registration): Player[] {
  return [
    { name: r.player1Name, mlId: r.player1MlId, server: r.player1Server },
    { name: r.player2Name, mlId: r.player2MlId, server: r.player2Server },
    { name: r.player3Name, mlId: r.player3MlId, server: r.player3Server },
    { name: r.player4Name, mlId: r.player4MlId, server: r.player4Server },
    { name: r.player5Name, mlId: r.player5MlId, server: r.player5Server },
  ];
}

function substitutes(r: Registration): Player[] {
  return [
    { name: r.sub1Name, mlId: r.sub1MlId, server: r.sub1Server },
    { name: r.sub2Name, mlId: r.sub2MlId, server: r.sub2Server },
  ].filter((p) => p.name);
}

function waLink(phone: string) {
  return `https://wa.me/${phone.replace(/[^0-9]/g, "")}`;
}

export default function PesertaTable({
  data,
  isSuperadmin = false,
}: {
  data: RegistrationWithProof[];
  isSuperadmin?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "confirmed">("all");
  const [selected, setSelected] = useState<RegistrationWithProof | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RegistrationWithProof | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const refreshingRef = useRef(false);

  const updateStatus = async (
    reg: RegistrationWithProof,
    status: "pending" | "confirmed"
  ) => {
    setUpdatingId(reg.id);
    try {
      const res = await fetch(`/api/admin/registrations/${reg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(
          status === "confirmed" ? "Pendaftaran dikonfirmasi" : "Konfirmasi dibatalkan"
        );
        setSelected((s) => (s && s.id === reg.id ? { ...s, status } : s));
        router.refresh();
      } else {
        toast.error(json.message || "Gagal memperbarui status");
      }
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/registrations/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Data peserta dihapus");
        setDeleteTarget(null);
        router.refresh();
      } else {
        toast.error(json.message || "Gagal menghapus");
      }
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setDeleting(false);
    }
  };

  const refresh = () => {
    refreshingRef.current = true;
    startRefresh(() => router.refresh());
  };

  // Toast once the refreshed data has finished loading.
  useEffect(() => {
    if (!isRefreshing && refreshingRef.current) {
      refreshingRef.current = false;
      toast.success("Data diperbarui");
    }
  }, [isRefreshing]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((r) => {
      if (statusFilter !== "all" && (r.status ?? "pending") !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        r.teamName.toLowerCase().includes(q) ||
        r.leaderName.toLowerCase().includes(q) ||
        r.leaderWhatsapp.toLowerCase().includes(q)
      );
    });
  }, [data, query, statusFilter]);

  const counts = useMemo(
    () => ({
      all: data.length,
      pending: data.filter((r) => (r.status ?? "pending") === "pending").length,
      confirmed: data.filter((r) => r.status === "confirmed").length,
    }),
    [data]
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-gray-100">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
          <i className="fi fi-rr-users text-orange-500" />
          Daftar Peserta
          <span className="text-xs font-semibold text-gray-400">
            ({filtered.length})
          </span>
        </h2>
        <div className="flex items-center gap-2 sm:ml-auto">
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <i className="fi fi-rr-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari tim, ketua, WhatsApp..."
              className="input-field w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-400 text-sm"
            />
          </div>
          <button
            onClick={refresh}
            disabled={isRefreshing}
            title="Muat ulang data terbaru"
            aria-label="Muat ulang data"
            className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 disabled:opacity-60 transition-colors btn-press"
          >
            <i className={`fi fi-rr-refresh ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 overflow-x-auto">
        {(
          [
            { key: "all", label: "Semua" },
            { key: "pending", label: "Menunggu" },
            { key: "confirmed", label: "Terkonfirmasi" },
          ] as const
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors
              ${
                statusFilter === f.key
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
          >
            {f.label}
            <span
              className={`px-1.5 rounded-full text-[10px] ${
                statusFilter === f.key ? "bg-white/25" : "bg-white"
              }`}
            >
              {counts[f.key]}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 mx-auto flex items-center justify-center mb-3">
            <i className="fi fi-rr-inbox text-gray-300 text-2xl" />
          </div>
          <p className="text-sm text-gray-400">
            {data.length === 0
              ? "Belum ada peserta terdaftar."
              : "Tidak ada hasil yang cocok."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden lg:block overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="px-5 py-3 w-10">#</th>
                  <th className="px-5 py-3">Nama Tim</th>
                  <th className="px-5 py-3">Ketua</th>
                  <th className="px-5 py-3">WhatsApp</th>
                  <th className="px-5 py-3 text-center">Slot</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Terdaftar</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((r, i) => (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-gray-400 font-medium">{i + 1}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-gray-800">{r.teamName}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{r.leaderName}</td>
                    <td className="px-5 py-3.5">
                      <a
                        href={waLink(r.leaderWhatsapp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-green-600 inline-flex items-center gap-1.5"
                      >
                        <i className="fi fi-brands-whatsapp text-green-500" />
                        {r.leaderWhatsapp}
                      </a>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center min-w-[1.75rem] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-bold text-xs">
                        {r.slot}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelected(r)}
                          title="Lihat detail"
                          className="w-8 h-8 rounded-lg text-gray-500 hover:bg-orange-50 hover:text-orange-600 flex items-center justify-center transition-colors"
                        >
                          <i className="fi fi-rr-eye" />
                        </button>
                        {isSuperadmin && (
                          <>
                            <ConfirmToggle
                              status={r.status}
                              loading={updatingId === r.id}
                              onToggle={() =>
                                updateStatus(
                                  r,
                                  r.status === "confirmed" ? "pending" : "confirmed"
                                )
                              }
                            />
                            <Link
                              href={`/admin/peserta/${r.id}/edit`}
                              title="Edit"
                              className="w-8 h-8 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-colors"
                            >
                              <i className="fi fi-rr-edit" />
                            </Link>
                            <button
                              onClick={() => setDeleteTarget(r)}
                              title="Hapus"
                              className="w-8 h-8 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors"
                            >
                              <i className="fi fi-rr-trash" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: row cards */}
          <div className="lg:hidden divide-y divide-gray-50">
            {filtered.map((r, i) => (
              <div key={r.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0">
                    <i className="fi fi-rr-shield text-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800 truncate">
                        {r.teamName}
                      </p>
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-bold text-[11px] flex-shrink-0">
                        {r.slot} slot
                      </span>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      #{i + 1} • {formatDate(r.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-400 font-medium">Ketua</p>
                    <p className="text-gray-700 font-semibold truncate">
                      {r.leaderName}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-400 font-medium">WhatsApp</p>
                    <a
                      href={waLink(r.leaderWhatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-700 font-semibold inline-flex items-center gap-1 truncate hover:text-green-600"
                    >
                      <i className="fi fi-brands-whatsapp text-green-500" />
                      {r.leaderWhatsapp}
                    </a>
                  </div>
                </div>

                <div className="mt-3 flex items-stretch gap-2">
                  <button
                    onClick={() => setSelected(r)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-orange-200 text-orange-600 font-semibold text-sm hover:bg-orange-50 transition-colors"
                  >
                    <i className="fi fi-rr-eye" />
                    Lihat Detail
                  </button>
                  {isSuperadmin && (
                    <>
                      <ConfirmToggle
                        status={r.status}
                        loading={updatingId === r.id}
                        onToggle={() =>
                          updateStatus(
                            r,
                            r.status === "confirmed" ? "pending" : "confirmed"
                          )
                        }
                        size="lg"
                      />
                      <Link
                        href={`/admin/peserta/${r.id}/edit`}
                        aria-label="Edit peserta"
                        title="Edit"
                        className="w-11 flex-shrink-0 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-95 transition-all"
                      >
                        <i className="fi fi-rr-edit text-base" />
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(r)}
                        aria-label="Hapus peserta"
                        title="Hapus"
                        className="w-11 flex-shrink-0 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 active:scale-95 transition-all"
                      >
                        <i className="fi fi-rr-trash text-base" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Detail modal */}
      <DetailModal
        registration={selected}
        isSuperadmin={isSuperadmin}
        updating={selected ? updatingId === selected.id : false}
        onToggleStatus={(reg) =>
          updateStatus(reg, reg.status === "confirmed" ? "pending" : "confirmed")
        }
        onClose={() => setSelected(null)}
      />

      {/* Delete confirmation (superadmin) */}
      <DeleteConfirmModal
        registration={deleteTarget}
        deleting={deleting}
        onCancel={() => !deleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function DeleteConfirmModal({
  registration,
  deleting,
  onCancel,
  onConfirm,
}: {
  registration: RegistrationWithProof | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {registration && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden p-6 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-red-50 mx-auto flex items-center justify-center mb-4">
              <i className="fi fi-rr-trash text-red-500 text-2xl" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-1">Hapus Peserta?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Tim{" "}
              <span className="font-bold text-gray-800">
                {registration.teamName}
              </span>{" "}
              akan dihapus permanen beserta bukti pembayarannya. Tindakan ini
              tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={deleting}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                Batal
              </button>
              <button
                onClick={onConfirm}
                disabled={deleting}
                className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm disabled:opacity-60 btn-press inline-flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Menghapus...
                  </>
                ) : (
                  <>
                    <i className="fi fi-rr-trash" />
                    Hapus
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DetailModal({
  registration,
  isSuperadmin,
  updating,
  onToggleStatus,
  onClose,
}: {
  registration: RegistrationWithProof | null;
  isSuperadmin: boolean;
  updating: boolean;
  onToggleStatus: (reg: RegistrationWithProof) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!registration) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [registration, onClose]);

  return (
    <AnimatePresence>
      {registration && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[88vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-5 flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <i className="fi fi-rr-shield text-white text-lg" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white truncate">
                    {registration.teamName}
                  </h3>
                  <StatusBadge status={registration.status} onDark />
                </div>
                <p className="text-white/80 text-xs">
                  {registration.slot} slot • Terdaftar{" "}
                  {formatDate(registration.createdAt)}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Tutup"
                className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 text-white flex items-center justify-center flex-shrink-0 transition-colors"
              >
                <i className="fi fi-rr-cross-small text-lg" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Info tim */}
              <div className="grid grid-cols-2 gap-3">
                <InfoBox label="Ketua Tim" value={registration.leaderName} icon="fi-rr-user" />
                <a
                  href={waLink(registration.leaderWhatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-50 rounded-xl p-3 hover:bg-green-50 transition-colors block"
                >
                  <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                    <i className="fi fi-brands-whatsapp text-green-500" />
                    WhatsApp
                  </p>
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {registration.leaderWhatsapp}
                  </p>
                </a>
              </div>

              <PlayerList
                title="Pemain Inti"
                icon="fi-rr-sword"
                players={mainPlayers(registration)}
                captainFirst
              />
              {substitutes(registration).length > 0 && (
                <PlayerList
                  title="Pemain Cadangan"
                  icon="fi-rr-refresh"
                  players={substitutes(registration)}
                />
              )}

              {/* Bukti Pembayaran */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                  <i className="fi fi-rr-receipt text-orange-500 text-sm" />
                  <h4 className="font-bold text-xs text-gray-700">
                    Bukti Pembayaran
                  </h4>
                </div>
                <div className="p-4">
                  {registration.paymentProofUrl ? (
                    <a
                      href={registration.paymentProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group"
                      title="Buka gambar ukuran penuh"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={registration.paymentProofUrl}
                        alt="Bukti pembayaran"
                        className="w-full max-h-72 object-contain rounded-lg border border-gray-100 bg-gray-50"
                      />
                      <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 group-hover:text-orange-700">
                        <i className="fi fi-rr-expand" />
                        Buka ukuran penuh
                      </span>
                    </a>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center mb-2">
                        <i className="fi fi-rr-ban text-gray-300 text-lg" />
                      </div>
                      <p className="text-xs text-gray-400">
                        Belum ada bukti pembayaran.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Confirm action (superadmin) */}
            {isSuperadmin && (
              <div className="p-4 border-t border-gray-100 bg-white">
                <button
                  onClick={() => onToggleStatus(registration)}
                  disabled={updating}
                  className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-60 btn-press transition-colors
                    ${
                      registration.status === "confirmed"
                        ? "border-2 border-gray-200 text-gray-600 hover:bg-gray-50"
                        : "bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-200"
                    }`}
                >
                  {updating ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Memproses...
                    </>
                  ) : registration.status === "confirmed" ? (
                    <>
                      <i className="fi fi-rr-rotate-left" />
                      Batalkan Konfirmasi
                    </>
                  ) : (
                    <>
                      <i className="fi fi-rr-check-circle" />
                      Konfirmasi Pendaftaran
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function InfoBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
        <i className={`fi ${icon} text-gray-400`} />
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
    </div>
  );
}

function PlayerList({
  title,
  icon,
  players,
  captainFirst,
}: {
  title: string;
  icon: string;
  players: Player[];
  captainFirst?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <i className={`fi ${icon} text-orange-500 text-sm`} />
        <h4 className="font-bold text-xs text-gray-700">{title}</h4>
      </div>
      <ul className="divide-y divide-gray-50">
        {players.map((p, i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-2.5">
            <span className="w-6 h-6 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {p.name || "-"}
                {captainFirst && i === 0 && (
                  <span className="ml-1.5 text-[10px] font-bold text-orange-500 uppercase">
                    Captain
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-400">
                ID: {p.mlId || "-"} • Server: {p.server || "-"}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusBadge({
  status,
  onDark = false,
}: {
  status: string;
  onDark?: boolean;
}) {
  const confirmed = status === "confirmed";
  if (onDark) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide flex-shrink-0 bg-white/25 text-white">
        <i className={`fi ${confirmed ? "fi-rr-check-circle" : "fi-rr-clock"}`} />
        {confirmed ? "Terkonfirmasi" : "Menunggu"}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0
        ${confirmed ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
    >
      <i className={`fi ${confirmed ? "fi-rr-check-circle" : "fi-rr-clock"}`} />
      {confirmed ? "Terkonfirmasi" : "Menunggu"}
    </span>
  );
}

function ConfirmToggle({
  status,
  loading,
  onToggle,
  size = "sm",
}: {
  status: string;
  loading: boolean;
  onToggle: () => void;
  size?: "sm" | "lg";
}) {
  const confirmed = status === "confirmed";
  const dim = size === "lg" ? "w-11 flex-shrink-0 rounded-xl" : "w-8 h-8 rounded-lg";
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      title={confirmed ? "Batalkan konfirmasi" : "Konfirmasi pendaftaran"}
      aria-label={confirmed ? "Batalkan konfirmasi" : "Konfirmasi pendaftaran"}
      className={`${dim} flex items-center justify-center transition-all active:scale-95 disabled:opacity-50
        ${confirmed ? "bg-gray-100 text-gray-500 hover:bg-gray-200" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <i className={`fi ${confirmed ? "fi-rr-rotate-left" : "fi-rr-check"} ${size === "lg" ? "text-base" : ""}`} />
      )}
    </button>
  );
}
