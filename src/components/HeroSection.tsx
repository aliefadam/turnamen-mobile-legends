"use client";

import { motion } from "framer-motion";

export default function HeroSection({
  seasonName,
  registrationOpen,
}: {
  seasonName: string | null;
  registrationOpen: boolean;
}) {
  return (
    <section className="relative w-full overflow-hidden bg-white">
      {/* Background: light white + orange theme */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-50 via-amber-50/60 to-white" />
        <div className="absolute inset-0 dot-grid opacity-60" />
      </div>

      {/* Decorative orbs */}
      <div className="absolute -top-10 left-1/4 w-72 h-72 bg-amber-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-16 right-4 w-56 h-56 bg-orange-300/30 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-16 pb-24 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-white border border-orange-100 shadow-sm rounded-full px-4 py-2 mb-6"
        >
          <span
            className={`w-2 h-2 rounded-full animate-pulse ${
              registrationOpen ? "bg-green-500" : "bg-red-400"
            }`}
          />
          <span className="text-orange-600 text-xs font-semibold uppercase tracking-widest">
            {registrationOpen ? "Pendaftaran Dibuka" : "Pendaftaran Ditutup"}
          </span>
        </motion.div>

        {seasonName && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-sm font-bold text-orange-600 mb-3"
          >
            {seasonName}
          </motion.p>
        )}

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.1] mb-4 tracking-tight"
        >
          Turnamen
          <br />
          <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Mobile Legends
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="inline-flex flex-wrap items-center justify-center gap-2 text-gray-500 text-sm sm:text-base font-medium mb-8"
        >
          <i className="fi fi-rr-marker text-orange-500" />
          Warkop Sippo Wiyung
          <span className="text-orange-200">•</span>
          <i className="fi fi-rr-calendar text-orange-500" />
          9 Agustus 2026
        </motion.p>

        {/* Prize Pool Highlight */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3, type: "spring" }}
          className="flex justify-center"
        >
          <div className="relative bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl px-8 py-5 shadow-2xl shadow-orange-500/30 pulse-glow">
            <div className="flex items-center justify-center gap-2 mb-1">
              <i className="fi fi-rr-trophy text-white/90 text-sm" />
              <p className="text-white/90 text-xs font-semibold uppercase tracking-widest">
                Total Prize Pool
              </p>
            </div>
            <p className="text-white text-3xl sm:text-4xl font-black">
              ±Rp 1.500.000
            </p>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-8"
        >
          <a
            href="#daftar"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl hover:-translate-y-0.5 transition-all btn-press"
          >
            <i className="fi fi-rr-rocket" />
            Daftarkan Tim Sekarang
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex flex-col items-center gap-1"
          >
            <span className="text-gray-400 text-xs font-medium">Scroll</span>
            <i className="fi fi-rr-angle-small-down text-orange-400 text-lg" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
