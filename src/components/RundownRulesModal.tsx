"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

const RUNDOWN = [
  "Datang ke lokasi mulai jam 15.00 WIB (pertandingan mulai jam 16.00 WIB)",
  "Registrasi ulang/checklog di meja panitia (depan kasir)",
  "Pengecekan identitas, ID & server ML (jika tidak sesuai → gugur)",
  "Panitia memberi nomor meja, duduk sesuai nomor yang diberikan",
];

const RULES = [
  "Wajib pakai kuota + WiFi (jika lag, bukan tanggung jawab panitia)",
  "Tidak boleh ikut lomba lain",
  "Tidak boleh pakai akun sharing (hindari double login)",
  "Chat all & radio dilarang (contoh: well played, good game). Toleransi 1x kesalahan (dianggap tidak sengaja); jika 2x, silakan lapor panitia dengan bukti screenshot",
  "Emote diperbolehkan",
  "No cheat, no drone map, no maphack, dll",
  "Tidak boleh baper/dendam setelah match",
  "Wajib bawa stopkontak (panitia hanya sediakan 2–3 colokan)",
  "Disarankan bawa cooler/kipas HP",
];

export default function RundownRulesModal() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
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
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-5 flex items-center gap-3 flex-shrink-0">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <i className="fi fi-rr-list-check text-white text-lg" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-black text-white">Rundown &amp; Peraturan</h3>
                <p className="text-white/80 text-xs">Warkop Sippo Tournament</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 text-white flex items-center justify-center flex-shrink-0 transition-colors"
              >
                <i className="fi fi-rr-cross-small text-lg" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-6 overflow-y-auto">
              <div>
                <h4 className="flex items-center gap-2 font-black text-gray-900 mb-3">
                  <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
                    <i className="fi fi-rr-clock text-sm" />
                  </span>
                  Rundown
                </h4>
                <ol className="space-y-2.5">
                  {RUNDOWN.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-gray-600 leading-relaxed">{item}</p>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h4 className="flex items-center gap-2 font-black text-gray-900 mb-3">
                  <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
                    <i className="fi fi-rr-gavel text-sm" />
                  </span>
                  Peraturan
                </h4>
                <ul className="space-y-2.5">
                  {RULES.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <i className="fi fi-rr-angle-right text-orange-400 text-xs mt-1 flex-shrink-0" />
                      <p className="text-sm text-gray-600 leading-relaxed">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div className="text-center mt-6">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-orange-200 text-orange-600 font-bold text-sm shadow-sm hover:bg-orange-50 hover:shadow-md transition-all btn-press"
        >
          <i className="fi fi-rr-list-check" />
          Lihat Rundown &amp; Peraturan
        </button>
      </div>

      {mounted && createPortal(modal, document.body)}
    </>
  );
}
