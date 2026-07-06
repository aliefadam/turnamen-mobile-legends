"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import type { BracketMatch } from "@/db/schema";
import type { BracketData } from "@/lib/bracket";
import BracketBoard from "@/components/BracketBoard";

export default function BracketManager({
  bracket,
  isSuperadmin,
  confirmedCount,
}: {
  bracket: BracketData;
  isSuperadmin: boolean;
  confirmedCount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [mode, setMode] = useState<"edit" | "arrange">("edit");
  const [editMatch, setEditMatch] = useState<BracketMatch | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const dragSrc = useRef<{ matchId: number; side: 1 | 2 } | null>(null);

  const call = async (
    method: string,
    body?: unknown,
    okMsg?: string,
    action?: string
  ): Promise<boolean> => {
    setBusy(true);
    setBusyAction(action ?? null);
    try {
      const res = await fetch("/api/admin/bracket", {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json();
      if (json.success) {
        if (okMsg) toast.success(okMsg);
        router.refresh();
        return true;
      }
      toast.error(json.message || "Gagal memproses");
      return false;
    } catch {
      toast.error("Gagal terhubung ke server");
      return false;
    } finally {
      setBusy(false);
      setBusyAction(null);
    }
  };

  const generate = () => {
    if (!bracket.exists) {
      call("POST", undefined, "Bracket dibuat");
      return;
    }
    setConfirmState({
      title: "Buat Ulang Bracket?",
      message:
        "Bracket & seluruh hasil pertandingan saat ini akan dihapus, lalu disusun ulang dari tim terkonfirmasi.",
      confirmLabel: "Buat Ulang",
      icon: "fi-rr-refresh",
      onConfirm: () => call("POST", undefined, "Bracket dibuat"),
    });
  };
  const reset = () => {
    setConfirmState({
      title: "Hapus Bracket?",
      message: "Seluruh bracket beserta hasil pertandingan akan dihapus permanen.",
      confirmLabel: "Hapus",
      danger: true,
      icon: "fi-rr-trash",
      onConfirm: () => call("DELETE", undefined, "Bracket dihapus"),
    });
  };
  const changeBo = (round: number, bestOf: number) =>
    call("PATCH", { action: "roundBo", round, bestOf }, "Best-of diperbarui", "roundBo");
  const saveResult = async (matchId: number, s1: number, s2: number) => {
    const ok = await call(
      "PATCH",
      { action: "result", matchId, score1: s1, score2: s2 },
      "Skor disimpan",
      "result"
    );
    if (ok) setEditMatch(null);
  };
  const setPlayed = (matchId: number, played: boolean) =>
    call(
      "PATCH",
      { action: "played", matchId, played },
      played ? "Pertandingan ditandai sudah bermain" : "Status bermain dibatalkan",
      `played:${matchId}`
    );

  const handleDragStart = (matchId: number, side: 1 | 2) => {
    dragSrc.current = { matchId, side };
  };
  const handleDrop = (matchId: number, side: 1 | 2) => {
    const src = dragSrc.current;
    dragSrc.current = null;
    if (!src) return;
    if (src.matchId === matchId && src.side === side) return;
    call(
      "PATCH",
      { action: "swap", matchAId: src.matchId, sideA: src.side, matchBId: matchId, sideB: side },
      "Posisi tim ditukar",
      "swap"
    );
  };

  // ---- Empty state ----
  if (!bracket.exists) {
    return (
      <div className="space-y-6">
        <Header isSuperadmin={isSuperadmin} />
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 mx-auto flex items-center justify-center mb-4">
            <i className="fi fi-rr-sitemap text-gray-300 text-2xl" />
          </div>
          <h2 className="font-black text-gray-900 mb-1">Bracket belum dibuat</h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-5">
            {isSuperadmin
              ? `Ada ${confirmedCount} slot terkonfirmasi. Buat bracket untuk mulai menyusun bagan pertandingan.`
              : "Bracket akan muncul di sini setelah superadmin membuatnya."}
          </p>
          {isSuperadmin && (
            <button
              onClick={generate}
              disabled={busy || confirmedCount < 2}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-sm shadow-md shadow-orange-200 disabled:opacity-60 btn-press"
            >
              {busy ? (
                <>
                  <Spinner />
                  Memproses...
                </>
              ) : (
                <>
                  <i className="fi fi-rr-sitemap" />
                  Buat Bracket
                </>
              )}
            </button>
          )}
          {isSuperadmin && confirmedCount < 2 && (
            <p className="text-xs text-red-400 mt-2">Butuh minimal 2 slot terkonfirmasi.</p>
          )}
        </div>
      </div>
    );
  }

  const boardMode = isSuperadmin ? mode : "view";

  return (
    <div className="space-y-6">
      <Header isSuperadmin={isSuperadmin} />

      {isSuperadmin && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => setMode("edit")}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                mode === "edit" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500"
              }`}
            >
              <i className="fi fi-rr-pencil mr-1.5" />
              Input Skor
            </button>
            <button
              onClick={() => setMode("arrange")}
              disabled={bracket.started}
              title={bracket.started ? "Tidak bisa atur posisi setelah pertandingan dimulai" : undefined}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 ${
                mode === "arrange" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
              }`}
            >
              <i className="fi fi-rr-shuffle mr-1.5" />
              Atur Posisi
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={generate}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 disabled:opacity-60"
            >
              <i className="fi fi-rr-refresh" />
              Buat Ulang
            </button>
            <button
              onClick={reset}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-500 font-semibold text-sm hover:bg-red-50 disabled:opacity-60"
            >
              <i className="fi fi-rr-trash" />
              Hapus
            </button>
          </div>

          {mode === "arrange" && (
            <p className="w-full text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2 flex items-center gap-1.5">
              <i className="fi fi-rr-grip-dots" />
              Seret (drag) tim di ronde mana pun yang sudah terisi, lalu jatuhkan ke posisi tim lain pada ronde yang sama untuk menukarnya.
            </p>
          )}
        </div>
      )}

      <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
        <BracketBoard
          rounds={bracket.rounds}
          totalRounds={bracket.totalRounds}
          champion={bracket.champion}
          mode={boardMode}
          onEditMatch={setEditMatch}
          onTogglePlayed={setPlayed}
          busyAction={busyAction}
          onDragStartTeam={handleDragStart}
          onDropTeam={handleDrop}
          onChangeBestOf={changeBo}
        />
        {isSuperadmin && <LoadingOverlay show={busy && busyAction === "swap"} />}
      </div>

      <AnimatePresence>
        {editMatch && (
          <ScoreModal
            match={editMatch}
            busy={busy}
            onClose={() => setEditMatch(null)}
            onSave={saveResult}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        state={confirmState}
        busy={busy}
        onCancel={() => !busy && setConfirmState(null)}
        onConfirm={async () => {
          if (!confirmState) return;
          await confirmState.onConfirm();
          setConfirmState(null);
        }}
      />
    </div>
  );
}

function Header({ isSuperadmin }: { isSuperadmin: boolean }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Bracket</h1>
        <p className="text-sm text-gray-500 mt-1">
          Bagan pertandingan turnamen (single elimination).
        </p>
      </div>
      <Link
        href="/bracket"
        target="_blank"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50"
      >
        <i className="fi fi-rr-link-alt" />
        Halaman Publik
      </Link>
      {!isSuperadmin && null}
    </div>
  );
}

function ScoreModal({
  match,
  busy,
  onClose,
  onSave,
}: {
  match: BracketMatch;
  busy: boolean;
  onClose: () => void;
  onSave: (matchId: number, s1: number, s2: number) => void;
}) {
  const need = Math.ceil(match.bestOf / 2);
  const [s1, setS1] = useState(match.score1);
  const [s2, setS2] = useState(match.score2);

  const opts = Array.from({ length: need + 1 }, (_, i) => i);
  const hasWinner = (s1 === need && s2 < need) || (s2 === need && s1 < need);
  const isInvalid = s1 === need && s2 === need;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-4 flex items-center justify-between">
          <h3 className="font-black text-white flex items-center gap-2">
            <i className="fi fi-rr-pencil" />
            Input Skor
          </h3>
          <span className="text-white/90 text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
            BO{match.bestOf}
          </span>
        </div>
        <div className="p-5 space-y-4">
          <ScoreRow name={match.team1Name ?? "-"} value={s1} onChange={setS1} opts={opts} />
          <div className="text-center text-xs font-bold text-gray-300">VS</div>
          <ScoreRow name={match.team2Name ?? "-"} value={s2} onChange={setS2} opts={opts} />
          <p className="text-xs text-gray-400 text-center">
            {hasWinner
              ? `Pemenang sudah mencapai ${need} kemenangan dan akan lanjut ke babak berikutnya.`
              : `Skor sementara boleh disimpan. Pemenang akan lanjut setelah mencapai ${need} kemenangan.`}
          </p>
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              onClick={() => onSave(match.id, s1, s2)}
              disabled={busy || isInvalid}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-sm shadow-md shadow-orange-200 disabled:opacity-50 btn-press inline-flex items-center justify-center gap-2"
            >
              {busy ? (
                <>
                  <Spinner />
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ScoreRow({
  name,
  value,
  onChange,
  opts,
}: {
  name: string;
  value: number;
  onChange: (v: number) => void;
  opts: number[];
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex-1 min-w-0 font-semibold text-gray-800 text-sm truncate">{name}</span>
      <div className="flex items-center gap-1 flex-shrink-0">
        {opts.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${
              value === o
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel: string;
  icon?: string;
  danger?: boolean;
  onConfirm: () => Promise<unknown> | void;
};

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function LoadingOverlay({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9990] bg-white/25 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ opacity: 0, x: 24, y: -12 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 24, y: -12 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed top-5 right-5 z-[10010]"
          >
            <div className="inline-flex items-center gap-2.5 rounded-2xl border border-orange-100 bg-white/95 px-4 py-3 text-sm font-semibold text-orange-600 shadow-xl shadow-orange-100 backdrop-blur-md">
              <Spinner />
              Memproses...
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ConfirmDialog({
  state,
  busy,
  onCancel,
  onConfirm,
}: {
  state: ConfirmState | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {state && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden p-6 text-center"
          >
            <div
              className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4 ${
                state.danger ? "bg-red-50" : "bg-orange-50"
              }`}
            >
              <i
                className={`fi ${state.icon ?? (state.danger ? "fi-rr-trash" : "fi-rr-info")} text-xl ${
                  state.danger ? "text-red-500" : "text-orange-500"
                }`}
              />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-1">{state.title}</h3>
            <p className="text-sm text-gray-500 mb-6">{state.message}</p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={busy}
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 disabled:opacity-60"
              >
                Batal
              </button>
              <button
                onClick={onConfirm}
                disabled={busy}
                className={`flex-1 px-4 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-60 btn-press inline-flex items-center justify-center gap-2 ${
                  state.danger ? "bg-red-500 hover:bg-red-600" : "bg-gradient-to-r from-amber-400 to-orange-500"
                }`}
              >
                {busy ? (
                  <>
                    <Spinner />
                    Memproses...
                  </>
                ) : (
                  state.confirmLabel
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
